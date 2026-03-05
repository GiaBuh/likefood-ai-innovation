package com.ecommerce.likefood.ai.service;

import com.ecommerce.likefood.ai.dto.TikTokTrendDto;
import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductVariant;
import com.ecommerce.likefood.product.repository.ProductRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable; // QUAN TRỌNG: Thêm dòng import này
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TrendService {

    private final ObjectMapper objectMapper;
    private final ProductRepository productRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    // --- CẤU HÌNH TIKTOK ---
    @Value("${TIKTOK_API_URL:https://tiktok-creative-center-api.p.rapidapi.com/api/trending/hashtag?page=1&limit=20&period=120&country=US&sort_by=popular}")
    private String RAPID_API_URL;

    @Value("${TIKTOK_API_KEY:313a752e08mshf5457758ba88776p1ec28djsn8b052aae046b}")
    private String RAPID_API_KEY;

    private final String RAPID_API_HOST = "tiktok-creative-center-api.p.rapidapi.com";

    // --- CẤU HÌNH GEMINI AI ---
    @Value("${GEMINI_API_KEY}")
    private String GEMINI_API_KEY;

    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=";

    @Cacheable(value = "tiktokTrends", key = "'daily'")
    public List<TikTokTrendDto> getCurrentTrends() {
        try {
            log.info("Connecting to TikTok API: {}", RAPID_API_URL);
            return fetchFromRapidApi();
        } catch (Exception e) {
            log.error("RapidAPI Error: {}. Activating Fallback.", e.getMessage());
            return fetchFromMockData();
        }
    }

    private List<TikTokTrendDto> fetchFromRapidApi() throws Exception {
        // ... (Nội dung hàm giữ nguyên như code của bạn)
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-rapidapi-key", RAPID_API_KEY);
        headers.set("x-rapidapi-host", RAPID_API_HOST);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON)); 

        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(RAPID_API_URL, HttpMethod.GET, entity, String.class);
        
        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode dataList = root.path("data").path("list");
        
        List<TikTokTrendDto> trends = new ArrayList<>();
        if (dataList.isArray()) {
            for (JsonNode node : dataList) {
                String name = node.path("hashtag_name").asText("unknown");
                log.info(">>> HASHTAG REALTIME: #{}", name);
                
                trends.add(TikTokTrendDto.builder()
                        .desc("#" + name) 
                        .music("Rank: " + node.path("rank").asInt(0))   
                        .author("TikTok Trending")
                        .views(formatNumber(node.path("publish_video_cnt").asLong(0)) + " videos") 
                        .build());
            }
        }
        if (trends.isEmpty()) throw new RuntimeException("API trả về danh sách rỗng");
        return trends;
    }

    /**
     * Phân tích xu hướng kết hợp sản phẩm hiện có với Gemini AI.
     * Trả về Map chứa: analysis (String) + recommendedProducts (List)
     */
    // ĐẶT @Cacheable Ở ĐÂY LÀ ĐÚNG CHUẨN:
    @Cacheable(value = "aiAnalysis", key = "#trends.get(0).desc")
    public Map<String, Object> analyzeTrendWithProducts(List<TikTokTrendDto> trends) {
        Map<String, Object> result = new HashMap<>();

        if (trends == null || trends.isEmpty()) {
            result.put("analysis", "AI đang tải dữ liệu...");
            result.put("recommendedProducts", List.of());
            return result;
        }

        // ... (Toàn bộ logic hàm giữ nguyên như code của bạn)
        List<Product> activeProducts = productRepository.findActiveProducts(50);
        String productCatalog = buildProductCatalog(activeProducts);

        String hashtagList = trends.stream()
                .map(TikTokTrendDto::getDesc)
                .limit(10)
                .reduce((a, b) -> a + ", " + b)
                .orElse("");

        try {
            String prompt = buildAnalysisPrompt(hashtagList, productCatalog);

            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("responseMimeType", "application/json");
            generationConfig.put("temperature", 0.7);
            requestBody.put("generationConfig", generationConfig);

            Map<String, Object> content = new HashMap<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            content.put("parts", List.of(part));
            requestBody.put("contents", List.of(content));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    GEMINI_API_URL + GEMINI_API_KEY, entity, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");
            if (candidates.isMissingNode() || !candidates.isArray() || candidates.isEmpty()) {
                throw new RuntimeException("Gemini trả về không có candidates");
            }
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isMissingNode() || !parts.isArray() || parts.isEmpty()) {
                throw new RuntimeException("Gemini trả về không có parts");
            }

            String jsonText = parts.get(0).path("text").asText("").trim();
            log.info("Gemini raw response: {}", jsonText);

            Map<String, Object> aiResult = objectMapper.readValue(jsonText, new TypeReference<>() {});
            
            result.put("analysis", aiResult.getOrDefault("analysis", "Không có phân tích."));
            result.put("recommendedProducts", aiResult.getOrDefault("recommendedProducts", List.of()));
            return result;

        } catch (Exception e) {
            log.error("Gemini Error: {}. Dùng câu trả lời dự phòng.", e.getMessage());
            result.put("analysis", "AI Analysis: Xu hướng " + trends.get(0).getDesc() 
                    + " đang rất hot! Shop nên đẩy mạnh các sản phẩm liên quan để tăng doanh thu.");
            result.put("recommendedProducts", buildFallbackRecommendations(activeProducts, trends));
            return result;
        }
    }

    // ... (Các hàm buildProductCatalog, buildAnalysisPrompt, buildFallbackRecommendations, formatNumber, fetchFromMockData giữ nguyên)
    private String buildProductCatalog(List<Product> products) {
        if (products.isEmpty()) return "Không có sản phẩm nào.";

        return products.stream()
                .map(p -> {
                    String category = p.getCategory() != null ? p.getCategory().getName() : "Chưa phân loại";
                    String priceRange = p.getVariants().stream()
                            .map(ProductVariant::getPrice)
                            .map(BigDecimal::toString)
                            .reduce((a, b) -> a + "-" + b)
                            .orElse("N/A");
                    return "- " + p.getName() + " (Danh mục: " + category + ", Giá: " + priceRange + "đ, ID: " + p.getId() + ")";
                })
                .collect(Collectors.joining("\n"));
    }

    private String buildAnalysisPrompt(String hashtagList, String productCatalog) {
        return """
                Bạn là chuyên gia Marketing & AI của cửa hàng đồ ăn vặt 'LikeFood'.
                
                ## Xu hướng TikTok hiện tại:
                %s
                
                ## Danh sách sản phẩm hiện có của shop:
                %s
                
                ## Nhiệm vụ:
                1. Phân tích xu hướng TikTok trên và đưa ra nhận định về thị trường đồ ăn vặt (2-3 câu).
                2. Phân loại và gợi ý sản phẩm từ danh sách trên phù hợp với từng xu hướng.
                3. Đưa ra lý do tại sao sản phẩm đó phù hợp với xu hướng.
                
                ## Trả về JSON theo đúng format sau (KHÔNG markdown, CHỈ JSON thuần):
                {
                  "analysis": "Nhận định tổng quan về xu hướng và chiến lược marketing (2-3 câu tiếng Việt)",
                  "recommendedProducts": [
                    {
                      "productId": "ID sản phẩm từ danh sách trên",
                      "productName": "Tên sản phẩm",
                      "matchedTrend": "#hashtag phù hợp",
                      "reason": "Lý do ngắn gọn tại sao sản phẩm phù hợp xu hướng này (1 câu tiếng Việt)"
                    }
                  ]
                }
                
                Lưu ý: Chọn tối đa 6 sản phẩm phù hợp nhất. Trả lời bằng tiếng Việt.
                """.formatted(hashtagList, productCatalog);
    }

    private List<Map<String, Object>> buildFallbackRecommendations(List<Product> products, List<TikTokTrendDto> trends) {
        List<Map<String, Object>> recommendations = new ArrayList<>();
        if (products.isEmpty() || trends.isEmpty()) return recommendations;

        String firstTrend = trends.get(0).getDesc();
        for (int i = 0; i < Math.min(4, products.size()); i++) {
            Product p = products.get(i);
            Map<String, Object> rec = new HashMap<>();
            rec.put("productId", p.getId());
            rec.put("productName", p.getName());
            rec.put("matchedTrend", firstTrend);
            rec.put("reason", "Sản phẩm phù hợp với xu hướng ăn vặt hiện tại trên TikTok.");
            recommendations.add(rec);
        }
        return recommendations;
    }

    private String formatNumber(long count) {
        if (count < 1000) return String.valueOf(count);
        if (count < 1000000) return (count / 1000) + "K";
        return String.format("%.1fM", (double) count / 1000000);
    }

    private List<TikTokTrendDto> fetchFromMockData() {
        try {
            InputStream inputStream = new ClassPathResource("data/tiktok_mock.json").getInputStream();
            return objectMapper.readValue(inputStream, new TypeReference<List<TikTokTrendDto>>() {});
        } catch (Exception e) {
            return List.of(TikTokTrendDto.builder().desc("#healthysnack").music("Rank: 1").author("LikeFood").views("2.5M").build());
        }
    }
}