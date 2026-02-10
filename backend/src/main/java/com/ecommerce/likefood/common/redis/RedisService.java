package com.ecommerce.likefood.common.redis;


import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisService {
    private final RedisTemplate<String, String> redisTemplate;

    private String buildRefreshKey(String jwtId) {
        return "refresh:" + jwtId;
    }

    private String buildOtpKey(String email) {
        return "fp:" + email;
    }

    public void storeRefreshToken(String jwtId, String email, Duration ttl) {
        String key = buildRefreshKey(jwtId);
        redisTemplate.opsForValue()
                .set(key, email, ttl.toSeconds(), TimeUnit.SECONDS);
    }

    public boolean isRefreshTokenValid(String jwtId) {
        String key = buildRefreshKey(jwtId);
        return redisTemplate.hasKey(key);
    }

    public void revokeRefreshToken(String jwtId) {
        String key = buildRefreshKey(jwtId);
        redisTemplate.delete(key);
    }

    public void storeOtp(String email, String otp, Duration ttl) {
        String key = buildOtpKey(email);
        redisTemplate.opsForValue().set(key, otp, ttl.toSeconds(), TimeUnit.SECONDS);
    }

    public String getOtp(String email) {
        return redisTemplate.opsForValue().get(buildOtpKey(email));
    }

    public void deleteOtp(String email) {
        redisTemplate.delete(buildOtpKey(email));
    }
}

