package com.ecommerce.likefood.auth.service;

import org.springframework.security.core.Authentication;

public interface TokenService {
    String createAccessToken(Authentication authentication);
    String createRefreshToken(Authentication authentication);
}
