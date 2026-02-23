package com.ecommerce.likefood.user.service.impl;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.common.response.PaginationResponse;
import com.ecommerce.likefood.common.specification.GenericSpecification;
import com.ecommerce.likefood.user.domain.Role;
import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.common.security.SecurityUtils;
import com.ecommerce.likefood.user.dto.req.ProfileUpdateRequest;
import com.ecommerce.likefood.user.dto.req.UserCreateRequest;
import com.ecommerce.likefood.user.dto.req.UserSpecRequest;
import com.ecommerce.likefood.user.dto.req.UserUpdateRequest;
import com.ecommerce.likefood.user.dto.res.UserResponse;
import com.ecommerce.likefood.user.mapper.UserMapper;
import com.ecommerce.likefood.user.repository.RoleRepository;
import com.ecommerce.likefood.user.repository.UserRepository;
import com.ecommerce.likefood.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private  final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse create(UserCreateRequest req) {
        validationExistsByEmail(req.getEmail());

        Role role = this.findRoleById(req.getRole().getId());

        User user = this.userMapper.toUser(req);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setAvatarUrl("default-avatar.png");


        return this.userMapper.toResponse(this.userRepository.save(user));
    }

    private Role findRoleById(String id) {
        return this.roleRepository.findById(id)
                .orElseThrow(() -> new AppException("Role not found"));
    }

    private void validationExistsByEmail(String email) {
        if(this.userRepository.existsByEmail(email)) {
            throw new AppException("Email already exists");
        }
    }

    private User findUserById(String id) {
        return this.userRepository.findById(id)
                .orElseThrow(() -> new AppException("User not found"));
    }

    @Override
    public UserResponse getById(String id) {
        User user = this.findUserById(id);
        return this.userMapper.toResponse(user);
    }

    @Override
    public PaginationResponse getAll(UserSpecRequest userSpecRequest, Pageable pageable) {
        Specification<User> spec = GenericSpecification.filter(userSpecRequest);
        Page<User> page = this.userRepository.findAll(spec, pageable);

        PaginationResponse.Meta meta = PaginationResponse.Meta.builder()
                .page(page.getNumber() + 1)
                .pageSize(page.getSize())
                .totalPages(page.getTotalPages())
                .total(page.getTotalElements())
                .build();

        List<UserResponse> result = page.getContent().stream().map(userMapper::toResponse).toList();


        return PaginationResponse.builder()
                .meta(meta)
                .result(result)
                .build();
    }

    @Override
    public UserResponse update(String id, UserUpdateRequest request) {
        User userDB = this.findUserById(id);

        Role role  = this.findRoleById(request.getRole().getId());

        this.userMapper.updateUser(request, userDB);
        userDB.setRole(role);

        return this.userMapper.toResponse(this.userRepository.save(userDB));
    }

    @Override
    public UserResponse updateMyProfile(ProfileUpdateRequest request) {
        String email = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new AppException("Unauthenticated"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found"));
        userMapper.updateProfile(request, user);
        return userMapper.toResponse(userRepository.save(user));
    }
}
