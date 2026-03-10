package com.ecommerce.likefood.ai.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRecommendationMeta {
    private String reason;
    private String offerType;
    private String fallbackLevel;
    private String confidenceBand;
    private String intent;
    private String formatProfile;
}
