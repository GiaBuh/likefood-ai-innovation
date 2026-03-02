package com.ecommerce.likefood.order.service;

import com.ecommerce.likefood.order.domain.Order;

public interface OrderInvoiceEmailService {
    void sendInvoiceEmail(Order order);
}
