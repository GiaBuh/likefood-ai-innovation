package com.ecommerce.likefood.order.dto.req;

import com.ecommerce.likefood.order.domain.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderStatusUpdateRequest {
    @NotNull(message = "Order status is required")
    private OrderStatus status;
}
