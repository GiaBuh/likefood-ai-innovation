package com.ecommerce.likefood.payment.vnpay.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class VnpayReturnResponse {
    private boolean validSignature;
    private boolean paid;
    private String paymentRef;
    private String responseCode;
    private String message;
}
