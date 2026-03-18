package com.ecommerce.likefood.payment.vnpay.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class VnpayPaymentUrlResponse {
    private String paymentUrl;
}
