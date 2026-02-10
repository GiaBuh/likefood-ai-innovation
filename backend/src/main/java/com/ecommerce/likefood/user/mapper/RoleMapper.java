package com.ecommerce.likefood.user.mapper;

import com.ecommerce.likefood.user.domain.Role;
import com.ecommerce.likefood.user.dto.res.RoleResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    RoleResponse toResponse(Role role);
}
