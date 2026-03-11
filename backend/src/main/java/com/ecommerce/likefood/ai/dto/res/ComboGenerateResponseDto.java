package com.ecommerce.likefood.ai.dto.res;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboGenerateResponseDto {
    
    @JsonProperty("combo_name")
    private String comboName;
    
    private String slogan;
    
    private String description;
    
    @JsonProperty("discount_percentage")
    private Double discountPercentage;
    
    @JsonProperty("image_prompt")
    private String imagePrompt;
}
