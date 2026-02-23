package com.ecommerce.likefood.cart.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
public class CartResponse {
    private String id;
    private String userId;

    @Builder.Default
    private List<CartItemResponse> items = new ArrayList<>();

    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;
}
