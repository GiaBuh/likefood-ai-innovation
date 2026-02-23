package com.ecommerce.likefood.product.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryUpdateRequest {
    @NotBlank(message = "Category name must not be blank")
    private String name;
}
