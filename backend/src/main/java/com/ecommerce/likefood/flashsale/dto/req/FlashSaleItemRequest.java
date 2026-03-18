package com.ecommerce.likefood.flashsale.dto.req;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashSaleItemRequest {
    private String productId;
    private String variantId;
    private BigDecimal salePrice;
    private Integer stock;
}
