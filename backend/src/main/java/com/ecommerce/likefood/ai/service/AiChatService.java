package com.ecommerce.likefood.ai.service;

import com.ecommerce.likefood.ai.dto.req.AiChatRequest;
import com.ecommerce.likefood.ai.dto.res.AiChatResponse;

public interface AiChatService {
    AiChatResponse respond(AiChatRequest request);
}
