package com.ecommerce.likefood.user.dto.req;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ProfileUpdateRequest {
    @Size(min = 3, max = 100, message = "Username must be 3-100 characters")
    private String username;

    @Size(max = 20, message = "Phone number too long")
    private String phoneNumber;

    @Size(max = 500, message = "Address too long")
    private String address;

    @Size(max = 500, message = "Avatar URL too long")
    private String avatarUrl;
}
