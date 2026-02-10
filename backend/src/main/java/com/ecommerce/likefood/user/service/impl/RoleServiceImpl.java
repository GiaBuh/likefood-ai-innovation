package com.ecommerce.likefood.user.service.impl;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.user.domain.Role;
import com.ecommerce.likefood.user.dto.req.RoleCreateRequest;
import com.ecommerce.likefood.user.dto.res.RoleResponse;
import com.ecommerce.likefood.user.mapper.RoleMapper;
import com.ecommerce.likefood.user.repository.RoleRepository;
import com.ecommerce.likefood.user.repository.UserRepository;
import com.ecommerce.likefood.user.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;
    private final UserRepository userRepository;

    @Override
    public Role create(RoleCreateRequest request) {
        String roleName = request.getName().toUpperCase();
        validateExistsByName(roleName);

        Role role = new Role();
        role.setName(roleName);
        return this.roleRepository.save(role);
    }

    private void validateExistsByName(String name) {
        if(this.roleRepository.existsByName(name)){
            throw new AppException("Role with name " + name + " already exists");
        }
    }

    private Role getById(String id) {
        return this.roleRepository.findById(id)
                .orElseThrow(() -> new AppException("Role with id " + id + " not found"));
    }

    @Override
    public List<RoleResponse> getAll() {
        List<Role> roles = this.roleRepository.findAll();
        return roles.stream().map(roleMapper::toResponse).toList();
    }

    @Override
    public RoleResponse update(String id, RoleCreateRequest request) {
        Role roleDB = this.getById(id);
        roleDB.setName(request.getName());
        return this.roleMapper.toResponse(this.roleRepository.save(roleDB));
    }

    @Override
    public void delete(String id) {
        if(this.userRepository.existsByRole_Id(id)){
            throw new AppException("Cannot delete role because it is assigned to users");
        }
        getById(id);
        this.roleRepository.deleteById(id);
    }
}
