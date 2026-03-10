package com.ecommerce.likefood.ai.service.impl;

import com.ecommerce.likefood.ai.dto.req.AiChatContext;
import com.ecommerce.likefood.ai.dto.res.AiChatAction;
import com.ecommerce.likefood.ai.dto.res.AiChatResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
class AiChatActionContractSupport {
    private final AiChatObservabilityService observabilityService;

    AiChatResponse sanitize(AiChatResponse response) {
        if (response == null || response.getActions() == null || response.getActions().isEmpty()) {
            return response;
        }
        Set<String> allowedIds = new LinkedHashSet<>();
        if (response.getMatchedProductIds() != null) {
            response.getMatchedProductIds().stream()
                    .filter(StringUtils::hasText)
                    .forEach(allowedIds::add);
        }
        AiChatContext nextContext = response.getNextContext();
        if (nextContext != null && StringUtils.hasText(nextContext.getSelectedProductId())) {
            allowedIds.add(nextContext.getSelectedProductId());
        }

        List<AiChatAction> sanitized = response.getActions().stream()
                .filter(action -> {
                    boolean allowed = isAllowedAction(action, allowedIds);
                    if (!allowed && action != null) {
                        observabilityService.recordActionMismatch(action.getType());
                    }
                    return allowed;
                })
                .toList();
        response.setActions(sanitized);
        return response;
    }

    private boolean isAllowedAction(AiChatAction action, Set<String> allowedIds) {
        if (action == null) return false;
        if (!StringUtils.hasText(action.getType())) return false;
        if (!requiresProductBinding(action.getType())) return true;
        return StringUtils.hasText(action.getProductId()) && allowedIds.contains(action.getProductId());
    }

    private boolean requiresProductBinding(String actionType) {
        return "open-product".equals(actionType)
                || "buy-product".equals(actionType)
                || "choose-variant".equals(actionType);
    }
}
