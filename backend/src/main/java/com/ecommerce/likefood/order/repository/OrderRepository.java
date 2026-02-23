package com.ecommerce.likefood.order.repository;

import com.ecommerce.likefood.order.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, String>, JpaSpecificationExecutor<Order> {
    List<Order> findByUser_IdOrderByCreatedAtDesc(String userId);
    Optional<Order> findByIdAndUser_Id(String id, String userId);

    List<Order> findAllByOrderByCreatedAtDesc();
}
