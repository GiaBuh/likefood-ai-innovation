package com.ecommerce.likefood.product.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private String id;
    private String name;
    private String icon;
}
