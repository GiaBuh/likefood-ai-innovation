package com.ecommerce.likefood.common.config;

import com.ecommerce.likefood.common.enums.Gender;
import com.ecommerce.likefood.user.domain.Role;
import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.user.repository.RoleRepository;
import com.ecommerce.likefood.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Role userRole = ensureRole("USER");
        Role adminRole = ensureRole("ADMIN");

        if (!userRepository.existsByEmail("admin@gmail.com")) {
            User admin = User.builder()
                    .email("admin@gmail.com")
                    .username("Admin")
                    .password(passwordEncoder.encode("123456"))
                    .avatarUrl("default-avatar.png")
                    .gender(Gender.MALE)
                    .role(adminRole)
                    .build();
            userRepository.save(admin);
            log.info("Seeded default admin account: admin@gmail.com");
        }

        log.info("Seeded roles: {}, {}", userRole.getName(), adminRole.getName());
    }

    private Role ensureRole(String roleName) {
        return roleRepository.findRoleByName(roleName)
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name(roleName)
                                .build()
                ));
    }
}
