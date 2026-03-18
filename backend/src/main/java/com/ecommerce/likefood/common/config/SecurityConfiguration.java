package com.ecommerce.likefood.common.config;

import com.ecommerce.likefood.common.security.CustomPermissionEvaluator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity(securedEnabled = true, prePostEnabled = true)
public class SecurityConfiguration {

    @Value("${likefood.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler(
            CustomPermissionEvaluator permissionEvaluator) {
        DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
        handler.setPermissionEvaluator(permissionEvaluator);
        return handler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
            CustomAuthenticationEntryPoint customAuthenticationEntryPoint,
            JwtAuthenticationConverter jwtAuthenticationConverter) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(
                        authz -> authz
                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                .requestMatchers("/auth/**").permitAll()
                                .requestMatchers("/ws/**").permitAll()
                                .requestMatchers("/ai/**").permitAll()
                                .requestMatchers(HttpMethod.GET, "/products/**", "/categories/**",
                                        "/storage/public-url", "/vouchers/active",
                                        "/flash-sale/active", "/flash-sale/today",
                                        "/flash-sale/server-time")
                                .permitAll()
                                .requestMatchers(HttpMethod.POST, "/flash-sale/purchase/**").permitAll()
                                // Storage
                                .requestMatchers(HttpMethod.POST, "/storage/upload-avatar").authenticated()
                                .requestMatchers(HttpMethod.POST, "/storage/upload-image",
                                        "/storage/delete-image")
                                .authenticated()
                                // Admin endpoints — method-level @PreAuthorize handles permission checks
                                .requestMatchers(HttpMethod.POST, "/products", "/products/import",
                                        "/categories")
                                .authenticated()
                                .requestMatchers(HttpMethod.PUT, "/products/**", "/categories/**")
                                .authenticated()
                                .requestMatchers(HttpMethod.DELETE, "/products/**", "/categories/**")
                                .authenticated()
                                .requestMatchers(HttpMethod.GET, "/orders").authenticated()
                                .requestMatchers(HttpMethod.PATCH, "/orders/*/status").authenticated()
                                .requestMatchers(HttpMethod.PUT, "/users/me").authenticated()
                                // Permission & Role management (admin only via @PreAuthorize)
                                .requestMatchers("/permissions/**").authenticated()
                                .requestMatchers("/users/**", "/roles/**").authenticated()
                                // Voucher management
                                .requestMatchers(HttpMethod.POST, "/vouchers").authenticated()
                                .requestMatchers(HttpMethod.PUT, "/vouchers/**").authenticated()
                                .requestMatchers(HttpMethod.DELETE, "/vouchers/**").authenticated()
                                // Flash Sale management
                                .requestMatchers(HttpMethod.GET, "/flash-sale", "/flash-sale/*").authenticated()
                                .requestMatchers(HttpMethod.POST, "/flash-sale").authenticated()
                                .requestMatchers(HttpMethod.PUT, "/flash-sale/**").authenticated()
                                .requestMatchers(HttpMethod.DELETE, "/flash-sale/**").authenticated()
                                // User-specific endpoints
                                .requestMatchers("/carts/me/**", "/orders/me/**").authenticated()
                                .requestMatchers("/chat/me/**").authenticated()
                                .requestMatchers("/chat/admin/**").authenticated()
                                .anyRequest().authenticated())
                .oauth2ResourceServer((oauth2) -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
                        .authenticationEntryPoint(customAuthenticationEntryPoint))
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}