package com.ecommerce.likefood.review.controller;

import com.ecommerce.likefood.common.utils.ApiMessage;
import com.ecommerce.likefood.review.dto.req.ReviewCreateRequest;
import com.ecommerce.likefood.review.dto.req.ReviewReplyRequest;
import com.ecommerce.likefood.review.dto.res.ReviewResponse;
import com.ecommerce.likefood.review.dto.res.ReviewStatsResponse;
import com.ecommerce.likefood.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * Submit a product review (only for authenticated users with COMPLETED orders).
     */
    @PostMapping("/reviews")
    @PreAuthorize("isAuthenticated()")
    @ApiMessage("Create review")
    public ResponseEntity<ReviewResponse> createReview(@RequestBody @Valid ReviewCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.createReview(request));
    }

    /**
     * Get paginated reviews for a product, optionally filtered by rating or media presence.
     */
    @GetMapping("/products/{productId}/reviews")
    @ApiMessage("Get product reviews")
    public ResponseEntity<Page<ReviewResponse>> getProductReviews(
            @PathVariable String productId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String filter,
            Pageable pageable
    ) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId, rating, filter, pageable));
    }

    /**
     * Get review statistics (average rating, counts per star) for a product.
     */
    @GetMapping("/products/{productId}/reviews/stats")
    @ApiMessage("Get product review stats")
    public ResponseEntity<ReviewStatsResponse> getProductReviewStats(@PathVariable String productId) {
        return ResponseEntity.ok(reviewService.getProductReviewStats(productId));
    }

    /**
     * Check if the current user can review a specific product.
     */
    @GetMapping("/products/{productId}/reviews/can-review")
    @PreAuthorize("isAuthenticated()")
    @ApiMessage("Check if user can review")
    public ResponseEntity<Map<String, Boolean>> canReview(@PathVariable String productId) {
        boolean canReview = reviewService.canUserReviewProduct(productId);
        return ResponseEntity.ok(Map.of("canReview", canReview));
    }

    /**
     * Admin: Reply to a review.
     */
    @PostMapping("/admin/reviews/{reviewId}/reply")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Reply to review")
    public ResponseEntity<ReviewResponse> replyToReview(
            @PathVariable String reviewId,
            @RequestBody @Valid ReviewReplyRequest request
    ) {
        return ResponseEntity.ok(reviewService.replyToReview(reviewId, request));
    }

    /**
     * Admin: Get all reviews.
     */
    @GetMapping("/admin/reviews")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Get all reviews for admin")
    public ResponseEntity<Page<ReviewResponse>> getAllReviews(Pageable pageable) {
        return ResponseEntity.ok(reviewService.getAllReviewsForAdmin(pageable));
    }
}
