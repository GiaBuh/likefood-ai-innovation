package com.ecommerce.likefood.ai.service;

import com.ecommerce.likefood.ai.domain.ComboCampaign;
import com.ecommerce.likefood.ai.dto.req.ComboGenerateRequestDto;
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

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    @Transactional
    public ComboCampaign generateComboCampaign(ComboGenerateRequestDto request) {
        log.info("Generating combo campaign for hashtag: {}", request.getHashtag());
        
        try {
            // 1. Call Gemini to get Combo JSON
            ComboGenerateResponseDto geminiResponse = callGeminiForCombo(request);

            // 2. Call Gemini Imagen API to get Image Base64
            String base64Image = callGeminiImagen(geminiResponse.getImagePrompt());
            byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Image);
            
            // 3. Upload the image to S3
            var uploadResponse = storageService.uploadImageBytes(imageBytes, "image/png", "combo-ai.png", StorageObjectType.PRODUCT);
            String imageUrl = storageService.getPublicImageUrl(uploadResponse.getKey());

            // 4. Save items as JSON array
            String itemsJson = objectMapper.writeValueAsString(request.getItems());

            // 5. Save to Database
            ComboCampaign campaign = ComboCampaign.builder()
                    .hashtag(request.getHashtag())
                    .comboName(geminiResponse.getComboName())
                    .slogan(geminiResponse.getSlogan())
                    .description(geminiResponse.getDescription())
                    .discountPercentage(geminiResponse.getDiscountPercentage())
                    .imagePrompt(geminiResponse.getImagePrompt())
                    .imageUrl(imageUrl)
                    .items(itemsJson)
                    .status("DRAFT")
                    .build();
                    
            return comboCampaignRepository.save(campaign);

        } catch (Exception e) {
            log.error("Failed to generate combo campaign", e);
            throw new RuntimeException("Lỗi sinh Combo: " + e.getMessage());
        }
    }

    @Transactional
    public Product publishCombo(String comboId) {
        ComboCampaign combo = comboCampaignRepository.findById(comboId)
                .orElseThrow(() -> new RuntimeException("Combo not found"));

        if (!"DRAFT".equals(combo.getStatus())) {
            throw new RuntimeException("Combo is already published or in invalid state");
        }

        // 1. Get or Create a category for AI Combos
        Category aiCategory = categoryRepository.findByName("AI Combos").orElseGet(() -> {
            Category newCategory = Category.builder()
                    .name("AI Combos")
                    .build();
            return categoryRepository.save(newCategory);
        });

        // 2. Calculate combo price from actual products
        java.math.BigDecimal totalOriginalPrice = java.math.BigDecimal.ZERO;
        try {
            List<String> itemNames = objectMapper.readValue(
                combo.getItems(), 
                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
            if (!itemNames.isEmpty()) {
                List<Product> comboProducts = productRepository.findByNameIn(itemNames);
                for (Product p : comboProducts) {
                    // Get the lowest variant price for each product
                    java.math.BigDecimal minPrice = p.getVariants().stream()
                        .map(ProductVariant::getPrice)
                        .filter(price -> price != null && price.compareTo(java.math.BigDecimal.ZERO) > 0)
                        .min(java.math.BigDecimal::compareTo)
                        .orElse(java.math.BigDecimal.ZERO);
                    totalOriginalPrice = totalOriginalPrice.add(minPrice);
                }
            }
        } catch (Exception e) {
            log.warn("Could not parse combo items for price calculation, using fallback", e);
        }

        // Apply discount: combo price = total * (1 - discount/100)
        double discountFactor = 1.0 - (combo.getDiscountPercentage() / 100.0);
        java.math.BigDecimal comboPrice = totalOriginalPrice.compareTo(java.math.BigDecimal.ZERO) > 0
            ? totalOriginalPrice.multiply(java.math.BigDecimal.valueOf(discountFactor))
                .setScale(0, java.math.RoundingMode.HALF_UP)
            : java.math.BigDecimal.valueOf(99000); // fallback only if no products found

        log.info("Combo price: original={} discount={}% final={}", totalOriginalPrice, combo.getDiscountPercentage(), comboPrice);

        // 3. Extract image key from S3 URL
        String imageUrl = combo.getImageUrl();
        String thumbnailKey = null;
        if (imageUrl != null && imageUrl.contains("amazonaws.com/")) {
            thumbnailKey = imageUrl.substring(imageUrl.indexOf("amazonaws.com/") + 14);
        }

        // 4. Create Product
        Product product = Product.builder()
                .name(combo.getComboName())
                .slug("ai-combo-" + java.util.UUID.randomUUID().toString().substring(0, 8))
                .status(ProductStatus.ACTIVE)
                .description(combo.getDescription() + "\n\n" + combo.getSlogan())
                .thumbnailKey(thumbnailKey)
                .category(aiCategory)
                .build();

        // 5. Create variant with real calculated price
        ProductVariant defaultVariant = ProductVariant.builder()
                .sku("AI-COMBO-" + java.util.UUID.randomUUID().toString().substring(0, 8))
                .price(comboPrice)
                .quantity(100)
                .product(product)
                .weightValue(java.math.BigDecimal.valueOf(1.0))
                .weightUnit("kg")
                .build();
        product.getVariants().add(defaultVariant);

        productRepository.save(product);

        // 6. Update Combo Status
        combo.setStatus("PUBLISHED");
        comboCampaignRepository.save(combo);

        return product;
    }

    public List<ComboCampaign> getPublishedCombos() {
        return comboCampaignRepository.findByStatusOrderByCreatedAtDesc("PUBLISHED");
    }

    public ComboCampaign getComboById(String id) {
        return comboCampaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Combo not found"));
    }

    private ComboGenerateResponseDto callGeminiForCombo(ComboGenerateRequestDto request) throws JsonProcessingException {
        String prompt = buildPrompt(request);

        // Build request body for official Google Gemini API format
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
        // Build payload for predict method
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

    private String buildPrompt(ComboGenerateRequestDto request) {
        String itemsJoined = String.join(", ", request.getItems());
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
            """.formatted(request.getHashtag(), itemsJoined);
    }
}
