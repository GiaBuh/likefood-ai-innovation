package com.ecommerce.likefood.user.service.impl;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.user.domain.Permission;
import com.ecommerce.likefood.user.domain.Role;
import com.ecommerce.likefood.user.dto.req.RoleCreateRequest;
import com.ecommerce.likefood.user.dto.res.RoleResponse;
import com.ecommerce.likefood.user.repository.PermissionRepository;
import com.ecommerce.likefood.user.repository.RoleRepository;
import com.ecommerce.likefood.user.repository.UserRepository;
import com.ecommerce.likefood.user.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;

    private static final String SUPER_ADMIN_ROLE = "SUPER_ADMIN";

    @Override
    public Role create(RoleCreateRequest request) {
        String roleName = request.getName().toUpperCase();
        validateExistsByName(roleName);

        Role role = new Role();
        role.setName(roleName);
        role.setPermissions(resolvePermissions(request.getPermissionIds()));
        return this.roleRepository.save(role);
    }

    @Override
    public List<RoleResponse> getAll() {
        List<Role> roles = this.roleRepository.findAll();
        return roles.stream().map(this::toRoleResponse).toList();
    }

    @Override
    public RoleResponse update(String id, RoleCreateRequest request) {
        Role roleDB = this.getById(id);
        validateNotSuperAdmin(roleDB);

        roleDB.setName(request.getName().toUpperCase());
        roleDB.setPermissions(resolvePermissions(request.getPermissionIds()));
        return this.toRoleResponse(this.roleRepository.save(roleDB));
    }

    @Override
    public void delete(String id) {
        Role role = getById(id);
        validateNotSuperAdmin(role);

        if (this.userRepository.existsByRole_Id(id)) {
            throw new AppException("Cannot delete role because it is assigned to users");
        }
        this.roleRepository.deleteById(id);
    }

    // --- helpers ---

    private void validateExistsByName(String name) {
        if (this.roleRepository.existsByName(name)) {
            throw new AppException("Role with name " + name + " already exists");
        }
    }

    private void validateNotSuperAdmin(Role role) {
        if (SUPER_ADMIN_ROLE.equals(role.getName())) {
            throw new AppException("Cannot modify SUPER_ADMIN role");
        }
    }

    private Role getById(String id) {
        return this.roleRepository.findById(id)
                .orElseThrow(() -> new AppException("Role with id " + id + " not found"));
    }

    private List<Permission> resolvePermissions(List<String> permissionIds) {
        if (permissionIds == null || permissionIds.isEmpty()) {
            return new ArrayList<>();
        }
        List<Permission> permissions = permissionRepository.findAllByIdIn(permissionIds);
        if (permissions.size() != permissionIds.size()) {
            throw new AppException("Some permission IDs are invalid");
        }
        return permissions;
    }

    private RoleResponse toRoleResponse(Role role) {
        List<RoleResponse.PermissionResponse> permResponses = role.getPermissions() != null
            ? role.getPermissions().stream().map(p -> RoleResponse.PermissionResponse.builder()
                .id(p.getId())
                .resource(p.getResource().name())
                .action(p.getAction().name())
                .build()).toList()
            : List.of();

        long userCount = userRepository.countByRole_Id(role.getId());

        return RoleResponse.builder()
            .id(role.getId())
            .name(role.getName())
            .permissions(permResponses)
            .userCount(userCount)
            .build();
    }
}
