package com.ecommerce.likefood.cart.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class CartRecommendationItemResponse {
    private String productId;
    private String variantId;
    private String productName;
    private String category;
    private String variant;
    private BigDecimal price;
    private String reason;
    private String imageKey;
}
