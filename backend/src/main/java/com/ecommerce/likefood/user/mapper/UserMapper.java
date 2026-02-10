package com.ecommerce.likefood.user.mapper;

import com.ecommerce.likefood.auth.dto.req.RegisterRequest;
import com.ecommerce.likefood.auth.dto.res.LoginResponse;
import com.ecommerce.likefood.common.security.UserDetailsCustom;
import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.user.dto.req.UserCreateRequest;
import com.ecommerce.likefood.user.dto.req.UserUpdateRequest;
import com.ecommerce.likefood.user.dto.res.UserResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreateRequest req);
    User toUser(RegisterRequest req);
    UserResponse toResponse(User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUser(UserUpdateRequest req, @MappingTarget User user);

    @Mapping(source = "displayName", target = "username")
    LoginResponse.UserLoginResponse toUserLoginResponse(UserDetailsCustom userDetailsCustom);
}
