package com.ecommerce.likefood.payment.vnpay.service;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.order.domain.Order;
import com.ecommerce.likefood.payment.vnpay.config.VnpayProperties;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;

class VnpayServiceTest {

    @Test
    void generatePaymentUrl_shouldConvertUsdToVndBeforeMultiplyingBy100() {
        VnpayProperties properties = new VnpayProperties();
        properties.setTmnCode("TMNCODE1");
        properties.setHashSecret("SECRET123");
        properties.setPayUrl("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        properties.setReturnUrl("http://localhost:3000/payment/vnpay/return");

        VnpayService service = new VnpayService(properties);

        Order order = Order.builder()
                .paymentRef("PAYREF001")
                .totalAmount(new BigDecimal("4.00"))
                .build();

        String url = service.generatePaymentUrl(order, "127.0.0.1");
        Map<String, String> query = parseQuery(url);

        assertEquals("VND", query.get("vnp_CurrCode"));
        assertEquals("10000000", query.get("vnp_Amount"));
    }

    @Test
    void generatePaymentUrl_shouldRejectWhenConvertedAmountBelowMinimum() {
        VnpayProperties properties = new VnpayProperties();
        properties.setTmnCode("TMNCODE1");
        properties.setHashSecret("SECRET123");
        properties.setPayUrl("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        properties.setReturnUrl("http://localhost:3000/payment/vnpay/return");

        VnpayService service = new VnpayService(properties);

        Order order = Order.builder()
                .paymentRef("PAYREF002")
                .totalAmount(new BigDecimal("0.10"))
                .build();

        assertThrows(AppException.class, () -> service.generatePaymentUrl(order, "127.0.0.1"));
    }

    @Test
    void isAmountMatched_shouldReturnTrueWhenCallbackAmountMatchesLockedOrderAmount() {
        VnpayProperties properties = new VnpayProperties();
        properties.setTmnCode("TMNCODE1");
        properties.setHashSecret("SECRET123");
        properties.setPayUrl("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        properties.setReturnUrl("http://localhost:3000/payment/vnpay/return");

        VnpayService service = new VnpayService(properties);

        Order order = Order.builder()
                .paymentRef("PAYREF003")
                .totalAmount(new BigDecimal("4.00"))
                .paymentAmountVnd(100000L)
                .build();

        Map<String, String> params = new HashMap<>();
        params.put("vnp_Amount", "10000000");

        assertTrue(service.isAmountMatched(params, order));
    }

    @Test
    void isAmountMatched_shouldReturnFalseWhenCallbackAmountDoesNotMatchLockedOrderAmount() {
        VnpayProperties properties = new VnpayProperties();
        properties.setTmnCode("TMNCODE1");
        properties.setHashSecret("SECRET123");
        properties.setPayUrl("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        properties.setReturnUrl("http://localhost:3000/payment/vnpay/return");

        VnpayService service = new VnpayService(properties);

        Order order = Order.builder()
                .paymentRef("PAYREF004")
                .totalAmount(new BigDecimal("4.00"))
                .paymentAmountVnd(100000L)
                .build();

        Map<String, String> params = new HashMap<>();
        params.put("vnp_Amount", "9999900");

        assertFalse(service.isAmountMatched(params, order));
    }

    private Map<String, String> parseQuery(String url) {
        int idx = url.indexOf('?');
        String queryString = idx >= 0 ? url.substring(idx + 1) : "";
        String[] parts = queryString.split("&");
        Map<String, String> out = new HashMap<>();
        for (String part : parts) {
            if (part == null || part.isBlank()) continue;
            String[] kv = part.split("=", 2);
            String key = kv.length > 0 ? kv[0] : "";
            String value = kv.length > 1 ? kv[1] : "";
            out.put(key, value);
        }
        return out;
    }
}
