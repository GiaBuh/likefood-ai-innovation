package com.ecommerce.likefood.ai.dto.req;

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
public class AiChatContext {
    private String selectedProductId;
    private String selectedVariantId;
    // NONE | AWAITING_VARIANT_OR_QUANTITY | AWAITING_CHECKOUT
    private String awaiting;
}
