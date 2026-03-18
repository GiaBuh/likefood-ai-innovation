package com.ecommerce.likefood.payment.sepay.service;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.order.domain.Order;
import com.ecommerce.likefood.payment.sepay.config.SepayProperties;
import com.ecommerce.likefood.payment.sepay.dto.SepayCheckoutPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class SepayCheckoutService {
    private static final String HMAC_SHA256 = "HmacSHA256";

    private final SepayProperties sepayProperties;

    public SepayCheckoutPayload buildCheckoutPayload(Order order) {
        ensureConfigured();

        String invoice = order.getPaymentRef();
        if (invoice == null || invoice.isBlank()) {
            throw new AppException("Payment reference is required for SePay checkout");
        }

        // Field order MUST match SePay docs for correct HMAC-SHA256 signature.
        // See: https://docs.sepay.vn — signing string order is:
        // merchant, operation, payment_method, order_amount, currency,
        // order_invoice_number, order_description, customer_id,
        // success_url, error_url, cancel_url
        LinkedHashMap<String, String> fields = new LinkedHashMap<>();
        fields.put("merchant", safe(sepayProperties.getMerchantId()));
        fields.put("operation", "PURCHASE");
        fields.put("payment_method", "BANK_TRANSFER");
        fields.put("order_amount", normalizeAmount(order));
        fields.put("currency", "VND");
        fields.put("order_invoice_number", invoice);
        fields.put("order_description", "Thanh toan don hang " + order.getId());
        fields.put("customer_id", order.getUser() != null ? safe(order.getUser().getId()) : "");
        fields.put("success_url", safe(sepayProperties.getSuccessUrl()));
        fields.put("error_url", safe(sepayProperties.getErrorUrl()));
        fields.put("cancel_url", safe(sepayProperties.getCancelUrl()));

        String signatureData = fields.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .reduce((left, right) -> left + "," + right)
                .orElse("");
        log.debug("SePay signature base string: {}", signatureData);
        fields.put("signature", sign(signatureData, sepayProperties.getSecretKey()));

        return SepayCheckoutPayload.builder()
                .actionUrl(safe(sepayProperties.getCheckoutUrl()))
                .method("POST")
                .fields(fields)
                .build();
    }

    public boolean isIpnSecretValid(String ipnSecret) {
        String expected = safe(sepayProperties.getIpnSecret());
        return !expected.isBlank() && Objects.equals(expected, safe(ipnSecret));
    }

    public boolean isSuccessStatus(String notificationType, String transactionStatus) {
        String type = safe(notificationType).toUpperCase(Locale.ROOT);
        String status = safe(transactionStatus).toUpperCase(Locale.ROOT);

        if (!"ORDER_PAID".equals(type)) {
            return false;
        }

        return "CAPTURED".equals(status)
                || "PAID".equals(status)
                || "COMPLETED".equals(status)
                || "SUCCESS".equals(status)
                || "APPROVED".equals(status);
    }

    private void ensureConfigured() {
        if (safe(sepayProperties.getMerchantId()).isBlank()
                || safe(sepayProperties.getSecretKey()).isBlank()
                || safe(sepayProperties.getCheckoutUrl()).isBlank()) {
            throw new AppException("SePay configuration is missing");
        }
    }

    private String normalizeAmount(Order order) {
        if (order.getTotalAmount() == null) {
            return "0";
        }
        return order.getTotalAmount().setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private String sign(String input, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKey);
            byte[] raw = mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(raw);
        } catch (Exception e) {
            throw new AppException("Failed to sign SePay payload");
        }
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
