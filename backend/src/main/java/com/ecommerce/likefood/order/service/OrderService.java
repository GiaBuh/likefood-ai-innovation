package com.ecommerce.likefood.order.service;

import com.ecommerce.likefood.common.response.PaginationResponse;
import com.ecommerce.likefood.order.dto.req.OrderCreateRequest;
import com.ecommerce.likefood.order.dto.req.OrderSpecRequest;
import com.ecommerce.likefood.order.domain.OrderStatus;
import com.ecommerce.likefood.order.dto.res.OrderCheckoutResponse;
import com.ecommerce.likefood.order.dto.res.OrderResponse;
import com.ecommerce.likefood.payment.vnpay.dto.VnpayReturnResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface OrderService {
    OrderCheckoutResponse createOrderFromMyCart(OrderCreateRequest request, String clientIp);

    String retryVnpayPayment(String orderId, String clientIp);

    VnpayReturnResponse handleVnpayReturn(Map<String, String> params);

    List<OrderResponse> getMyOrders();

    PaginationResponse getAllOrders(OrderSpecRequest orderSpecRequest, Pageable pageable);

    OrderResponse updateOrderStatus(String orderId, OrderStatus status);

    OrderResponse cancelMyOrder(String orderId);
}
