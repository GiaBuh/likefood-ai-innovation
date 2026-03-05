package com.ecommerce.likefood.ai.controller;

import com.ecommerce.likefood.ai.dto.TikTokTrendDto;
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

    @GetMapping("/analyze")
    @ApiMessage("Analyze AI trends")
    public ResponseEntity<Map<String, Object>> analyzeTrends() {
        // log.info("Received request for AI Trend Analysis");
        
        // // 1. Lấy danh sách xu hướng TikTok
        // List<TikTokTrendDto> trends = trendService.getCurrentTrends();

        // // 2. Phân tích xu hướng + phân loại sản phẩm bằng Gemini AI
        // Map<String, Object> aiResult = trendService.analyzeTrendWithProducts(trends);

        // // 3. Đóng gói trả về (PHẢI KHỚP VỚI FRONTEND)
        // Map<String, Object> response = new HashMap<>();
        // response.put("trends", trends);
        // response.put("analysis", aiResult.get("analysis"));
        // response.put("recommendedProducts", aiResult.get("recommendedProducts"));
        // response.put("source", "TikTok US Real-time");

        // log.info("Returning successful AI analysis with {} trends", trends.size());
        // return ResponseEntity.ok(response);
        return ResponseEntity.ok(null);
    }
}