package com.ecommerce.likefood.product.mapper;

import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductImage;
import com.ecommerce.likefood.product.domain.ProductVariant;
import com.ecommerce.likefood.product.dto.res.ProductResponse;
import com.ecommerce.likefood.product.dto.res.ProductVariantResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(target = "imageKeys", expression = "java(toImageKeys(product.getImages()))")
    ProductResponse toResponse(Product product);

    default ProductVariantResponse toVariantResponse(ProductVariant variant) {
        if (variant == null) return null;
        Integer discountPercent = null;
        if (variant.getOriginalPrice() != null
                && variant.getOriginalPrice().compareTo(variant.getPrice()) > 0
                && variant.getOriginalPrice().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discount = variant.getOriginalPrice().subtract(variant.getPrice())
                    .multiply(BigDecimal.valueOf(100))
                    .divide(variant.getOriginalPrice(), 0, RoundingMode.HALF_UP);
            discountPercent = discount.intValue();
        }
        return ProductVariantResponse.builder()
                .id(variant.getId())
                .weightValue(variant.getWeightValue())
                .weightUnit(variant.getWeightUnit())
                .sku(variant.getSku())
                .price(variant.getPrice())
                .originalPrice(variant.getOriginalPrice())
                .discountPercent(discountPercent)
                .quantity(variant.getQuantity())
                .bestSeller(variant.isBestSeller())
                .build();
    }

    default List<String> toImageKeys(List<ProductImage> images) {
        return images == null ? List.of() : images.stream().map(ProductImage::getImageKey).toList();
    }
}
