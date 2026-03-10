package com.ecommerce.likefood.ai.service.impl;

import com.ecommerce.likefood.ai.dto.req.AiChatContext;
import com.ecommerce.likefood.ai.dto.res.AiChatAction;
import com.ecommerce.likefood.ai.dto.res.AiChatResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class AiChatActionContractSupportTest {

    private final AiChatActionContractSupport support =
            new AiChatActionContractSupport(mock(AiChatObservabilityService.class));

    @Test
    void shouldRemoveProductBoundActionOutsideMatchedIds() {
        AiChatResponse response = AiChatResponse.builder()
                .reply("ok")
                .matchedProductIds(List.of("p-1"))
                .nextContext(AiChatContext.builder().selectedProductId("p-1").build())
                .actions(List.of(
                        AiChatAction.builder().type("open-product").productId("p-1").label("Open p1").build(),
                        AiChatAction.builder().type("buy-product").productId("p-2").label("Buy p2").build(),
                        AiChatAction.builder().type("go-checkout").label("Checkout").build()))
                .build();

        AiChatResponse sanitized = support.sanitize(response);

        assertEquals(2, sanitized.getActions().size());
        assertEquals("open-product", sanitized.getActions().get(0).getType());
        assertEquals("go-checkout", sanitized.getActions().get(1).getType());
    }
}
