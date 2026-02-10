package com.ecommerce.likefood.auth.dto.req;

import com.ecommerce.likefood.auth.validation.PasswordValid;
import com.ecommerce.likefood.common.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.hibernate.validator.constraints.Length;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@PasswordValid
public class RegisterRequest {

    @NotBlank(message = "Username must not be blank.")
    @Length(min = 3, message = "Username must be at least 3 characters long.")
    private String username;

    @NotBlank(message = "Email must not be blank.")
    @Email(message = "Please enter a valid email address.")
    private String email;

    @NotBlank(message = "Phone number must not be blank.")
    @Pattern(
            regexp = "^(0[35789][0-9]{8})$",
            message = "Please enter a valid phone number."
    )
    private String phoneNumber;
    @NotBlank(message = "Address must not be blank.")
    private String address;
    @NotNull(message = "Gender must not be null.")
    private Gender gender;

    @NotBlank(message = "Password must not be blank.")
    private String password;

    @NotBlank(message = "Confirm password must not be blank.")
    private String confirmPassword;

}

