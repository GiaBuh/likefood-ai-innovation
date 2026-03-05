package com.ecommerce.likefood.auth.service;

public interface GoogleAuthService {
    String buildAuthorizationUrl();
    GoogleUserInfo getUserInfoFromCode(String code);
}
