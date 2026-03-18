package com.ecommerce.likefood.cart.service.impl;

import com.ecommerce.likefood.ai.domain.ComboCampaign;
import com.ecommerce.likefood.ai.repository.ComboCampaignRepository;
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
import com.ecommerce.likefood.storage.service.StorageService;
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
    private final ComboCampaignRepository comboCampaignRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @Override
    public CartResponse getMyCart() {
        Cart cart = getOrCreateCartForCurrentUser();
        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addItem(CartItemUpsertRequest request) {
        Cart cart = getOrCreateCartForCurrentUser();

        // Determine if this is a COMBO or PRODUCT item
        if (request.getComboCampaignId() != null && !request.getComboCampaignId().isBlank()) {
            return addComboItem(cart, request);
        } else if (request.getVariantId() != null && !request.getVariantId().isBlank()) {
            return addProductItem(cart, request);
        } else {
            throw new AppException("Either variantId or comboCampaignId is required");
        }
    }

    private CartResponse addProductItem(Cart cart, CartItemUpsertRequest request) {
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
                    .itemType("PRODUCT")
                    .quantity(toAdd)
                    .price(variant.getPrice())
                    .build();
            cart.getItems().add(cartItem);
            cartItemRepository.save(cartItem);
        }
        return toResponse(cartRepository.findById(cart.getId()).orElse(cart));
    }

    private CartResponse addComboItem(Cart cart, CartItemUpsertRequest request) {
        ComboCampaign combo = comboCampaignRepository.findById(request.getComboCampaignId())
                .orElseThrow(() -> new AppException("Combo not found"));

        if (!"PUBLISHED".equals(combo.getStatus())) {
            throw new AppException("Combo is not published");
        }

        int toAdd = request.getQuantity() != null ? request.getQuantity() : 1;

        Optional<CartItem> existed = cartItemRepository.findByCart_IdAndComboCampaign_Id(cart.getId(), combo.getId());
        if (existed.isPresent()) {
            CartItem cartItem = existed.get();
            cartItem.setQuantity(cartItem.getQuantity() + toAdd);
            cartItemRepository.save(cartItem);
        } else {
            BigDecimal comboPrice = combo.getComboPrice() != null ? combo.getComboPrice() : BigDecimal.ZERO;
            CartItem cartItem = CartItem.builder()
                    .cart(cart)
                    .comboCampaign(combo)
                    .itemType("COMBO")
                    .quantity(toAdd)
                    .price(comboPrice)
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

        // Stock check only for PRODUCT items
        if ("PRODUCT".equals(cartItem.getItemType()) && cartItem.getVariant() != null) {
            int availableQty = cartItem.getVariant().getQuantity() != null ? cartItem.getVariant().getQuantity() : 0;
            if (quantity > availableQty) {
                throw new AppException("Exceeds available stock. Maximum: " + availableQty);
            }
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
                                .map(this::toItemResponse)
                                .toList()
                )
                .totalAmount(total)
                .build();
    }

    private CartItemResponse toItemResponse(CartItem item) {
        if ("COMBO".equals(item.getItemType()) && item.getComboCampaign() != null) {
            ComboCampaign combo = item.getComboCampaign();
            return CartItemResponse.builder()
                    .id(item.getId())
                    .itemType("COMBO")
                    .comboCampaignId(combo.getId())
                    .name(combo.getComboName())
                    .imageUrl(combo.getImageUrl())
                    .variantLabel("Combo")
                    .quantity(item.getQuantity())
                    .price(item.getPrice())
                    .lineTotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .build();
        } else {
            // PRODUCT item
            ProductVariant variant = item.getVariant();
            String productName = variant != null && variant.getProduct() != null 
                    ? variant.getProduct().getName() : "Unknown";
            String imageUrl = "";
            if (variant != null && variant.getProduct() != null && variant.getProduct().getThumbnailKey() != null) {
                try {
                    imageUrl = storageService.getPublicImageUrl(variant.getProduct().getThumbnailKey());
                } catch (Exception ignored) {}
            }
            String variantLabel = variant != null 
                    ? variant.getWeightValue() + " " + variant.getWeightUnit()
                    : "Default";
            
            return CartItemResponse.builder()
                    .id(item.getId())
                    .itemType("PRODUCT")
                    .variantId(variant != null ? variant.getId() : null)
                    .productId(variant != null && variant.getProduct() != null ? variant.getProduct().getId() : null)
                    .name(productName)
                    .imageUrl(imageUrl)
                    .variantLabel(variantLabel)
                    .quantity(item.getQuantity())
                    .availableQuantity(variant != null && variant.getQuantity() != null ? variant.getQuantity() : 0)
                    .price(item.getPrice())
                    .lineTotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .build();
        }
    }
}
