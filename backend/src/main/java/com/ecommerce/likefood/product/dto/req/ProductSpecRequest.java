package com.ecommerce.likefood.product.dto.req;

import com.ecommerce.likefood.common.specification.FilterField;
import com.ecommerce.likefood.common.specification.FilterOperator;
import com.ecommerce.likefood.product.domain.ProductStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductSpecRequest {
    @FilterField(operator = FilterOperator.LIKE)
    private String name;

    @FilterField(column = "category.name", operator = FilterOperator.LIKE)
    private String categoryName;

    /** Search in product name OR category name (OR logic). When set, overrides name for text search. */
    private String search;

    @FilterField(operator = FilterOperator.EQUAL)
    private ProductStatus status;

    @FilterField(column = "variants.price", operator = FilterOperator.GREATER_THAN)
    private BigDecimal minPrice;

    @FilterField(column = "variants.price", operator = FilterOperator.LESS_THAN)
    private BigDecimal maxPrice;
}
