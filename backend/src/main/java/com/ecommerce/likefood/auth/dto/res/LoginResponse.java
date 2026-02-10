package com.ecommerce.likefood.auth.dto.res;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private UserLoginResponse user;
    private String accessToken;
    @JsonIgnore
    private String refreshToken;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class UserLoginResponse {
        private String id;
        private String username;
        private String email;
        private String phoneNumber;
        private String address;
        private String avatarUrl;
        private String role;
    }


}
