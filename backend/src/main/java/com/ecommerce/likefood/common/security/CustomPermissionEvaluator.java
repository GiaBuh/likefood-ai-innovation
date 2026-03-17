package com.ecommerce.likefood.common.security;

import com.ecommerce.likefood.user.domain.Permission;
import com.ecommerce.likefood.user.domain.Role;
import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private final UserRepository userRepository;

    private static final String SUPER_ADMIN_ROLE = "SUPER_ADMIN";

    /**
     * Called by @PreAuthorize("hasPermission(null, 'PRODUCTS', 'CREATE')")
     * targetType = resource (e.g. "PRODUCTS")
     * permission = action (e.g. "CREATE")
     */
    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        // Not used in our system
        return false;
    }

    /**
     * Called by @PreAuthorize("hasPermission(null, 'PRODUCTS', 'CREATE')")
     */
    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;

        Role role = user.getRole();
        if (role == null) return false;

        // SUPER_ADMIN bypass — always has all permissions
        if (SUPER_ADMIN_ROLE.equals(role.getName())) {
            return true;
        }

        // Check if role has the required permission
        String requiredResource = targetType;
        String requiredAction = permission.toString();

        if (role.getPermissions() == null) return false;

        return role.getPermissions().stream()
                .anyMatch(p ->
                    p.getResource().name().equals(requiredResource) &&
                    p.getAction().name().equals(requiredAction)
                );
    }
}
