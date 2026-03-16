package com.ecommerce.likefood.ai.dto.req;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualComboRequestDto {
    private String hashtag;
    private String comboName;
    private String description;
    private Double discountPercentage;
    private String imageUrl; // URL from uploaded image or external link
    private List<ComboItemInput> items;
}
