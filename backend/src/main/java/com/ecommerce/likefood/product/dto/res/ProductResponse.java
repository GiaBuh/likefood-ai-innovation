package com.ecommerce.likefood.product.dto.res;

import com.ecommerce.likefood.product.domain.ProductStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
public class ProductResponse {
    private String id;
    private String name;
    private String slug;
    private ProductStatus status;
    private String description;
    private String thumbnailKey;
    private CategoryResponse category;

    @Builder.Default
    private List<String> imageKeys = new ArrayList<>();

    @Builder.Default
    private List<ProductVariantResponse> variants = new ArrayList<>();
}
