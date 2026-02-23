package com.ecommerce.likefood.product.repository;

import com.ecommerce.likefood.product.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, String> {
    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, String id);

    Optional<Category> findByName(String name);
}
