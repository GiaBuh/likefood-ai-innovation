package com.ecommerce.likefood.product.mapper;

import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductImage;
import com.ecommerce.likefood.product.domain.ProductVariant;
import com.ecommerce.likefood.product.dto.res.ProductResponse;
import com.ecommerce.likefood.product.dto.res.ProductVariantResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(target = "imageKeys", expression = "java(toImageKeys(product.getImages()))")
    ProductResponse toResponse(Product product);

    ProductVariantResponse toVariantResponse(ProductVariant variant);

    default List<String> toImageKeys(List<ProductImage> images) {
        return images == null ? List.of() : images.stream().map(ProductImage::getImageKey).toList();
    }
}
