package com.ecommerce.likefood.order.controller;

import com.ecommerce.likefood.common.response.PaginationResponse;
import com.ecommerce.likefood.common.utils.ApiMessage;
import com.ecommerce.likefood.order.dto.req.OrderCreateRequest;
import com.ecommerce.likefood.order.dto.req.OrderSpecRequest;
import com.ecommerce.likefood.order.dto.req.OrderStatusUpdateRequest;
import com.ecommerce.likefood.order.dto.res.OrderResponse;
import com.ecommerce.likefood.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/orders/me")
    @ApiMessage("Create order from my cart")
    public ResponseEntity<OrderResponse> createFromMyCart(@RequestBody @Valid OrderCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrderFromMyCart(request));
    }

    @GetMapping("/orders/me")
    @ApiMessage("Get my orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders() {
        return ResponseEntity.ok(orderService.getMyOrders());
    }

    @PatchMapping("/orders/me/{orderId}/cancel")
    @ApiMessage("Cancel my order")
    public ResponseEntity<OrderResponse> cancelMyOrder(@PathVariable("orderId") String orderId) {
        return ResponseEntity.ok(orderService.cancelMyOrder(orderId));
    }

    @GetMapping("/orders")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Get all orders")
    public ResponseEntity<PaginationResponse> getAllOrders(
            @ModelAttribute OrderSpecRequest orderSpecRequest,
            Pageable pageable
    ) {
        return ResponseEntity.ok(orderService.getAllOrders(orderSpecRequest, pageable));
    }

    @PatchMapping("/orders/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Update order status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable("orderId") String orderId,
            @RequestBody @Valid OrderStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, request.getStatus()));
    }
}
