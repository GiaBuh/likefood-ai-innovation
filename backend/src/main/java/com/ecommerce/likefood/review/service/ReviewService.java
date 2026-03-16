package com.ecommerce.likefood.review.service;

import com.ecommerce.likefood.review.dto.req.ReviewCreateRequest;
import com.ecommerce.likefood.review.dto.req.ReviewReplyRequest;
import com.ecommerce.likefood.review.dto.res.ReviewResponse;
import com.ecommerce.likefood.review.dto.res.ReviewStatsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewResponse createReview(ReviewCreateRequest request);
    Page<ReviewResponse> getProductReviews(String productId, Integer rating, String filter, Pageable pageable);
    ReviewStatsResponse getProductReviewStats(String productId);
    ReviewResponse replyToReview(String reviewId, ReviewReplyRequest request);
    Page<ReviewResponse> getAllReviewsForAdmin(Pageable pageable);
    boolean canUserReviewProduct(String productId);
}
