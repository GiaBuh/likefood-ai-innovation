package com.ecommerce.likefood.product.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class ProductVariantResponse {
    private String id;
    private BigDecimal weightValue;
    private String weightUnit;
    private String sku;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer discountPercent; // calculated from originalPrice vs price
    private Integer quantity;
    private boolean bestSeller;
    @Builder.Default
    private long soldCount = 0;
}
