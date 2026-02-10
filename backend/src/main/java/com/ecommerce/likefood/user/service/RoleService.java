package com.ecommerce.likefood.user.service;

import com.ecommerce.likefood.user.domain.Role;
import com.ecommerce.likefood.user.dto.req.RoleCreateRequest;
import com.ecommerce.likefood.user.dto.res.RoleResponse;

import java.util.List;

public interface RoleService {
    Role create(RoleCreateRequest request);

    List<RoleResponse> getAll();

    RoleResponse update(String id, RoleCreateRequest request);

    void delete(String id);
}
