package com.ecommerce.likefood.cart.repository;

import com.ecommerce.likefood.cart.domain.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, String> {
    Optional<Cart> findByUser_Id(String userId);
}
