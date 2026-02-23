package com.ecommerce.likefood.cart.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class CartItemResponse {
    private String id;
    private String variantId;
    private String productId;
    private Integer quantity;
    private Integer availableQuantity;
    private BigDecimal price;
    private BigDecimal lineTotal;
}
