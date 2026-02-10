package com.ecommerce.likefood.user.dto.req;

import com.ecommerce.likefood.common.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.hibernate.validator.constraints.Length;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserCreateRequest {
    @NotBlank(message = "Email must not be blank")
    @Email(message = "Vui lòng nhập đúng định dạng email...")
    private String email;

    @NotBlank(message = "Username must not be blank")
    @Length(min = 3, message = "Độ dài của tên ít nhất 3 kí tự...")
    private String username;

    @NotBlank(message = "Password must not be blank")
    @Length(min = 6, message = "Độ dài mât khẩu ít nhất 6 kí tự...")
    private String password;

    @NotBlank(message = "Phone number must not be blank")
    @Pattern(
            regexp = "^(\\+1\\s?)?(\\(?\\d{3}\\)?[-\\s]?\\d{3}[-\\s]?\\d{4})$",
            message = "Invalid US phone number format"
    )
    private String phoneNumber;

    @NotBlank(message = "Address must not be blank")
    private String address;

    @NotNull(message = "Gender must not be blank")
    private Gender gender;

    private Role role;

    @Getter
    @Setter
    public static class Role {
        @NotBlank(message = "Role id must not be blank")
        private String id;
    }
}
