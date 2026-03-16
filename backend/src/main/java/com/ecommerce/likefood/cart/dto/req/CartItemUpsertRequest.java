package com.ecommerce.likefood.cart.dto.req;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CartItemUpsertRequest {
    private String variantId; // required for PRODUCT, null for COMBO
    private String comboCampaignId; // required for COMBO, null for PRODUCT

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than 0")
    private Integer quantity;
}
