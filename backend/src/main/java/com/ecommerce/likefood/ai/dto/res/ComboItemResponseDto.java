package com.ecommerce.likefood.ai.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboItemResponseDto {

    private String id;
    private Integer quantity;
    private ProductSummary product;
    private VariantSummary variant;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductSummary {
        private String id;
        private String name;
        private String thumbnailKey;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantSummary {
        private String id;
        private BigDecimal weightValue;
        private String weightUnit;
        private BigDecimal price;
    }
}
