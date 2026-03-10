package com.ecommerce.likefood.ai.service.impl;

import com.ecommerce.likefood.ai.dto.req.AiChatContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Set;

@Component
class AiChatIntentRouter {

    enum Intent {
        PRODUCT_SEARCH,
        RELATED_RECOMMENDATION,
        ADD_TO_CART,
        PRODUCT_DETAIL_FOLLOW_UP,
        VARIANT_SELECTION,
        QUANTITY_UPDATE,
        CHECKOUT_CONFIRMATION,
        GREETING_HELP,
        BUDGET_CONSTRAINT,
        OUT_OF_STOCK_ALTERNATIVE,
        UNKNOWN
    }

    private static final Set<String> OUT_OF_STOCK_KEYWORDS = Set.of("het hang", "khong co hang", "out of stock");
    private static final Set<String> BUY_KEYWORDS = Set.of("them vao gio", "mua", "buy", "add to cart");
    private static final Set<String> RECOMMEND_KEYWORDS = Set.of("goi y", "lien quan", "recommend", "suggest");
    private static final Set<String> GREETING_HELP_KEYWORDS = Set.of("xin chao", "chao", "hello", "hi", "help", "ho tro");
    private static final Set<String> PRODUCT_QUERY_KEYWORDS = Set.of("tim", "mon", "san pham", "product");

    Intent detectIntent(String message, AiChatContext context) {
        String normalized = AiChatTextSupport.normalize(message);
        if (!StringUtils.hasText(normalized)) {
            return Intent.UNKNOWN;
        }

        if (context != null && StringUtils.hasText(context.getAwaiting())) {
            String awaiting = context.getAwaiting();
            if ("AWAITING_VARIANT_OR_QUANTITY".equals(awaiting)) {
                if (AiChatTextSupport.parseQuantity(message) != null) return Intent.QUANTITY_UPDATE;
                return Intent.VARIANT_SELECTION;
            }
            if ("AWAITING_CHECKOUT".equals(awaiting)) {
                return Intent.CHECKOUT_CONFIRMATION;
            }
            if (isProductDetailFollowUp(normalized, context)) {
                return Intent.PRODUCT_DETAIL_FOLLOW_UP;
            }
            if ("AWAITING_PRODUCT_CONFIRMATION".equals(awaiting)) {
                return Intent.ADD_TO_CART;
            }
        }
        if (isProductDetailFollowUp(normalized, context)) {
            return Intent.PRODUCT_DETAIL_FOLLOW_UP;
        }
        if (containsAny(normalized, OUT_OF_STOCK_KEYWORDS)) {
            return Intent.OUT_OF_STOCK_ALTERNATIVE;
        }
        if (AiChatProductSupport.parseBudgetVndFromMessage(message) > 0) {
            return Intent.BUDGET_CONSTRAINT;
        }
        if (containsAny(normalized, BUY_KEYWORDS)) {
            return Intent.ADD_TO_CART;
        }
        if (containsAny(normalized, RECOMMEND_KEYWORDS)) {
            return Intent.RELATED_RECOMMENDATION;
        }
        if (containsAny(normalized, GREETING_HELP_KEYWORDS)) {
            return Intent.GREETING_HELP;
        }
        if (containsAny(normalized, PRODUCT_QUERY_KEYWORDS)) {
            return Intent.PRODUCT_SEARCH;
        }
        return Intent.UNKNOWN;
    }

    private boolean isProductDetailFollowUp(String normalized, AiChatContext context) {
        if (context == null || !StringUtils.hasText(context.getSelectedProductId())) return false;
        return normalized.contains("chi tiet")
                || normalized.contains("mon do la mon gi")
                || normalized.contains("mon do la gi")
                || normalized.contains("noi ro")
                || normalized.contains("thong tin mon")
                || normalized.contains("more detail")
                || normalized.contains("tell me more")
                || normalized.contains("what is that item")
                || normalized.equals("mon do")
                || normalized.equals("mon do a");
    }

    private boolean containsAny(String normalized, Set<String> keywords) {
        return keywords.stream().anyMatch(normalized::contains);
    }
}
