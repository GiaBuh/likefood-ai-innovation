package com.ecommerce.likefood.order.repository;

import com.ecommerce.likefood.order.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, String> {
    boolean existsByVariant_Product_Id(String productId);
    boolean existsByVariant_Id(String variantId);

    /**
     * Get sold count per variant from COMPLETED orders.
     * Returns List of Object[]{variantId (String), soldCount (Long)}.
     */
    @Query("SELECT oi.variant.id, SUM(oi.quantity) FROM OrderItem oi WHERE oi.order.status = 'COMPLETED' GROUP BY oi.variant.id")
    List<Object[]> findSoldCountByVariant();

    /**
     * Get sold count for specific variant IDs only (scoped to a page of results).
     */
    @Query("SELECT oi.variant.id, SUM(oi.quantity) FROM OrderItem oi WHERE oi.order.status = 'COMPLETED' AND oi.variant.id IN :variantIds GROUP BY oi.variant.id")
    List<Object[]> findSoldCountByVariantIds(@Param("variantIds") List<String> variantIds);

    /**
     * Get sold count for variants of a specific product.
     */
    @Query("SELECT oi.variant.id, SUM(oi.quantity) FROM OrderItem oi WHERE oi.order.status = 'COMPLETED' AND oi.variant.product.id = :productId GROUP BY oi.variant.id")
    List<Object[]> findSoldCountByProductId(String productId);

    /**
     * Get distinct category IDs from a user's COMPLETED orders (for suggestions).
     */
    @Query("SELECT DISTINCT oi.variant.product.category.id FROM OrderItem oi WHERE oi.order.user.email = :email AND oi.order.status = 'COMPLETED'")
    List<String> findCategoryIdsByUserEmail(String email);
}
