package com.ecommerce.likefood.cart.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
public class CartRecommendationResponse {
    @Builder.Default
    private List<CartRecommendationItemResponse> recommendations = new ArrayList<>();
}
