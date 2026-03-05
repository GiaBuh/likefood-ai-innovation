package com.ecommerce.likefood.ai.controller;

import com.ecommerce.likefood.ai.domain.TrendHistory;
import com.ecommerce.likefood.ai.dto.TikTokTrendDto;
import com.ecommerce.likefood.ai.repository.TrendHistoryRepository;
import com.ecommerce.likefood.ai.service.TrendService;
import com.ecommerce.likefood.common.utils.ApiMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai/trends")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class TrendController {

    private final TrendService trendService;
    private final TrendHistoryRepository trendHistoryRepository;

    @GetMapping("/analyze")
    @ApiMessage("Analyze AI trends")
    public ResponseEntity<Map<String, Object>> analyzeTrends() {
        log.info("Received request for AI Trend Analysis");

        // 1. Lấy danh sách xu hướng TikTok (cached 24h)
        List<TikTokTrendDto> trends = trendService.getCurrentTrends();

        // 2. Phân tích xu hướng + sản phẩm bằng Gemini AI (cached 24h)
        Map<String, Object> aiResult = trendService.analyzeTrendWithProducts(trends);

        // 3. Đóng gói trả về
        boolean isReal = trendService.isLastTrendSourceReal();

        Map<String, Object> response = new HashMap<>();
        response.put("trends", trends);
        response.put("analysis", aiResult.get("analysis"));
        response.put("recommendedProducts", aiResult.get("recommendedProducts"));
        response.put("source", isReal ? "TikTok US Real-time" : "Mock Data (API unavailable)");
        response.put("isRealData", isReal);

        log.info("Returning AI analysis with {} trends (isReal={})", trends.size(), isReal);
        return ResponseEntity.ok(response);
    }

    /**
     * API cho Admin xem lịch sử phân tích xu hướng.
     */
    @GetMapping("/history")
    @ApiMessage("Get trend analysis history")
    public ResponseEntity<List<TrendHistory>> getTrendHistory() {
        log.info("Fetching trend analysis history");
        List<TrendHistory> history = trendHistoryRepository.findTop30ByOrderByCreatedAtDesc();
        return ResponseEntity.ok(history);
    }
}