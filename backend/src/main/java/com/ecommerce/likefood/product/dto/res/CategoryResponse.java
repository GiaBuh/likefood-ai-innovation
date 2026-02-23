package com.ecommerce.likefood.product.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class CategoryResponse {
    private String id;
    private String name;
    private String icon;
}
