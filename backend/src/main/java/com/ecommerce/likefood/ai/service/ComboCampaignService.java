package com.ecommerce.likefood.ai.service;

import com.ecommerce.likefood.ai.domain.ComboCampaign;
import com.ecommerce.likefood.ai.domain.ComboItem;
import com.ecommerce.likefood.ai.dto.req.ComboGenerateRequestDto;
import com.ecommerce.likefood.ai.dto.req.ComboItemInput;
import com.ecommerce.likefood.ai.dto.req.ManualComboRequestDto;
import com.ecommerce.likefood.ai.dto.res.ComboGenerateResponseDto;
import com.ecommerce.likefood.ai.repository.ComboCampaignRepository;
import com.ecommerce.likefood.storage.service.StorageService;
import com.ecommerce.likefood.storage.enums.StorageObjectType;
import com.ecommerce.likefood.product.domain.Category;
import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductStatus;
import com.ecommerce.likefood.product.domain.ProductVariant;
import com.ecommerce.likefood.product.repository.CategoryRepository;
import com.ecommerce.likefood.product.repository.ProductRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComboCampaignService {

    private final ComboCampaignRepository comboCampaignRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;
    private final StorageService storageService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${likefood.ai.gemini.api-key}")
    private String GEMINI_API_KEY;

    @Value("${likefood.ai.gemini.model:gemini-2.5-flash}")
    private String GEMINI_MODEL;

    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";
    private static final String IMAGEN_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=%s";

    // ─── AI Combo Generation ──────────────────────────────────────────

    @Transactional
    public ComboCampaign generateComboCampaign(ComboGenerateRequestDto request) {
        log.info("Generating combo campaign for hashtag: {}", request.getHashtag());
        
        try {
            // 1. Resolve product names from IDs for AI prompt
            List<Product> resolvedProducts = resolveProducts(request.getItems());
            List<String> productNames = resolvedProducts.stream()
                    .map(Product::getName)
                    .collect(Collectors.toList());

            // 2. Call Gemini to get Combo JSON
            ComboGenerateResponseDto geminiResponse = callGeminiForCombo(request.getHashtag(), productNames);

            // 3. Call Gemini Imagen API to get Image Base64
            String base64Image = callGeminiImagen(geminiResponse.getImagePrompt());
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            
            // 4. Upload the image to S3
            var uploadResponse = storageService.uploadImageBytes(imageBytes, "image/png", "combo-ai.png", StorageObjectType.PRODUCT);
            String imageUrl = storageService.getPublicImageUrl(uploadResponse.getKey());

            // 5. Calculate combo price
            BigDecimal comboPrice = calculateComboPrice(request.getItems(), geminiResponse.getDiscountPercentage());

            // 6. Save items as JSON array (legacy field)
            String itemsJson = objectMapper.writeValueAsString(productNames);

            // 7. Build & Save Campaign
            ComboCampaign campaign = ComboCampaign.builder()
                    .hashtag(request.getHashtag())
                    .comboName(geminiResponse.getComboName())
                    .slogan(geminiResponse.getSlogan())
                    .description(geminiResponse.getDescription())
                    .discountPercentage(geminiResponse.getDiscountPercentage())
                    .imagePrompt(geminiResponse.getImagePrompt())
                    .imageUrl(imageUrl)
                    .items(itemsJson)
                    .comboPrice(comboPrice)
                    .source("AI")
                    .status("DRAFT")
                    .build();
                    
            campaign = comboCampaignRepository.save(campaign);

            // 8. Save ComboItems with product/variant relations
            saveComboItems(campaign, request.getItems());

            return comboCampaignRepository.findById(campaign.getId()).orElse(campaign);

        } catch (Exception e) {
            log.error("Failed to generate combo campaign", e);
            throw new RuntimeException("Lỗi sinh Combo: " + e.getMessage());
        }
    }

    // ─── Manual Combo Creation ────────────────────────────────────────

    @Transactional
    public ComboCampaign createManualCombo(ManualComboRequestDto request) {
        log.info("Creating manual combo: {}", request.getComboName());

        try {
            // 1. Resolve products for validation
            List<Product> resolvedProducts = resolveProducts(request.getItems());
            List<String> productNames = resolvedProducts.stream()
                    .map(Product::getName)
                    .collect(Collectors.toList());

            // 2. Calculate combo price
            BigDecimal comboPrice = calculateComboPrice(request.getItems(), request.getDiscountPercentage());

            // 3. Legacy items JSON
            String itemsJson = objectMapper.writeValueAsString(productNames);

            // 4. Save Campaign
            ComboCampaign campaign = ComboCampaign.builder()
                    .hashtag(request.getHashtag())
                    .comboName(request.getComboName())
                    .description(request.getDescription())
                    .discountPercentage(request.getDiscountPercentage())
                    .imageUrl(request.getImageUrl())
                    .items(itemsJson)
                    .comboPrice(comboPrice)
                    .source("MANUAL")
                    .status("DRAFT")
                    .build();

            campaign = comboCampaignRepository.save(campaign);

            // 5. Save ComboItems
            saveComboItems(campaign, request.getItems());

            return comboCampaignRepository.findById(campaign.getId()).orElse(campaign);

        } catch (Exception e) {
            log.error("Failed to create manual combo", e);
            throw new RuntimeException("Lỗi tạo Combo: " + e.getMessage());
        }
    }

    // ─── Upload Combo Image ───────────────────────────────────────────

    public String uploadComboImage(MultipartFile file) {
        try {
            var uploadResponse = storageService.uploadImage(file, StorageObjectType.PRODUCT);
            return storageService.getPublicImageUrl(uploadResponse.getKey());
        } catch (Exception e) {
            log.error("Failed to upload combo image", e);
            throw new RuntimeException("Lỗi upload ảnh combo: " + e.getMessage());
        }
    }

    // ─── Publish Combo ────────────────────────────────────────────────

    @Transactional
    public ComboCampaign publishCombo(String comboId) {
        ComboCampaign combo = comboCampaignRepository.findById(comboId)
                .orElseThrow(() -> new RuntimeException("Combo not found"));

        if (!"DRAFT".equals(combo.getStatus())) {
            throw new RuntimeException("Combo is already published or in invalid state");
        }

        // Recalculate price if needed
        if (combo.getComboPrice() == null || combo.getComboPrice().compareTo(BigDecimal.ZERO) <= 0) {
            BigDecimal calculatedPrice = calculatePriceFromComboItems(combo);
            combo.setComboPrice(calculatedPrice);
        }

        combo.setStatus("PUBLISHED");
        return comboCampaignRepository.save(combo);
    }

    // ─── Query Methods ────────────────────────────────────────────────

    public List<ComboCampaign> getPublishedCombos() {
        return comboCampaignRepository.findByStatusOrderByCreatedAtDesc("PUBLISHED");
    }

    public List<ComboCampaign> getAllCombos() {
        return comboCampaignRepository.findAllByOrderByCreatedAtDesc();
    }

    public ComboCampaign getComboById(String id) {
        return comboCampaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Combo not found"));
    }

    // ─── Internal Helpers ─────────────────────────────────────────────

    private List<Product> resolveProducts(List<ComboItemInput> items) {
        List<String> productIds = items.stream()
                .map(ComboItemInput::getProductId)
                .distinct()
                .collect(Collectors.toList());

        List<Product> products = productRepository.findAllById(productIds);
        if (products.size() != productIds.size()) {
            throw new RuntimeException("Một số sản phẩm không tồn tại");
        }
        return products;
    }

    private void saveComboItems(ComboCampaign campaign, List<ComboItemInput> items) {
        for (ComboItemInput input : items) {
            Product product = productRepository.findById(input.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + input.getProductId()));

            ProductVariant variant = null;
            if (input.getVariantId() != null && !input.getVariantId().isEmpty()) {
                variant = product.getVariants().stream()
                        .filter(v -> v.getId().equals(input.getVariantId()))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Variant not found: " + input.getVariantId()));
            }

            ComboItem comboItem = ComboItem.builder()
                    .comboCampaign(campaign)
                    .product(product)
                    .variant(variant)
                    .quantity(input.getQuantity() != null ? input.getQuantity() : 1)
                    .build();

            campaign.getComboItems().add(comboItem);
        }
        comboCampaignRepository.save(campaign);
    }

    private BigDecimal calculateComboPrice(List<ComboItemInput> items, Double discountPercentage) {
        BigDecimal totalOriginalPrice = BigDecimal.ZERO;

        for (ComboItemInput input : items) {
            Product product = productRepository.findById(input.getProductId()).orElse(null);
            if (product == null) continue;

            BigDecimal itemPrice;
            int qty = (input.getQuantity() != null ? input.getQuantity() : 1);

            if (input.getVariantId() != null && !input.getVariantId().isEmpty()) {
                // Use specific variant price
                itemPrice = product.getVariants().stream()
                        .filter(v -> v.getId().equals(input.getVariantId()))
                        .map(ProductVariant::getPrice)
                        .findFirst()
                        .orElse(BigDecimal.ZERO);
            } else {
                // Use min variant price as fallback
                itemPrice = product.getVariants().stream()
                        .map(ProductVariant::getPrice)
                        .filter(p -> p != null && p.compareTo(BigDecimal.ZERO) > 0)
                        .min(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);
            }

            totalOriginalPrice = totalOriginalPrice.add(itemPrice.multiply(BigDecimal.valueOf(qty)));
        }

        // Apply discount
        double discountFactor = 1.0 - (discountPercentage / 100.0);
        return totalOriginalPrice.multiply(BigDecimal.valueOf(discountFactor))
                .setScale(0, RoundingMode.HALF_UP);
    }

    private BigDecimal calculatePriceFromComboItems(ComboCampaign combo) {
        BigDecimal total = BigDecimal.ZERO;
        for (ComboItem item : combo.getComboItems()) {
            BigDecimal price;
            if (item.getVariant() != null) {
                price = item.getVariant().getPrice();
            } else {
                price = item.getProduct().getVariants().stream()
                        .map(ProductVariant::getPrice)
                        .filter(p -> p != null && p.compareTo(BigDecimal.ZERO) > 0)
                        .min(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);
            }
            total = total.add(price.multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        double discountFactor = 1.0 - (combo.getDiscountPercentage() / 100.0);
        return total.multiply(BigDecimal.valueOf(discountFactor))
                .setScale(0, RoundingMode.HALF_UP);
    }

    private String buildProductDescription(ComboCampaign combo) {
        StringBuilder sb = new StringBuilder();
        if (combo.getDescription() != null) sb.append(combo.getDescription());
        if (combo.getSlogan() != null) sb.append("\n\n").append(combo.getSlogan());
        return sb.toString().trim();
    }

    // ─── Gemini AI Calls ──────────────────────────────────────────────

    private ComboGenerateResponseDto callGeminiForCombo(String hashtag, List<String> productNames) throws JsonProcessingException {
        String prompt = buildPrompt(hashtag, productNames);

        Map<String, Object> requestBody = new HashMap<>();
        
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("responseMimeType", "application/json");
        requestBody.put("generationConfig", generationConfig);

        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        
        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));
        requestBody.put("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        String url = String.format(GEMINI_BASE_URL, GEMINI_MODEL, GEMINI_API_KEY);

        log.info("Calling Gemini API for Combo Generation...");
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        String jsonText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText("").trim();
        
        return objectMapper.readValue(jsonText, ComboGenerateResponseDto.class);
    }

    private String callGeminiImagen(String prompt) throws JsonProcessingException {
        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> instance = new HashMap<>();
        instance.put("prompt", prompt);
        requestBody.put("instances", List.of(instance));
        
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("sampleCount", 1);
        requestBody.put("parameters", parameters);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        String url = String.format(IMAGEN_API_URL, GEMINI_API_KEY);
        log.info("Calling Gemini Imagen API for image generation...");
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
        
        JsonNode root = objectMapper.readTree(response.getBody());
        return root.path("predictions").get(0).path("bytesBase64Encoded").asText();
    }

    private String buildPrompt(String hashtag, List<String> productNames) {
        String itemsJoined = String.join(", ", productNames);
        return """
            Bạn là Giám đốc Marketing GenZ tài năng. Nhiệm vụ của bạn là tạo ra một Combo bán hàng cực "dính" dựa trên trend TikTok hiện tại.
            
            Trend (Hashtag): %s
            Các món ăn trong Combo: %s
            
            Yêu cầu:
            1. Tạo một cái tên Combo thật "giật tít", bắt trend.
            2. Một câu slogan ngắn gọn, kích thích mua.
            3. Mô tả (description) đậm chất GenZ, mặn mòi, thuyết phục khách mua combo này.
            4. Đề xuất mức giảm giá hợp lý (từ 5 đến 30 phần trăm) dưới dạng số nguyên/thập phân.
            5. Tạo một Prompt tạo ảnh (Image Prompt) HOÀN TOÀN BẰNG TIẾNG ANH (không được có tiếng Việt), mô tả chi tiết bố cục, ánh sáng, background phù hợp với hashtag và món ăn để gửi cho AI vẽ, có thêm "no text".
            
            LƯU Ý: Phải trả kết quả CHỈ bằng JSON thuần túy theo cấu trúc sau (KHÔNG dùng markdown):
            {
              "combo_name": "...",
              "slogan": "...",
              "description": "...",
              "discount_percentage": 15.0,
              "image_prompt": "..."
            }
            """.formatted(hashtag, itemsJoined);
    }
}
