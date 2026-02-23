package com.ecommerce.likefood.product.dto.req;

import com.ecommerce.likefood.product.domain.ProductStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ProductCreateRequest {
    @NotBlank(message = "Product name must not be blank")
    private String name;

    private String slug;

    private ProductStatus status;

    private String description;

    @NotBlank(message = "Thumbnail key is required")
    private String thumbnailKey;

    @NotBlank(message = "Category ID is required")
    private String categoryId;

    @NotNull(message = "Variants are required")
    @NotEmpty(message = "At least one variant is required")
    @Valid
    private List<ProductVariantCreateRequest> variants = new ArrayList<>();

    @Valid
    private List<String> imageKeys = new ArrayList<>();
}
