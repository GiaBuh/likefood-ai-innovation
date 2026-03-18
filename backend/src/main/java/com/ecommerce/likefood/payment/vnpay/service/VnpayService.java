package com.ecommerce.likefood.payment.vnpay.service;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.order.domain.Order;
import com.ecommerce.likefood.payment.vnpay.config.VnpayProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

@Service
@RequiredArgsConstructor
public class VnpayService {
    private static final String HMAC_SHA512 = "HmacSHA512";
    private static final TimeZone VNPAY_TIMEZONE = TimeZone.getTimeZone("Asia/Ho_Chi_Minh");

    private final VnpayProperties properties;

    public String generatePaymentUrl(Order order, String ipAddress) {
        ensureConfigured();
        if (order.getPaymentRef() == null || order.getPaymentRef().isBlank()) {
            throw new AppException("Payment reference is required for VNPay checkout");
        }

        long amount = resolveExpectedVnpAmount(order);
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", safe(properties.getTmnCode()));
        params.put("vnp_Amount", String.valueOf(amount));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", order.getPaymentRef());
        params.put("vnp_OrderInfo", "Thanh toan don hang:" + order.getPaymentRef());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", safe(properties.getReturnUrl()));
        params.put("vnp_IpAddr", safeIp(ipAddress));

        Calendar calendar = Calendar.getInstance(VNPAY_TIMEZONE);
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(VNPAY_TIMEZONE);
        params.put("vnp_CreateDate", formatter.format(calendar.getTime()));
        calendar.add(Calendar.MINUTE, 15);
        params.put("vnp_ExpireDate", formatter.format(calendar.getTime()));

        String hashData = buildData(params);
        String query = buildQuery(params);
        String secureHash = hmacSHA512(safe(properties.getHashSecret()), hashData);
        return safe(properties.getPayUrl()) + "?" + query + "&vnp_SecureHash=" + secureHash;
    }

    public boolean isReturnSignatureValid(Map<String, String> params) {
        if (params == null || params.isEmpty()) return false;

        String secureHash = safe(params.get("vnp_SecureHash"));
        if (secureHash.isBlank()) return false;

        Map<String, String> data = new HashMap<>(params);
        data.remove("vnp_SecureHash");
        data.remove("vnp_SecureHashType");

        String expected = hmacSHA512(safe(properties.getHashSecret()), buildData(data));
        return expected.equalsIgnoreCase(secureHash);
    }

    public boolean isSuccessResponse(Map<String, String> params) {
        if (!"00".equals(safe(params.get("vnp_ResponseCode")))) {
            return false;
        }
        String transactionStatus = safe(params.get("vnp_TransactionStatus"));
        return transactionStatus.isBlank() || "00".equals(transactionStatus);
    }

    public String resolvePaymentRef(Map<String, String> params) {
        return safe(params.get("vnp_TxnRef"));
    }

    public boolean isAmountMatched(Map<String, String> params, Order order) {
        if (params == null || order == null) {
            return false;
        }
        String rawAmount = safe(params.get("vnp_Amount"));
        if (rawAmount.isBlank()) {
            return false;
        }
        long actual;
        try {
            actual = Long.parseLong(rawAmount);
        } catch (NumberFormatException ex) {
            return false;
        }
        try {
            return actual == resolveExpectedVnpAmount(order);
        } catch (AppException ex) {
            return false;
        }
    }

    public long resolvePaymentAmountVnd(Order order) {
        ensureConfigured();
        if (order == null) {
            throw new AppException("Order is required for VNPay checkout");
        }
        return resolvePaymentAmountVnd(order.getTotalAmount());
    }

    private long resolveExpectedVnpAmount(Order order) {
        long amountVnd = order.getPaymentAmountVnd() != null && order.getPaymentAmountVnd() > 0
                ? order.getPaymentAmountVnd()
                : resolvePaymentAmountVnd(order);
        if (amountVnd > Long.MAX_VALUE / 100L) {
            throw new AppException("VNPay amount is too large");
        }
        return amountVnd * 100L;
    }

    private long resolvePaymentAmountVnd(BigDecimal amountUsd) {
        if (amountUsd == null) {
            throw new AppException("Order amount is required for VNPay checkout");
        }
        BigDecimal converted = amountUsd.multiply(properties.getUsdToVndRate()).setScale(0, RoundingMode.HALF_UP);
        long amountVnd = converted.longValue();
        if (amountVnd < properties.getMinimumVndAmount()) {
            throw new AppException("VNPay minimum amount is " + properties.getMinimumVndAmount() + " VND");
        }
        return amountVnd;
    }

    private String buildData(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        for (int i = 0; i < fieldNames.size(); i++) {
            String field = fieldNames.get(i);
            String value = params.get(field);
            if (value == null || value.isBlank()) continue;
            if (hashData.length() > 0) {
                hashData.append('&');
            }
            hashData.append(field).append('=').append(urlEncode(value));
        }
        return hashData.toString();
    }

    private String buildQuery(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder query = new StringBuilder();
        for (String field : fieldNames) {
            String value = params.get(field);
            if (value == null || value.isBlank()) continue;
            if (query.length() > 0) {
                query.append('&');
            }
            query.append(urlEncode(field)).append('=').append(urlEncode(value));
        }
        return query.toString();
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance(HMAC_SHA512);
            hmac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), HMAC_SHA512));
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new AppException("Failed to sign VNPay payload");
        }
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private String safeIp(String ip) {
        String safe = safe(ip);
        return safe.isBlank() ? "127.0.0.1" : safe;
    }

    private void ensureConfigured() {
        if (safe(properties.getTmnCode()).isBlank()
                || safe(properties.getHashSecret()).isBlank()
                || safe(properties.getPayUrl()).isBlank()
                || safe(properties.getReturnUrl()).isBlank()
                || properties.getUsdToVndRate() == null
                || properties.getUsdToVndRate().compareTo(BigDecimal.ZERO) <= 0
                || properties.getMinimumVndAmount() == null
                || properties.getMinimumVndAmount() <= 0) {
            throw new AppException("VNPay configuration is missing");
        }
    }
}
