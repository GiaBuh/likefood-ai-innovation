package com.ecommerce.likefood.ai.service;

import com.ecommerce.likefood.ai.domain.ComboCampaign;
import com.ecommerce.likefood.ai.dto.req.ComboGenerateRequestDto;
import com.ecommerce.likefood.ai.dto.res.ComboGenerateResponseDto;
import com.ecommerce.likefood.ai.repository.ComboCampaignRepository;
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
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${likefood.ai.gemini.api-key}")
    private String GEMINI_API_KEY;

    @Value("${likefood.ai.gemini.model:gemini-2.5-flash}")
    private String GEMINI_MODEL;

    private static final String GEMINI_BASE_URL = "https://newapi.ccfilm.online/v1/chat/completions";

    @Transactional
    public ComboCampaign generateComboCampaign(ComboGenerateRequestDto request) {
        log.info("Generating combo campaign for hashtag: {}", request.getHashtag());
        
        try {
            // 1. Call Gemini to get Combo JSON
            ComboGenerateResponseDto geminiResponse = callGeminiForCombo(request);

            // 2. Call Pollinations AI to get Image URL
            String imagePromptEncoded = URLEncoder.encode(geminiResponse.getImagePrompt(), StandardCharsets.UTF_8);
            String imageUrl = "https://image.pollinations.ai/prompt/" + imagePromptEncoded + "?width=1080&height=1080&nologo=true";

            // 3. Save to Database
            ComboCampaign campaign = ComboCampaign.builder()
                    .hashtag(request.getHashtag())
                    .comboName(geminiResponse.getComboName())
                    .slogan(geminiResponse.getSlogan())
                    .description(geminiResponse.getDescription())
                    .discountPercentage(geminiResponse.getDiscountPercentage())
                    .imagePrompt(geminiResponse.getImagePrompt())
                    .imageUrl(imageUrl)
                    .status("DRAFT")
                    .build();
                    
            return comboCampaignRepository.save(campaign);

        } catch (Exception e) {
            log.error("Failed to generate combo campaign", e);
            throw new RuntimeException("Lỗi sinh Combo: " + e.getMessage());
        }
    }

    private ComboGenerateResponseDto callGeminiForCombo(ComboGenerateRequestDto request) throws JsonProcessingException {
        String prompt = buildPrompt(request);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", GEMINI_MODEL);
        requestBody.put("temperature", 0.7);

        Map<String, Object> responseFormat = new HashMap<>();
        responseFormat.put("type", "json_object");
        requestBody.put("response_format", responseFormat);

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        requestBody.put("messages", List.of(message));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + GEMINI_API_KEY);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        log.info("Calling Gemini API for Combo Generation...");
        ResponseEntity<String> response = restTemplate.postForEntity(GEMINI_BASE_URL, entity, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        String jsonText = root.path("choices").get(0).path("message").path("content").asText("").trim();
        
        return objectMapper.readValue(jsonText, ComboGenerateResponseDto.class);
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
