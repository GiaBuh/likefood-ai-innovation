package com.ecommerce.likefood.payment.sepay.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@Builder
public class SepayCheckoutPayload {
    private String actionUrl;

    @Builder.Default
    private String method = "POST";

    @Builder.Default
    private Map<String, String> fields = new LinkedHashMap<>();
}
