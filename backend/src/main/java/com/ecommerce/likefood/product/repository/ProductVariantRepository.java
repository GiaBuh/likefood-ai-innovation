package com.ecommerce.likefood.product.repository;

import com.ecommerce.likefood.product.domain.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {
    boolean existsBySku(String sku);
    boolean existsBySkuAndProduct_IdNot(String sku, String productId);
}
