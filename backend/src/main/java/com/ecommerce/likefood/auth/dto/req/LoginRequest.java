package com.ecommerce.likefood.auth.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.validator.constraints.Length;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Email not be blank")
    private String username;

    @NotBlank(message = "Password not be blank")
    @Length(min = 6, message = "Password at least 6 character")
    private String password;
}
