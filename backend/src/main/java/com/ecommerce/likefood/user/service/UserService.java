package com.ecommerce.likefood.user.service;

import com.ecommerce.likefood.common.response.PaginationResponse;
import com.ecommerce.likefood.user.dto.req.UserCreateRequest;
import com.ecommerce.likefood.user.dto.req.UserSpecRequest;
import com.ecommerce.likefood.user.dto.req.UserUpdateRequest;
import com.ecommerce.likefood.user.dto.res.UserResponse;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserResponse create( UserCreateRequest req);

    UserResponse getById(String id);

    PaginationResponse getAll(UserSpecRequest userSpecRequest, Pageable pageable);

    UserResponse update(String id, UserUpdateRequest request);
}
