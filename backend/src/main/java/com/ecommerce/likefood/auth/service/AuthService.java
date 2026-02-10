package com.ecommerce.likefood.auth.service;


import com.ecommerce.likefood.auth.dto.req.LoginRequest;
import com.ecommerce.likefood.auth.dto.req.RegisterRequest;
import com.ecommerce.likefood.auth.dto.res.LoginResponse;
import com.ecommerce.likefood.auth.dto.res.RefreshResponse;
import com.ecommerce.likefood.user.dto.res.UserResponse;

public interface AuthService {
    LoginResponse login(LoginRequest loginRequest);

    void logout(String refreshToken);

    RefreshResponse refresh(String refreshToken);

    UserResponse register(RegisterRequest registerRequest);
}
