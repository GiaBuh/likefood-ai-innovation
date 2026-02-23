package com.ecommerce.likefood.chat.config.interceptor;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtWebSocketTokenResolver {

    private final JwtDecoder jwtDecoder;

    public String resolveToken(org.springframework.messaging.simp.stomp.StompHeaderAccessor accessor) {
        List<String> authHeader = accessor.getNativeHeader("Authorization");
        if (authHeader != null && !authHeader.isEmpty()) {
            String header = authHeader.get(0);
            if (header != null && header.startsWith("Bearer ")) {
                return header.substring(7);
            }
        }
        List<String> tokenParam = accessor.getNativeHeader("X-Auth-Token");
        if (tokenParam != null && !tokenParam.isEmpty()) {
            return tokenParam.get(0);
        }
        return null;
    }

    public boolean validateToken(String token) {
        try {
            jwtDecoder.decode(token);
            return true;
        } catch (Exception e) {
            log.debug("Invalid JWT for WebSocket: {}", e.getMessage());
            return false;
        }
    }

    public String getUsernameFromToken(String token) {
        Jwt jwt = jwtDecoder.decode(token);
        return jwt.getSubject();
    }
}
