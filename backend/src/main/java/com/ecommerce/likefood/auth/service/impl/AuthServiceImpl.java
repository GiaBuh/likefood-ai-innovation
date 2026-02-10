package com.ecommerce.likefood.auth.service.impl;

import com.ecommerce.likefood.auth.dto.req.LoginRequest;
import com.ecommerce.likefood.auth.dto.req.RegisterRequest;
import com.ecommerce.likefood.auth.dto.res.LoginResponse;
import com.ecommerce.likefood.auth.dto.res.RefreshResponse;
import com.ecommerce.likefood.auth.service.AuthService;
import com.ecommerce.likefood.auth.service.TokenService;
import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.common.redis.RedisService;
import com.ecommerce.likefood.common.security.UserDetailsCustom;
import com.ecommerce.likefood.common.security.UserDetailsServiceCustom;
import com.ecommerce.likefood.user.domain.Role;
import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.user.mapper.UserMapper;
import com.ecommerce.likefood.user.dto.res.UserResponse;
import com.ecommerce.likefood.user.repository.RoleRepository;
import com.ecommerce.likefood.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {
    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final RedisService redisService;
    private final UserMapper userMapper;
    private final TokenService tokenService;
    private final JwtDecoder jwtDecoder;
    private final UserDetailsServiceCustom userDetailsServiceCustom;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        UsernamePasswordAuthenticationToken authenticationToken
                = new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword());

        // =>>>> cần viết hàm loadUserByUsername
        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetailsCustom userDetailsCustom = (UserDetailsCustom) authentication.getPrincipal();
        LoginResponse.UserLoginResponse loginResponse = this.userMapper.toUserLoginResponse(userDetailsCustom);

        String accessToken = this.tokenService.createAccessToken(authentication);
        String refreshToken = this.tokenService.createRefreshToken(authentication);

        return LoginResponse.builder()
                .user(loginResponse)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Override
    public void logout(String refreshToken) {
        Jwt jwt = jwtDecoder.decode(refreshToken);
        String type = jwt.getClaim("type");
        if (!type.equals("refresh")) {
            throw new JwtException("Invalid token type");
        }

        String jwtId = jwt.getId();
        this.redisService.revokeRefreshToken(jwtId);
    }

    @Override
    public RefreshResponse refresh(String refreshToken) {
        Jwt jwt = jwtDecoder.decode(refreshToken);

        String jwtId = jwt.getId();
        String type = jwt.getClaim("type");

        if (!type.equals("refresh") || !this.redisService.isRefreshTokenValid(jwtId)) {
            throw new JwtException("Invalid or expired token");
        }

        String subject = jwt.getSubject();
        UserDetails userDetails = this.userDetailsServiceCustom.loadUserByUsername(subject);

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        userDetails.getUsername(),
                        null,
                        userDetails.getAuthorities()
                );
        String access_Token = this.tokenService.createAccessToken(authentication);

        return RefreshResponse.builder()
                .accessToken(access_Token)
                .build();
    }

    @Override
    public UserResponse register(RegisterRequest registerRequest) {
        validationExistsByEmail(registerRequest.getEmail());

        Role role = getRoleForUser();
        User user = this.userMapper.toUser(registerRequest);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setAvatarUrl("default-avatar.png");
        user.setRole(role);

        return this.userMapper.toResponse(this.userRepository.save(user));
    }

    private void validationExistsByEmail(String email) {
        if (this.userRepository.existsByEmail(email)) {
            throw new AppException("Email already exists");
        }
    }

    private Role getRoleForUser() {
        return this.roleRepository.findRoleByName("USER")
                .orElseThrow(() -> new AppException("Role USER not found"));
    }
}