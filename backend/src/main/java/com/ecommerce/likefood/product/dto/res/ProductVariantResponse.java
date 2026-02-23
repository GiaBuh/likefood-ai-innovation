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
    private Integer quantity;
}
