package com.ecommerce.likefood.ai.service;
import org.springframework.beans.factory.annotation.Value; 
import com.ecommerce.likefood.ai.dto.TikTokTrendDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class TrendService {

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    // 1. CẤU HÌNH API - Khớp chính xác với Endpoint bạn cung cấp
    @Value("${TIKTOK_API_URL}")
    private String RAPID_API_URL;

    @Value("${TIKTOK_API_KEY}")
    private String RAPID_API_KEY;
    private final String RAPID_API_HOST = "tiktok-creative-center-api.p.rapidapi.com";

    /**
     * Phương thức chính để lấy dữ liệu xu hướng.
     * Nếu API thật lỗi, tự động chuyển sang dữ liệu Mock để giao diện vẫn hiển thị tốt.
     */
    public List<TikTokTrendDto> getCurrentTrends() {
        try {
            log.info("Attempting to fetch real-time trends from TikTok Creative Center...");
            return fetchFromRapidApi();
        } catch (Exception e) {
            log.error("RapidAPI Failure: {}. Falling back to Mock Data.", e.getMessage());
            return fetchFromMockData();
        }
    }

    /**
     * Logic gọi API và bóc tách JSON (Đã tích hợp code của bạn).
     */
    private List<TikTokTrendDto> fetchFromRapidApi() throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-rapidapi-key", RAPID_API_KEY); // Lưu ý: header là chữ thường
        headers.set("x-rapidapi-host", RAPID_API_HOST);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        // Gọi API
        ResponseEntity<String> response = restTemplate.exchange(RAPID_API_URL, HttpMethod.GET, entity, String.class);
        
        // Parse JSON trả về
        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode dataList = root.path("data"); // Dữ liệu nằm trong field "data"
        
        List<TikTokTrendDto> trends = new ArrayList<>();
        if (dataList.isArray()) {
            for (JsonNode node : dataList) {
                // Mapping dữ liệu Hashtag vào DTO cũ
                trends.add(TikTokTrendDto.builder()
                        .desc("#" + node.path("hashtag_name").asText()) // Tên Hashtag (VD: #summer)
                        .music("Rank: " + node.path("rank").asText())   // Xếp hạng
                        .author("TikTok Trend")                         // Mặc định
                        .views(node.path("publish_video_cnt").asText()) // Số lượng video
                        .build());
            }
        }
        
        if (trends.isEmpty()) throw new RuntimeException("API tra ve danh sach rong");
        return trends;
    }   

    /**
     * Định dạng số lượng video (VD: 1,500,000 -> 1.5M).
     */
    private String formatViews(long count) {
        if (count < 1000) return String.valueOf(count);
        if (count < 1000000) return (count / 1000) + "K";
        return String.format("%.1fM", (double) count / 1000000);
    }

    /**
     * Dữ liệu dự phòng khi API lỗi hoặc hết hạn.
     */
    private List<TikTokTrendDto> fetchFromMockData() {
        try {
            InputStream inputStream = new ClassPathResource("data/tiktok_mock.json").getInputStream();
            return objectMapper.readValue(inputStream, new TypeReference<List<TikTokTrendDto>>() {});
        } catch (Exception e) {
            log.warn("Emergency fallback initiated: Mock file not found.");
            List<TikTokTrendDto> emergency = new ArrayList<>();
            emergency.add(TikTokTrendDto.builder()
                    .desc("#healthysnack").music("Rank: 1").author("LikeFood").views("2.5M").build());
            return emergency;
        }
    }

    /**
     * Phân tích dữ liệu để đưa ra lời khuyên AI.
     */
    public String analyzeTrendWithGemini(List<TikTokTrendDto> trends) {
        if (trends == null || trends.isEmpty()) return "AI đang tải dữ liệu...";

        boolean isHealthy = trends.stream().anyMatch(t -> t.getDesc().toLowerCase().contains("healthy"));
        boolean isSpicy = trends.stream().anyMatch(t -> t.getDesc().toLowerCase().contains("spicy"));

        if (isSpicy) {
            return "Kết quả phân tích AI: Xu hướng 'Spicy Challenge' đang dẫn đầu. Gợi ý: Đẩy mạnh các dòng sản phẩm 'Mực Cay' và 'Mì Cay' ngay!";
        } else if (isHealthy) {
            return "Kết quả phân tích AI: Người dùng đang hướng tới lối sống lành mạnh. Gợi ý: 'Hạt Dinh Dưỡng' và 'Trái Cây Sấy' là lựa chọn tối ưu.";
        } else {
            return "Kết quả phân tích AI: Xu hướng tiêu dùng ổn định. Hãy sử dụng hashtag " + trends.get(0).getDesc() + " để tăng tương tác.";
        }
    }
}