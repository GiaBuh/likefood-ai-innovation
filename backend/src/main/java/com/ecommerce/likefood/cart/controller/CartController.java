package com.ecommerce.likefood.cart.controller;

import com.ecommerce.likefood.cart.dto.req.CartItemUpsertRequest;
import com.ecommerce.likefood.cart.dto.res.CartResponse;
import com.ecommerce.likefood.cart.service.CartService;
import com.ecommerce.likefood.common.utils.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping("/carts/me")
    @ApiMessage("Get my cart")
    public ResponseEntity<CartResponse> getMyCart() {
        return ResponseEntity.ok(cartService.getMyCart());
    }

    @PostMapping("/carts/me/items")
    @ApiMessage("Add item to my cart")
    public ResponseEntity<CartResponse> addItem(@RequestBody @Valid CartItemUpsertRequest request) {
        return ResponseEntity.ok(cartService.addItem(request));
    }

    @PutMapping("/carts/me/items/{itemId}")
    @ApiMessage("Update my cart item")
    public ResponseEntity<CartResponse> updateItem(
            @PathVariable("itemId") String itemId,
            @RequestParam("quantity") Integer quantity
    ) {
        return ResponseEntity.ok(cartService.updateItem(itemId, quantity));
    }

    @DeleteMapping("/carts/me/items/{itemId}")
    @ApiMessage("Remove item from my cart")
    public ResponseEntity<CartResponse> removeItem(@PathVariable("itemId") String itemId) {
        return ResponseEntity.ok(cartService.removeItem(itemId));
    }
}
