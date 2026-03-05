package com.ecommerce.likefood.auth.service;

import lombok.*;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GoogleUserInfo {
    private String email;
    private String name;
    private String pictureUrl;
}
