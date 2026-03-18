package com.ecommerce.likefood.payment.sepay.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "likefood.payment.sepay")
public class SepayProperties {
    private String merchantId;
    private String secretKey;
    private String checkoutUrl;
    private String ipnSecret;
    private String successUrl;
    private String errorUrl;
    private String cancelUrl;
}
