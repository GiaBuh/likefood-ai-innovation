package com.ecommerce.likefood.order.dto.res;

import com.ecommerce.likefood.order.domain.PaymentMethod;
import com.ecommerce.likefood.order.domain.PaymentStatus;
import com.ecommerce.likefood.order.domain.OrderStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
public class OrderResponse {
    private String id;
    private String userId;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private Instant createdAt;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String note;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private Instant paidAt;
    private CustomerResponse customer;

    @Builder.Default
    private List<OrderItemResponse> items = new ArrayList<>();

    @Getter
    @Setter
    @Builder
    public static class CustomerResponse {
        private String id;
        private String fullname;
        private String email;
        private String phoneNumber;
        private String address;
        private String avatarUrl;
    }
}
