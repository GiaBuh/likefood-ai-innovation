package com.ecommerce.likefood.flashsale.dto.res;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class FlashSaleItemResponse {
    private String id;
    private String productId;
    private String variantId;
    private String variantLabel;
    private String productName;
    private String productSlug;
    private String productImage;
    private String categoryName;
    private BigDecimal originalPrice;
    private BigDecimal salePrice;
    private Integer discountPercent;
    private Integer stock;
    private Integer soldCount;
    private Integer soldPercent;
}
