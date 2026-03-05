package com.ecommerce.likefood.auth.service.impl;

import com.ecommerce.likefood.auth.service.GoogleAuthService;
import com.ecommerce.likefood.auth.service.GoogleUserInfo;
import com.ecommerce.likefood.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthServiceImpl implements GoogleAuthService {

    private static final String AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
    private static final String USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";
    private static final String SCOPE = "email profile openid";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${likefood.google.client-id}")
    private String clientId;

    @Value("${likefood.google.client-secret}")
    private String clientSecret;

    @Value("${likefood.google.redirect-uri}")
    private String redirectUri;

    @Override
    public String buildAuthorizationUrl() {
        if (clientId == null || clientId.isBlank()) {
            throw new AppException("Google OAuth is not configured. Please set GOOGLE_CLIENT_ID.");
        }
        String state = UUID.randomUUID().toString();
        return String.format(
                "%s?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&state=%s&access_type=online&prompt=consent",
                AUTHORIZATION_ENDPOINT,
                urlEncode(clientId),
                urlEncode(redirectUri),
                urlEncode(SCOPE),
                urlEncode(state)
        );
    }

    @Override
    public GoogleUserInfo getUserInfoFromCode(String code) {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new AppException("Google OAuth is not configured.");
        }

        String googleToken = exchangeCodeForAccessToken(code);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(googleToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                USERINFO_ENDPOINT,
                HttpMethod.GET,
                entity,
                Map.class
        );

        if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
            throw new AppException("Failed to get user info from Google");
        }

        Map<String, Object> body = response.getBody();
        String email = (String) body.get("email");
        if (email == null || email.isBlank()) {
            throw new AppException("Google account does not provide email");
        }

        String name = (String) body.get("name");
        String picture = (String) body.get("picture");

        return GoogleUserInfo.builder()
                .email(email)
                .name(name != null ? name : email.split("@")[0])
                .pictureUrl(picture)
                .build();
    }

    private String exchangeCodeForAccessToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(TOKEN_ENDPOINT, HttpMethod.POST, entity, Map.class);
            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new AppException("Invalid or expired authorization code. Please try again.");
            }
            Map<String, Object> body = response.getBody();
            String accessToken = (String) body.get("access_token");
            if (accessToken == null || accessToken.isBlank()) {
                throw new AppException("Failed to get access token from Google");
            }
            return accessToken;
        } catch (HttpClientErrorException e) {
            String responseBody = e.getResponseBodyAsString();
            log.warn("Google token exchange failed ({}): redirect_uri={}, body={}", e.getStatusCode(), redirectUri, responseBody);
            if (responseBody != null && responseBody.contains("redirect_uri_mismatch")) {
                throw new AppException("redirect_uri mismatch. Backend GOOGLE_REDIRECT_URI must match Google Console. Current: " + redirectUri);
            }
            if (responseBody != null && responseBody.contains("invalid_grant")) {
                throw new AppException("Authorization code expired or already used. Please try logging in again.");
            }
            throw new AppException("Google login failed. Please try again.");
        }
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
