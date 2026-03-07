package com.ecommerce.likefood.product.repository;

import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

    boolean existsByCategory_Id(String categoryId);

    @EntityGraph(attributePaths = {"variants", "category"})
    List<Product> findByStatusOrderByCreatedAtDesc(ProductStatus status, PageRequest pageRequest);

    default List<Product> findActiveProducts(int limit) {
        return findByStatusOrderByCreatedAtDesc(ProductStatus.ACTIVE, PageRequest.of(0, limit));
    }
}
