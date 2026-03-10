package com.ecommerce.likefood.ai.service.impl;

import com.ecommerce.likefood.ai.dto.req.AiChatContext;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AiChatIntentRouterTest {

    private final AiChatIntentRouter router = new AiChatIntentRouter();

    @Test
    void shouldDetectProductDetailFollowUpWhenSelectedProductExists() {
        AiChatContext context = AiChatContext.builder()
                .selectedProductId("p-123")
                .awaiting("AWAITING_PRODUCT_CONFIRMATION")
                .build();

        AiChatIntentRouter.Intent intent = router.detectIntent("mon do la mon gi a", context);

        assertEquals(AiChatIntentRouter.Intent.PRODUCT_DETAIL_FOLLOW_UP, intent);
    }

    @Test
    void shouldKeepAddToCartIntentWhenMessageIsBuyCommand() {
        AiChatContext context = AiChatContext.builder()
                .selectedProductId("p-123")
                .awaiting("AWAITING_PRODUCT_CONFIRMATION")
                .build();

        AiChatIntentRouter.Intent intent = router.detectIntent("co mua", context);

        assertEquals(AiChatIntentRouter.Intent.ADD_TO_CART, intent);
    }

    @Test
    void shouldPrioritizeAwaitingCheckoutOverGenericSearchTerms() {
        AiChatContext context = AiChatContext.builder()
                .awaiting("AWAITING_CHECKOUT")
                .build();

        AiChatIntentRouter.Intent intent = router.detectIntent("tim san pham", context);

        assertEquals(AiChatIntentRouter.Intent.CHECKOUT_CONFIRMATION, intent);
    }
}
