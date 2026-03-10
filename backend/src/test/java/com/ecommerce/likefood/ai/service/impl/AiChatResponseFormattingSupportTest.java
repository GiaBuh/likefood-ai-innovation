package com.ecommerce.likefood.ai.service.impl;

import com.ecommerce.likefood.ai.dto.res.AiChatResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiChatResponseFormattingSupportTest {

    private final AiChatResponseFormattingSupport support = new AiChatResponseFormattingSupport();

    @Test
    void shouldSetCompactDetailProfileForDetailFollowUpIntent() {
        AiChatResponse response = AiChatResponse.builder()
                .reply("Day la mon an rat ngon. Vi dam da va de an. Ban co muon thu khong?")
                .language("vi")
                .build();

        AiChatResponse formatted = support.apply(response, AiChatIntentRouter.Intent.PRODUCT_DETAIL_FOLLOW_UP);

        assertEquals("compact_detail", formatted.getRecommendationMeta().getFormatProfile());
        assertTrue(formatted.getReply().contains("\n"));
    }

    @Test
    void shouldShortenLongReplyAndAddCta() {
        String longText = "Mon nay rat ngon ".repeat(80);
        AiChatResponse response = AiChatResponse.builder()
                .reply(longText)
                .language("vi")
                .build();

        AiChatResponse formatted = support.apply(response, AiChatIntentRouter.Intent.PRODUCT_SEARCH);

        assertTrue(formatted.getReply().contains("Xem chi tiết"));
        assertTrue(formatted.getReply().length() < longText.length());
    }
}
