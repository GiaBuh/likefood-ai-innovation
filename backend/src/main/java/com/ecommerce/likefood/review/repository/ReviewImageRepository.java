package com.ecommerce.likefood.review.repository;

import com.ecommerce.likefood.review.domain.ReviewImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewImageRepository extends JpaRepository<ReviewImage, String> {
}
