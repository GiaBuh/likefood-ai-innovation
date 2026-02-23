package com.ecommerce.likefood.order.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class OrderItemResponse {
    private String id;
    private String variantId;
    private String productName;
    private String variantLabel;
    private String imageKey;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal lineTotal;
}
