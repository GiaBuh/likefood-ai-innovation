package com.ecommerce.likefood.ai.dto.req;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboItemInput {
    private String productId;
    private String variantId;
    @Builder.Default
    private Integer quantity = 1;
}
