package com.ecommerce.likefood.user.dto.req;

import com.ecommerce.likefood.common.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UserUpdateRequest {
    @NotBlank(message = "Username must not be blank")
    @Length(min = 3, message = "Length fullName at least 3 character")
    private String username;

    @NotBlank(message = "Phone number must not be blank")
    @Pattern(
            regexp = "^(\\+1\\s?)?(\\(?\\d{3}\\)?[-\\s]?\\d{3}[-\\s]?\\d{4})$",
            message = "Invalid US phone number format"
    )
    private String phoneNumber;
    @NotNull(message = "Gender must not be blank")
    private Gender gender;
    @NotBlank(message = "Address must not be blank")
    private String address;

    private Role role;

    @Getter
    @Setter
    public static class Role {
        private String id;
    }
}
