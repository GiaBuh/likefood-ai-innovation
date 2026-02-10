package com.ecommerce.likefood.user.domain;

import com.ecommerce.likefood.common.enums.Gender;
import com.ecommerce.likefood.common.utils.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true)
    private String email;
    private String username;
    private String password;
    private String phoneNumber;
    private String avatarUrl;
    private String address;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;
}
