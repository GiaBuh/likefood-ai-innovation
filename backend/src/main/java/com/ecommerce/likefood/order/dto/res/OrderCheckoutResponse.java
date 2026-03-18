package com.ecommerce.likefood.order.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class OrderCheckoutResponse {
    private OrderResponse order;

    @Builder.Default
    private boolean paymentRequired = false;

    private String paymentProvider;

    private String vnpayPaymentUrl;
}
