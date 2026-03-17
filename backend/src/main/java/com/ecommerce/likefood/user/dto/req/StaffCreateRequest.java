package com.ecommerce.likefood.user.dto.req;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.validator.constraints.Length;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StaffCreateRequest {
    @NotBlank(message = "Email must not be blank")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Username must not be blank")
    @Length(min = 3, message = "Username must be at least 3 characters")
    private String username;

    @NotBlank(message = "Password must not be blank")
    @Length(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Role ID must not be blank")
    private String roleId;
}
