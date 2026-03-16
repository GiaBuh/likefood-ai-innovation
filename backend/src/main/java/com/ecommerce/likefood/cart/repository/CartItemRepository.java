package com.ecommerce.likefood.cart.repository;

import com.ecommerce.likefood.cart.domain.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, String> {
    Optional<CartItem> findByCart_IdAndVariant_Id(String cartId, String variantId);
    Optional<CartItem> findByCart_IdAndComboCampaign_Id(String cartId, String comboCampaignId);

    boolean existsByVariant_Id(String variantId);

    void deleteAllByCart_Id(String cartId);

    void deleteAllByVariant_Product_Id(String productId);
}
