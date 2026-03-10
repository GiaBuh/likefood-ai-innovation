package com.ecommerce.likefood.ai.service.impl;

import com.ecommerce.likefood.ai.dto.res.AiChatResponse;
import com.ecommerce.likefood.ai.dto.res.AiRecommendationMeta;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Component
class AiChatResponseFormattingSupport {
    private static final int MAX_REPLY_LENGTH = 360;

    AiChatResponse apply(AiChatResponse response, AiChatIntentRouter.Intent intent) {
        if (response == null || !StringUtils.hasText(response.getReply())) {
            return response;
        }
        String language = StringUtils.hasText(response.getLanguage()) ? response.getLanguage() : "vi";
        String formatProfile = resolveFormatProfile(response, intent);
        String formattedReply = formatReply(response.getReply(), language);

        if (formattedReply.length() > MAX_REPLY_LENGTH) {
            formattedReply = shorten(formattedReply, language);
        }

        response.setReply(formattedReply);
        AiRecommendationMeta meta = response.getRecommendationMeta();
        if (meta == null) {
            meta = AiRecommendationMeta.builder().build();
            response.setRecommendationMeta(meta);
        }
        meta.setFormatProfile(formatProfile);
        return response;
    }

    private String resolveFormatProfile(AiChatResponse response, AiChatIntentRouter.Intent intent) {
        if (intent == AiChatIntentRouter.Intent.PRODUCT_DETAIL_FOLLOW_UP) return "compact_detail";
        if (intent == AiChatIntentRouter.Intent.BUDGET_CONSTRAINT) return "budget_advice";
        if (response.getMatchedProductIds() != null && response.getMatchedProductIds().size() > 1) {
            return "recommendation_list";
        }
        if (response.getRecommendationMeta() != null && StringUtils.hasText(response.getRecommendationMeta().getOfferType())) {
            String offerType = response.getRecommendationMeta().getOfferType();
            if ("related".equals(offerType) || "upsell".equals(offerType)) return "recommendation_list";
        }
        return "simple_cta";
    }

    private String formatReply(String rawReply, String language) {
        String normalized = rawReply.replaceAll("\\s+", " ").trim();
        if (!StringUtils.hasText(normalized)) return rawReply;

        String[] sentences = normalized.split("(?<=[.!?])\\s+");
        List<String> lines = new ArrayList<>();
        for (String sentence : sentences) {
            if (StringUtils.hasText(sentence)) lines.add(sentence.trim());
        }
        if (lines.isEmpty()) return normalized;
        if (lines.size() == 1) return lines.getFirst();

        StringBuilder out = new StringBuilder();
        out.append(lines.getFirst());
        for (int i = 1; i < lines.size(); i++) {
            String line = lines.get(i);
            if (line.length() < 20) {
                out.append("\n").append(line);
            } else {
                out.append("\n• ").append(line);
            }
        }
        return out.toString();
    }

    private String shorten(String reply, String language) {
        String truncated = reply.substring(0, Math.min(reply.length(), MAX_REPLY_LENGTH));
        int lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 120) truncated = truncated.substring(0, lastSpace);
        String cta = "en".equalsIgnoreCase(language)
                ? "Tap \"View details\" if you want more."
                : "Bạn bấm \"Xem chi tiết\" để xem thêm nhé.";
        return truncated.trim() + "...\n" + cta;
    }
}
