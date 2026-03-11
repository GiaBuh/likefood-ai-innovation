package com.ecommerce.likefood.ai.controller;

import com.ecommerce.likefood.ai.domain.ComboCampaign;
import com.ecommerce.likefood.ai.dto.req.ComboGenerateRequestDto;
import com.ecommerce.likefood.ai.service.ComboCampaignService;
import com.ecommerce.likefood.common.utils.ApiMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai/combos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ComboCampaignController {

    private final ComboCampaignService comboCampaignService;

    @PostMapping("/generate")
    @ApiMessage("Generate new trend combo campaign")
    public ResponseEntity<ComboCampaign> generateCombo(@RequestBody ComboGenerateRequestDto request) {
        log.info("Received request to generate combo for hashtag: {}", request.getHashtag());
        ComboCampaign result = comboCampaignService.generateComboCampaign(request);
        return ResponseEntity.ok(result);
    }
}
