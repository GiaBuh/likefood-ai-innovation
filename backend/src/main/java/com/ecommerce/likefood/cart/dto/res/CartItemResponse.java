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
    private String itemType; // "PRODUCT" or "COMBO"
    
    // Product fields
    private String variantId;
    private String productId;
    private Integer availableQuantity;
    
    // Combo fields
    private String comboCampaignId;
    
    // Common fields
    private String name; // product name or combo name
    private String imageUrl; // resolved image URL
    private String variantLabel; // e.g. "500g" or "Combo"
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal lineTotal;
}
