package com.ecommerce.likefood.user.repository;

import com.ecommerce.likefood.user.domain.ActionType;
import com.ecommerce.likefood.user.domain.Permission;
import com.ecommerce.likefood.user.domain.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {

    Optional<Permission> findByResourceAndAction(ResourceType resource, ActionType action);

    boolean existsByResourceAndAction(ResourceType resource, ActionType action);

    List<Permission> findAllByIdIn(List<String> ids);
}
