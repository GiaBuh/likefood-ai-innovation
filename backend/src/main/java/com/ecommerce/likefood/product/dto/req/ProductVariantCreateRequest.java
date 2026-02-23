package com.ecommerce.likefood.product.dto.req;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductVariantCreateRequest {
    private String id; // Optional, for update - match existing variant

    @NotNull(message = "Weight value is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Weight value must be greater than 0")
    private BigDecimal weightValue;

    @NotBlank(message = "Weight unit is required")
    private String weightUnit;

    @NotBlank(message = "SKU is required")
    private String sku;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than 0")
    private Integer quantity;
}
