package com.ecommerce.likefood.cart.service;

import com.ecommerce.likefood.cart.dto.req.CartItemUpsertRequest;
import com.ecommerce.likefood.cart.dto.res.CartResponse;

public interface CartService {
    CartResponse getMyCart();

    CartResponse addItem(CartItemUpsertRequest request);

    CartResponse updateItem(String cartItemId, Integer quantity);

    CartResponse removeItem(String cartItemId);
}
