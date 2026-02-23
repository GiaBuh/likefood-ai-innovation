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
public class AiCartInstruction {
    private String productId;
    private String variantId;
    private Integer quantity;
}
