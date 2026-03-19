package com.ecommerce.likefood.ai.controller;

import com.ecommerce.likefood.ai.dto.req.ComboGenerateRequestDto;
import com.ecommerce.likefood.ai.dto.req.ManualComboRequestDto;
import com.ecommerce.likefood.ai.dto.res.ComboCampaignResponseDto;
import com.ecommerce.likefood.ai.service.ComboCampaignService;
import com.ecommerce.likefood.common.utils.ApiMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai/combos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ComboCampaignController {

    private final ComboCampaignService comboCampaignService;

    @PostMapping("/generate")
    @ApiMessage("Generate new trend combo campaign")
    public ResponseEntity<ComboCampaignResponseDto> generateCombo(@RequestBody ComboGenerateRequestDto request) {
        log.info("Received request to generate combo for hashtag: {}", request.getHashtag());
        ComboCampaignResponseDto result = comboCampaignService.generateComboCampaign(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/manual")
    @ApiMessage("Create manual combo campaign")
    public ResponseEntity<ComboCampaignResponseDto> createManualCombo(@RequestBody ManualComboRequestDto request) {
        log.info("Received request to create manual combo: {}", request.getComboName());
        ComboCampaignResponseDto result = comboCampaignService.createManualCombo(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/upload-image")
    @ApiMessage("Upload combo image")
    public ResponseEntity<Map<String, String>> uploadComboImage(@RequestParam("file") MultipartFile file) {
        log.info("Received request to upload combo image");
        String imageUrl = comboCampaignService.uploadComboImage(file);
        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }

    @PostMapping("/{id}/publish")
    @ApiMessage("Publish combo to store")
    public ResponseEntity<ComboCampaignResponseDto> publishCombo(@PathVariable String id) {
        log.info("Received request to publish combo ID: {}", id);
        ComboCampaignResponseDto published = comboCampaignService.publishCombo(id);
        return ResponseEntity.ok(published);
    }

    @GetMapping("/published")
    @ApiMessage("Get all published combo campaigns")
    public ResponseEntity<List<ComboCampaignResponseDto>> getPublishedCombos() {
        List<ComboCampaignResponseDto> combos = comboCampaignService.getPublishedCombos();
        return ResponseEntity.ok(combos);
    }

    @GetMapping("/{id}")
    @ApiMessage("Get combo campaign by ID")
    public ResponseEntity<ComboCampaignResponseDto> getComboById(@PathVariable String id) {
        ComboCampaignResponseDto combo = comboCampaignService.getComboById(id);
        return ResponseEntity.ok(combo);
    }
}
