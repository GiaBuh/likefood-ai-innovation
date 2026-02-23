package com.ecommerce.likefood.order.service;

import com.ecommerce.likefood.common.response.PaginationResponse;
import com.ecommerce.likefood.order.dto.req.OrderCreateRequest;
import com.ecommerce.likefood.order.dto.req.OrderSpecRequest;
import com.ecommerce.likefood.order.domain.OrderStatus;
import com.ecommerce.likefood.order.dto.res.OrderResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface OrderService {
    OrderResponse createOrderFromMyCart(OrderCreateRequest request);

    List<OrderResponse> getMyOrders();

    PaginationResponse getAllOrders(OrderSpecRequest orderSpecRequest, Pageable pageable);

    OrderResponse updateOrderStatus(String orderId, OrderStatus status);

    OrderResponse cancelMyOrder(String orderId);
}
