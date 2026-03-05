package com.ecommerce.likefood.auth.dto.res;

import lombok.*;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GoogleAuthUrlResponse {
    private String url;
}
