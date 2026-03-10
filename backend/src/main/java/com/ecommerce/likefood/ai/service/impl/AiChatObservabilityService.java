package com.ecommerce.likefood.ai.service.impl;

import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
class AiChatObservabilityService {
    private final MeterRegistry meterRegistry;

    void recordRequest(
            AiChatIntentRouter.Intent intent,
            String fallbackLevel,
            boolean noMatch,
            boolean refusal,
            long latencyMs) {
        meterRegistry.timer(
                "likefood.ai.chat.latency",
                "intent", safe(intent == null ? "unknown" : intent.name().toLowerCase()),
                "fallback_level", safe(fallbackLevel),
                "no_match", String.valueOf(noMatch),
                "refusal", String.valueOf(refusal))
                .record(Duration.ofMillis(Math.max(0, latencyMs)));
        meterRegistry.counter(
                "likefood.ai.chat.requests",
                "intent", safe(intent == null ? "unknown" : intent.name().toLowerCase()),
                "fallback_level", safe(fallbackLevel),
                "no_match", String.valueOf(noMatch))
                .increment();
    }

    void recordRecommendationExposure(String offerType, String reason) {
        meterRegistry.counter(
                "likefood.ai.chat.recommendation.exposure",
                "offer_type", safe(offerType),
                "reason", safe(reason))
                .increment();
    }

    void recordRecommendationConversion(String actionType, String offerType) {
        meterRegistry.counter(
                "likefood.ai.chat.recommendation.conversion",
                "action_type", safe(actionType),
                "offer_type", safe(offerType))
                .increment();
    }

    void recordActionMismatch(String actionType) {
        meterRegistry.counter(
                "likefood.ai.chat.action.mismatch",
                "action_type", safe(actionType))
                .increment();
    }

    private String safe(String value) {
        return (value == null || value.isBlank()) ? "unknown" : value;
    }
}
