package com.ecommerce.likefood.ai.controller;

import com.ecommerce.likefood.ai.dto.TikTokTrendDto;
import com.ecommerce.likefood.ai.service.TrendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai/trends")
@RequiredArgsConstructor
@Slf4j // Thêm log để kiểm tra
public class TrendController {

    private final TrendService trendService;

    @GetMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyzeTrends() {
        log.info("Received request for AI Trend Analysis");
        
        // 1. Lấy dữ liệu từ TrendService (Đã sửa endpoint mới)
        List<TikTokTrendDto> trends = trendService.getCurrentTrends();

        // 2. Lấy lời khuyên từ AI
        String aiAnalysis = trendService.analyzeTrendWithGemini(trends);

        // 3. Đóng gói trả về (PHẢI KHỚP VỚI FRONTEND)
        Map<String, Object> response = new HashMap<>();
        
        // Frontend đang đợi "trends", không phải "raw_trends"
        response.put("trends", trends); 
        
        // Frontend đang đợi "analysis", không phải "ai_suggestion"
        response.put("analysis", aiAnalysis); 
        
        // Có thể giữ lại source để debug
        response.put("source", "TikTok US Real-time");

        log.info("Returning successful AI analysis with {} trends", trends.size());
        return ResponseEntity.ok(response);
    }
}