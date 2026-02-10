package com.ecommerce.likefood.common.exception;

import com.ecommerce.likefood.common.response.RestResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestCookieException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class HandleGlobalException {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        RestResponse<?> response = RestResponse.builder()
                .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("INTERNAL_SERVER_ERROR")
                .message(e.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<?> handleAppException(AppException e) {
        RestResponse<?> response = RestResponse.builder()
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .error("BAD_REQUEST")
                .message(e.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationException(MethodArgumentNotValidException ex) {
        final List<FieldError> fieldErrors = ex.getFieldErrors();
        List<String> errors = fieldErrors.stream().map(FieldError::getDefaultMessage).toList();

        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .error("INVALID_REQUEST_CONTENT")
                .message(errors.size() > 1 ? errors : errors.getFirst())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentialsException(BadCredentialsException ex) {
        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.UNAUTHORIZED.value())
                .error("BAD_CREDENTIALS")
                .message("Username or password is incorrect")
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(res);
    }

    @ExceptionHandler({JwtException.class, MissingRequestCookieException.class})
    public ResponseEntity<?> handleUnauthorizedException(Exception ex) {
        RestResponse<Object> res = RestResponse.builder()
                .statusCode(HttpStatus.UNAUTHORIZED.value())
                .error("UNAUTHORIZED")
                .message(ex.getMessage())
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(res);
    }
}
