package com.ecommerce.likefood.user.repository;

import com.ecommerce.likefood.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor<User> {
    boolean existsByRole_Id(String roleId);

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);
}
