package com.ecommerce.likefood.common.config;

import com.ecommerce.likefood.common.response.RestResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Optional;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint{

    private final AuthenticationEntryPoint delegate = new BearerTokenAuthenticationEntryPoint();

    private final ObjectMapper mapper;

    public CustomAuthenticationEntryPoint(tools.jackson.databind.ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        this.delegate.commence(request, response, authException);
        response.setContentType("application/json;charset=UTF-8");

        String errorMessage = Optional.ofNullable(authException.getCause())
            .map(Throwable::getMessage)
            .orElse(authException.getMessage());

        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.UNAUTHORIZED.value())
                .error(errorMessage)
                .message("Invalid token (expired, incorrect format, or JWT not passed in header)...")
                .build();

        mapper.writeValue(response.getWriter(), res);
    }
    
}
