package com.ecommerce.likefood.user.dto.res;

import lombok.*;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String phoneNumber;
    private String address;
    private String avatarUrl;
    private String gender;
    private Role role;

    @Setter
    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Role {
        private String name;
    }
}
