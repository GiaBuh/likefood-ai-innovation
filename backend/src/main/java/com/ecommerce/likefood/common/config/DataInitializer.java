package com.ecommerce.likefood.common.config;

import com.ecommerce.likefood.common.enums.Gender;
import com.ecommerce.likefood.user.domain.*;
import com.ecommerce.likefood.user.repository.PermissionRepository;
import com.ecommerce.likefood.user.repository.RoleRepository;
import com.ecommerce.likefood.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionRepository permissionRepository;

    // Permission definitions: resource -> actions
    private static final Map<ResourceType, List<ActionType>> PERMISSION_DEFINITIONS = Map.of(
        ResourceType.DASHBOARD, List.of(ActionType.VIEW),
        ResourceType.PRODUCTS, List.of(ActionType.VIEW, ActionType.CREATE, ActionType.EDIT, ActionType.DELETE),
        ResourceType.CATEGORIES, List.of(ActionType.VIEW, ActionType.CREATE, ActionType.EDIT, ActionType.DELETE),
        ResourceType.ORDERS, List.of(ActionType.VIEW, ActionType.EDIT),
        ResourceType.CUSTOMERS, List.of(ActionType.VIEW, ActionType.EDIT),
        ResourceType.VOUCHERS, List.of(ActionType.VIEW, ActionType.CREATE, ActionType.EDIT, ActionType.DELETE),
        ResourceType.CHAT, List.of(ActionType.VIEW),
        ResourceType.STAFF, List.of(ActionType.VIEW, ActionType.CREATE, ActionType.EDIT, ActionType.DELETE)
    );

    @Override
    public void run(String... args) {
        // 1. Seed permissions
        List<Permission> allPermissions = seedPermissions();

        // 2. Seed roles
        Role userRole = ensureRole("USER");
        Role adminRole = ensureRole("ADMIN");
        Role superAdminRole = ensureSuperAdminRole(allPermissions);

        // 3. Seed default accounts
        seedDefaultAdmin(superAdminRole);
        seedDefaultUser(userRole);

        log.info("Seeded roles: {}, {}, {}", userRole.getName(), adminRole.getName(), superAdminRole.getName());
        log.info("Seeded {} permissions", allPermissions.size());
    }

    private List<Permission> seedPermissions() {
        List<Permission> allPermissions = new ArrayList<>();
        for (Map.Entry<ResourceType, List<ActionType>> entry : PERMISSION_DEFINITIONS.entrySet()) {
            ResourceType resource = entry.getKey();
            for (ActionType action : entry.getValue()) {
                Permission permission = permissionRepository.findByResourceAndAction(resource, action)
                    .orElseGet(() -> {
                        Permission p = Permission.builder()
                            .resource(resource)
                            .action(action)
                            .build();
                        log.info("Seeding permission: {}:{}", resource, action);
                        return permissionRepository.save(p);
                    });
                allPermissions.add(permission);
            }
        }
        return allPermissions;
    }

    private Role ensureSuperAdminRole(List<Permission> allPermissions) {
        Role superAdmin = roleRepository.findRoleByName("SUPER_ADMIN")
            .orElseGet(() -> roleRepository.save(
                Role.builder()
                    .name("SUPER_ADMIN")
                    .permissions(new ArrayList<>())
                    .build()
            ));

        // Always sync all permissions to SUPER_ADMIN
        superAdmin.setPermissions(new ArrayList<>(allPermissions));
        return roleRepository.save(superAdmin);
    }

    private Role ensureRole(String roleName) {
        return roleRepository.findRoleByName(roleName)
            .orElseGet(() -> roleRepository.save(
                Role.builder()
                    .name(roleName)
                    .permissions(new ArrayList<>())
                    .build()
            ));
    }

    private void seedDefaultAdmin(Role superAdminRole) {
        var existing = userRepository.findByEmail("admin@gmail.com");
        if (existing.isPresent()) {
            User admin = existing.get();
            if (admin.getRole() == null || !admin.getRole().getName().equals("SUPER_ADMIN")) {
                admin.setRole(superAdminRole);
                userRepository.save(admin);
                log.info("Updated admin@gmail.com role to SUPER_ADMIN");
            }
        } else {
            User admin = User.builder()
                .email("admin@gmail.com")
                .username("Admin")
                .password(passwordEncoder.encode("123456"))
                .avatarUrl("avatars/avatar-default.svg")
                .gender(Gender.MALE)
                .role(superAdminRole)
                .mustChangePassword(false)
                .build();
            userRepository.save(admin);
            log.info("Seeded default admin account: admin@gmail.com (SUPER_ADMIN)");
        }
    }

    private void seedDefaultUser(Role userRole) {
        if (!userRepository.existsByEmail("user@gmail.com")) {
            User user = User.builder()
                .email("user@gmail.com")
                .username("User")
                .password(passwordEncoder.encode("123456"))
                .avatarUrl("avatars/avatar-default.svg")
                .gender(Gender.MALE)
                .role(userRole)
                .mustChangePassword(false)
                .build();
            userRepository.save(user);
            log.info("Seeded default user account: user@gmail.com");
        }
    }
}
