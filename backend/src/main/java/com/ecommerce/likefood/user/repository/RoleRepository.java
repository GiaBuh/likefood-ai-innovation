package com.ecommerce.likefood.user.repository;

import com.ecommerce.likefood.user.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
public interface RoleRepository extends JpaRepository<Role, String> {

    boolean existsByName(String name);

    Optional<Role> findRoleByName(String name);
}
