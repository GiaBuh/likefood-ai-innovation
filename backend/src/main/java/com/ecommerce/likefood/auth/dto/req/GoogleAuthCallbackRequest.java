package com.ecommerce.likefood.auth.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GoogleAuthCallbackRequest {
    @NotBlank(message = "Authorization code is required")
    private String code;
}
