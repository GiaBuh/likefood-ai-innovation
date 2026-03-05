package com.ecommerce.likefood.auth.controller;

import com.ecommerce.likefood.auth.dto.req.GoogleAuthCallbackRequest;
import com.ecommerce.likefood.auth.dto.req.LoginRequest;
import com.ecommerce.likefood.auth.dto.req.RegisterRequest;
import com.ecommerce.likefood.auth.dto.res.GoogleAuthUrlResponse;
import com.ecommerce.likefood.auth.dto.res.LoginResponse;
import com.ecommerce.likefood.auth.dto.res.RefreshResponse;
import com.ecommerce.likefood.auth.service.AuthService;
import com.ecommerce.likefood.auth.service.GoogleAuthService;
import com.ecommerce.likefood.common.utils.ApiMessage;
import com.ecommerce.likefood.user.dto.res.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AuthController {
    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;

    @Value("${likefood.jwt.refreshToken-validity-in-second}")
    private long refreshTokenCookieMaxAge;

    @Value("${likefood.auth.cookie.secure:false}")
    private boolean secureCookie;

    private ResponseCookie buildRefreshTokenCookie(String refreshToken) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE, refreshToken)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .maxAge(refreshTokenCookieMaxAge)
                .sameSite("Strict")
                .build();
    }

    private ResponseCookie clearRefreshTokenCookie() {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .maxAge(0)
                .sameSite("Strict")
                .build();
    }

    @GetMapping("/auth/google/url")
    @ApiMessage("Get Google login URL")
    public ResponseEntity<GoogleAuthUrlResponse> getGoogleLoginUrl() {
        String url = this.googleAuthService.buildAuthorizationUrl();
        return ResponseEntity.ok(GoogleAuthUrlResponse.builder().url(url).build());
    }

    @PostMapping("/auth/google/exchange")
    @ApiMessage("Google login - exchange code for tokens")
    public ResponseEntity<LoginResponse> googleLoginCallback(@RequestBody @Valid GoogleAuthCallbackRequest request) {
        LoginResponse loginResponse = this.authService.loginWithGoogle(request.getCode());
        ResponseCookie refreshCookie = buildRefreshTokenCookie(loginResponse.getRefreshToken());

        LoginResponse responseBody = LoginResponse.builder()
                .user(loginResponse.getUser())
                .accessToken(loginResponse.getAccessToken())
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(responseBody);
    }

    @PostMapping("/auth/login")
    @ApiMessage("User login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest loginRequest) {
        LoginResponse loginResponse = this.authService.login(loginRequest);
        ResponseCookie refreshCookie = buildRefreshTokenCookie(loginResponse.getRefreshToken());

        LoginResponse responseBody = LoginResponse.builder()
                .user(loginResponse.getUser())
                .accessToken(loginResponse.getAccessToken())
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(responseBody);
    }

    @PostMapping("/auth/logout")
    @ApiMessage("Logout user")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken
    ) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            this.authService.logout(refreshToken);
        }

        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .header(HttpHeaders.SET_COOKIE, clearRefreshTokenCookie().toString())
                .build();
    }

    @PostMapping("/auth/refresh")
    @ApiMessage("Refresh accessToken")
    public ResponseEntity<RefreshResponse> refresh(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken
    ) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new JwtException("Refresh token is missing");
        }
        return ResponseEntity.ok(this.authService.refresh(refreshToken));
    }

    @PostMapping("/auth/register")
    @ApiMessage("Register user")
    public ResponseEntity<UserResponse> register(@RequestBody @Valid RegisterRequest registerRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.authService.register(registerRequest));
    }
}
