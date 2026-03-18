package com.ecommerce.likefood.user.dto.res;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RoleResponse {
    private String id;
    private String name;
    private List<PermissionResponse> permissions;
    private long userCount;

    @Getter
    @Setter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PermissionResponse {
        private String id;
        private String resource;
        private String action;
    }
}
