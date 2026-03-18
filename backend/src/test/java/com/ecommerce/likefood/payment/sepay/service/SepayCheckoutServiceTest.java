package com.ecommerce.likefood.payment.sepay.service;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.order.domain.Order;
import com.ecommerce.likefood.payment.sepay.config.SepayProperties;
import com.ecommerce.likefood.payment.sepay.dto.SepayCheckoutPayload;
import com.ecommerce.likefood.user.domain.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class SepayCheckoutServiceTest {

    @Test
    void buildCheckoutPayload_shouldReturnSignedPayload() {
        SepayProperties properties = new SepayProperties();
        properties.setMerchantId("M123");
        properties.setSecretKey("secret");
        properties.setCheckoutUrl("https://pay-sandbox.sepay.vn/v1/init");
        properties.setSuccessUrl("http://localhost:3000/payment/sepay/success");
        properties.setErrorUrl("http://localhost:3000/payment/sepay/error");
        properties.setCancelUrl("http://localhost:3000/payment/sepay/cancel");

        SepayCheckoutService service = new SepayCheckoutService(properties);

        User user = new User();
        user.setId("U1");

        Order order = Order.builder()
                .id("O1")
                .user(user)
                .totalAmount(new BigDecimal("125000"))
                .paymentRef("PAYREF123")
                .build();

        SepayCheckoutPayload payload = service.buildCheckoutPayload(order);

        assertEquals("https://pay-sandbox.sepay.vn/v1/init", payload.getActionUrl());
        assertEquals("POST", payload.getMethod());
        assertEquals("PAYREF123", payload.getFields().get("order_invoice_number"));
        assertNotNull(payload.getFields().get("signature"));
        assertFalse(payload.getFields().get("signature").isBlank());

        // Verify field order: merchant must be first (SePay docs requirement)
        var fieldKeys = new java.util.ArrayList<>(payload.getFields().keySet());
        assertEquals("merchant", fieldKeys.get(0), "merchant must be the first field per SePay docs");
        assertEquals("M123", payload.getFields().get("merchant"));
    }

    @Test
    void buildCheckoutPayload_shouldFailWhenMissingConfig() {
        SepayProperties properties = new SepayProperties();
        SepayCheckoutService service = new SepayCheckoutService(properties);

        Order order = Order.builder()
                .id("O1")
                .totalAmount(new BigDecimal("125000"))
                .paymentRef("PAYREF123")
                .build();

        assertThrows(AppException.class, () -> service.buildCheckoutPayload(order));
    }

    @Test
    void isSuccessStatus_shouldMatchOrderPaidAndCaptured() {
        SepayProperties properties = new SepayProperties();
        SepayCheckoutService service = new SepayCheckoutService(properties);

        assertTrue(service.isSuccessStatus("ORDER_PAID", "CAPTURED"));
        assertFalse(service.isSuccessStatus("ORDER_CREATED", "CAPTURED"));
        assertFalse(service.isSuccessStatus("ORDER_PAID", "VOID"));
    }
}
