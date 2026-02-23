package com.ecommerce.likefood.ai.controller;

import com.ecommerce.likefood.ai.dto.req.AiChatRequest;
import com.ecommerce.likefood.ai.dto.res.AiChatResponse;
import com.ecommerce.likefood.ai.service.AiChatService;
import com.ecommerce.likefood.common.utils.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/ai-chat/respond")
    @ApiMessage("AI chat response")
    public ResponseEntity<AiChatResponse> respond(@RequestBody @Valid AiChatRequest request) {
        return ResponseEntity.ok(aiChatService.respond(request));
    }
}
