package com.ecommerce.likefood.order.dto.req;

import com.ecommerce.likefood.common.specification.FilterField;
import com.ecommerce.likefood.common.specification.FilterOperator;
import com.ecommerce.likefood.order.domain.OrderStatus;
import com.ecommerce.likefood.order.domain.PaymentStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderSpecRequest {
    @FilterField(operator = FilterOperator.LIKE)
    private String id;

    @FilterField(column = "user.username", operator = FilterOperator.LIKE)
    private String customerName;

    @FilterField(column = "user.email", operator = FilterOperator.LIKE)
    private String customerEmail;

    @FilterField(operator = FilterOperator.EQUAL)
    private OrderStatus status;

    @FilterField(operator = FilterOperator.EQUAL)
    private PaymentStatus paymentStatus;
}
