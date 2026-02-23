package com.ecommerce.likefood.cart.service.impl;

import com.ecommerce.likefood.cart.domain.Cart;
import com.ecommerce.likefood.cart.domain.CartItem;
import com.ecommerce.likefood.cart.dto.req.CartItemUpsertRequest;
import com.ecommerce.likefood.cart.dto.res.CartItemResponse;
import com.ecommerce.likefood.cart.dto.res.CartResponse;
import com.ecommerce.likefood.cart.repository.CartItemRepository;
import com.ecommerce.likefood.cart.repository.CartRepository;
import com.ecommerce.likefood.cart.service.CartService;
import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.common.security.SecurityUtils;
import com.ecommerce.likefood.product.domain.ProductVariant;
import com.ecommerce.likefood.product.repository.ProductVariantRepository;
import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;

    @Override
    public CartResponse getMyCart() {
        Cart cart = getOrCreateCartForCurrentUser();
        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addItem(CartItemUpsertRequest request) {
        Cart cart = getOrCreateCartForCurrentUser();
        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new AppException("Variant not found"));

        int availableQty = variant.getQuantity() != null ? variant.getQuantity() : 0;
        int toAdd = request.getQuantity() != null ? request.getQuantity() : 0;

        Optional<CartItem> existed = cartItemRepository.findByCart_IdAndVariant_Id(cart.getId(), variant.getId());
        int currentInCart = existed.map(CartItem::getQuantity).orElse(0);
        int newTotal = currentInCart + toAdd;

        if (newTotal > availableQty) {
            throw new AppException("Exceeds available stock. Maximum: " + availableQty);
        }

        if (existed.isPresent()) {
            CartItem cartItem = existed.get();
            cartItem.setQuantity(newTotal);
            cartItemRepository.save(cartItem);
        } else {
            CartItem cartItem = CartItem.builder()
                    .cart(cart)
                    .variant(variant)
                    .quantity(toAdd)
                    .price(variant.getPrice())
                    .build();
            cart.getItems().add(cartItem);
            cartItemRepository.save(cartItem);
        }
        return toResponse(cartRepository.findById(cart.getId()).orElse(cart));
    }

    @Override
    @Transactional
    public CartResponse updateItem(String cartItemId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new AppException("Quantity must be greater than 0");
        }

        Cart cart = getOrCreateCartForCurrentUser();
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new AppException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new AppException("Cart item does not belong to current user");
        }

        int availableQty = cartItem.getVariant().getQuantity() != null ? cartItem.getVariant().getQuantity() : 0;
        if (quantity > availableQty) {
            throw new AppException("Exceeds available stock. Maximum: " + availableQty);
        }

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);

        return toResponse(cartRepository.findById(cart.getId()).orElse(cart));
    }

    @Override
    @Transactional
    public CartResponse removeItem(String cartItemId) {
        Cart cart = getOrCreateCartForCurrentUser();
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new AppException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new AppException("Cart item does not belong to current user");
        }

        cart.getItems().remove(cartItem);
        return toResponse(cart);
    }

    private Cart getOrCreateCartForCurrentUser() {
        User currentUser = getCurrentUser();
        return cartRepository.findByUser_Id(currentUser.getId())
                .orElseGet(() -> cartRepository.save(
                        Cart.builder()
                                .user(currentUser)
                                .build()
                ));
    }

    private User getCurrentUser() {
        String currentEmail = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new AppException("Unauthenticated"));
        return userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException("User not found"));
    }

    private CartResponse toResponse(Cart cart) {
        BigDecimal total = cart.getItems().stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUser().getId())
                .items(
                        cart.getItems().stream()
                                .map(item -> CartItemResponse.builder()
                                        .id(item.getId())
                                        .variantId(item.getVariant().getId())
                                        .productId(item.getVariant().getProduct().getId())
                                        .quantity(item.getQuantity())
                                        .availableQuantity(item.getVariant().getQuantity())
                                        .price(item.getPrice())
                                        .lineTotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                                        .build()
                                ).toList()
                )
                .totalAmount(total)
                .build();
    }
}
