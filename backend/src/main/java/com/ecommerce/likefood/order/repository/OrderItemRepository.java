package com.ecommerce.likefood.order.repository;

import com.ecommerce.likefood.order.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, String> {
    boolean existsByVariant_Product_Id(String productId);
}
