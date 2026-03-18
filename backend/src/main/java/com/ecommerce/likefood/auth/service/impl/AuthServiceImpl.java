package com.ecommerce.likefood.auth.service.impl;

import com.ecommerce.likefood.auth.dto.req.LoginRequest;
import com.ecommerce.likefood.auth.dto.req.RegisterRequest;
import com.ecommerce.likefood.auth.dto.res.LoginResponse;
import com.ecommerce.likefood.auth.dto.res.RefreshResponse;
import com.ecommerce.likefood.auth.service.AuthService;
import com.ecommerce.likefood.auth.service.GoogleAuthService;
import com.ecommerce.likefood.auth.service.GoogleUserInfo;
import com.ecommerce.likefood.auth.service.TokenService;
import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.common.redis.RedisService;
import com.ecommerce.likefood.common.security.UserDetailsCustom;
import com.ecommerce.likefood.common.security.UserDetailsServiceCustom;
import com.ecommerce.likefood.user.domain.Permission;
import com.ecommerce.likefood.user.domain.Role;
import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.user.dto.res.UserResponse;
import com.ecommerce.likefood.user.repository.PermissionRepository;
import com.ecommerce.likefood.user.repository.RoleRepository;
import com.ecommerce.likefood.user.repository.UserRepository;
import com.ecommerce.likefood.user.mapper.UserMapper;
import com.ecommerce.likefood.common.security.SecurityUtils;
import com.ecommerce.likefood.voucher.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

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
    private final GoogleAuthService googleAuthService;
    private final VoucherService voucherService;
    private final PermissionRepository permissionRepository;

    private static final String SUPER_ADMIN_ROLE = "SUPER_ADMIN";

    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        UsernamePasswordAuthenticationToken authenticationToken
                = new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword());

        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Load full user to get permissions and mustChangePassword
        User user = userRepository.findByEmail(loginRequest.getUsername())
                .orElseThrow(() -> new AppException("User not found"));

        LoginResponse.UserLoginResponse loginResponse = buildUserLoginResponse(user);

        String accessToken = this.tokenService.createAccessToken(authentication);
        String refreshToken = this.tokenService.createRefreshToken(authentication);

        return LoginResponse.builder()
                .user(loginResponse)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Override
    public LoginResponse loginWithGoogle(String code) {
        GoogleUserInfo googleUser = this.googleAuthService.getUserInfoFromCode(code);

        User user = this.userRepository.findByEmail(googleUser.getEmail())
                .orElseGet(() -> createUserFromGoogle(googleUser));

        UserDetailsCustom userDetailsCustom = new UserDetailsCustom(
                user.getId(),
                user.getUsername(),
                user.getPassword() != null ? user.getPassword() : "",
                user.getEmail(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getAvatarUrl(),
                user.getRole().getName(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()))
        );

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetailsCustom.getUsername(),
                null,
                userDetailsCustom.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        LoginResponse.UserLoginResponse loginResponse = buildUserLoginResponse(user);
        String accessToken = this.tokenService.createAccessToken(authentication);
        String refreshToken = this.tokenService.createRefreshToken(authentication);

        return LoginResponse.builder()
                .user(loginResponse)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    private User createUserFromGoogle(GoogleUserInfo googleUser) {
        Role role = getRoleForUser();
        User user = User.builder()
                .email(googleUser.getEmail())
                .username(googleUser.getName() != null && !googleUser.getName().isBlank()
                        ? googleUser.getName()
                        : googleUser.getEmail().split("@")[0])
                .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                .avatarUrl("avatars/avatar-default.svg")
                .role(role)
                .mustChangePassword(false)
                .build();
        User savedUser = this.userRepository.save(user);
        this.voucherService.assignWelcomeVouchers(savedUser);
        return savedUser;
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
        user.setAvatarUrl("avatars/avatar-default.svg");
        user.setRole(role);
        user.setMustChangePassword(false);

        User savedUser = this.userRepository.save(user);
        this.voucherService.assignWelcomeVouchers(savedUser);
        return this.userMapper.toResponse(savedUser);
    }

    @Override
    public void changePassword(String currentPassword, String newPassword) {
        String email = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new AppException("Unauthenticated"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new AppException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    // --- Helper methods ---

    private LoginResponse.UserLoginResponse buildUserLoginResponse(User user) {
        List<String> permissions = getPermissionStrings(user);

        return LoginResponse.UserLoginResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().getName())
                .mustChangePassword(user.isMustChangePassword())
                .permissions(permissions)
                .build();
    }

    private List<String> getPermissionStrings(User user) {
        Role role = user.getRole();
        if (SUPER_ADMIN_ROLE.equals(role.getName())) {
            // SUPER_ADMIN gets ALL permissions
            return permissionRepository.findAll().stream()
                    .map(Permission::toPermissionString)
                    .toList();
        }
        if (role.getPermissions() == null) return List.of();
        return role.getPermissions().stream()
                .map(Permission::toPermissionString)
                .toList();
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