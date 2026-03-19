package com.ecommerce.likefood.ai.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboCampaignResponseDto {

    private String id;
    private String hashtag;
    private String comboName;
    private String slogan;
    private String description;
    private Double discountPercentage;
    private String imagePrompt;
    private String imageUrl;
    private String items;
    private String status;
    private String source;
    private BigDecimal comboPrice;
    private Instant createdAt;
    private List<ComboItemResponseDto> comboItems;
}
