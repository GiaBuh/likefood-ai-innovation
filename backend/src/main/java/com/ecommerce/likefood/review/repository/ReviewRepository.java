package com.ecommerce.likefood.review.repository;

import com.ecommerce.likefood.review.domain.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, String> {

    Page<Review> findByProduct_IdOrderByCreatedAtDesc(String productId, Pageable pageable);

    Page<Review> findByProduct_IdAndRatingOrderByCreatedAtDesc(String productId, Integer rating, Pageable pageable);

    @Query("SELECT r FROM Review r WHERE r.product.id = :productId AND SIZE(r.images) > 0 ORDER BY r.createdAt DESC")
    Page<Review> findByProductIdWithImages(@Param("productId") String productId, Pageable pageable);

    @Query("SELECT r FROM Review r WHERE r.product.id = :productId AND r.comment IS NOT NULL AND r.comment <> '' ORDER BY r.createdAt DESC")
    Page<Review> findByProductIdWithComments(@Param("productId") String productId, Pageable pageable);

    boolean existsByUser_IdAndProduct_IdAndOrder_Id(String userId, String productId, String orderId);

    boolean existsByUser_IdAndProduct_Id(String userId, String productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double getAverageRatingByProductId(@Param("productId") String productId);

    long countByProduct_Id(String productId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.product.id = :productId GROUP BY r.rating")
    List<Object[]> countByRatingForProduct(@Param("productId") String productId);

    // For admin: find reviews without reply
    Page<Review> findByReplyTextIsNullOrderByCreatedAtDesc(Pageable pageable);

    // All reviews for admin
    Page<Review> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
