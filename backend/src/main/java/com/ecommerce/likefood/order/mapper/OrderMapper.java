package com.ecommerce.likefood.order.mapper;

import com.ecommerce.likefood.order.domain.Order;
import com.ecommerce.likefood.order.domain.OrderItem;
import com.ecommerce.likefood.order.dto.res.OrderItemResponse;
import com.ecommerce.likefood.order.dto.res.OrderResponse;
import com.ecommerce.likefood.user.domain.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user", target = "customer")
    OrderResponse toResponse(Order order);

    @Mapping(source = "username", target = "fullname")
    OrderResponse.CustomerResponse toCustomerResponse(User user);

    @Mapping(source = "variant.id", target = "variantId")
    @Mapping(target = "lineTotal", expression = "java(item.getPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())))")
    OrderItemResponse toItemResponse(OrderItem item);
}
