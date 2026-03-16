package com.ecommerce.likefood.review.service.impl;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.common.security.SecurityUtils;
import com.ecommerce.likefood.order.domain.Order;
import com.ecommerce.likefood.order.domain.OrderStatus;
import com.ecommerce.likefood.order.repository.OrderRepository;
import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.repository.ProductRepository;
import com.ecommerce.likefood.review.domain.Review;
import com.ecommerce.likefood.review.domain.ReviewImage;
import com.ecommerce.likefood.review.dto.req.ReviewCreateRequest;
import com.ecommerce.likefood.review.dto.req.ReviewReplyRequest;
import com.ecommerce.likefood.review.dto.res.ReviewResponse;
import com.ecommerce.likefood.review.dto.res.ReviewStatsResponse;
import com.ecommerce.likefood.review.repository.ReviewRepository;
import com.ecommerce.likefood.review.service.ReviewService;
import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReviewResponse createReview(ReviewCreateRequest request) {
        User user = getCurrentUser();

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException("Product not found"));

        // Find or auto-detect the eligible order
        Order order;
        if (request.getOrderId() != null && !request.getOrderId().isBlank()) {
            order = orderRepository.findByIdAndUser_Id(request.getOrderId(), user.getId())
                    .orElseThrow(() -> new AppException("Order not found"));
        } else {
            // Auto-detect: find a COMPLETED order that contains this product and hasn't been reviewed
            order = orderRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                    .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                    .filter(o -> o.getItems().stream()
                            .anyMatch(item -> item.getVariant() != null
                                    && item.getVariant().getProduct().getId().equals(product.getId())))
                    .filter(o -> !reviewRepository.existsByUser_IdAndProduct_IdAndOrder_Id(
                            user.getId(), product.getId(), o.getId()))
                    .findFirst()
                    .orElseThrow(() -> new AppException("No eligible order found for this product"));
        }

        // Verify order is COMPLETED
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new AppException("You can only review products from completed orders");
        }

        // Verify that order contains this product
        boolean orderContainsProduct = order.getItems().stream()
                .anyMatch(item -> item.getVariant() != null
                        && item.getVariant().getProduct().getId().equals(product.getId()));

        if (!orderContainsProduct) {
            throw new AppException("This order does not contain this product");
        }

        // Verify user hasn't already reviewed this product for this order
        if (reviewRepository.existsByUser_IdAndProduct_IdAndOrder_Id(user.getId(), product.getId(), order.getId())) {
            throw new AppException("You have already reviewed this product for this order");
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .order(order)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        // Add images
        if (request.getImageKeys() != null && !request.getImageKeys().isEmpty()) {
            List<ReviewImage> images = request.getImageKeys().stream()
                    .limit(3) // Max 3 images
                    .map(key -> ReviewImage.builder()
                            .imageKey(key)
                            .review(review)
                            .build())
                    .toList();
            review.setImages(images);
        }

        Review savedReview = reviewRepository.save(review);
        log.info("Review created for product {} by user {}", product.getId(), user.getEmail());

        return toResponse(savedReview);
    }

    @Override
    public Page<ReviewResponse> getProductReviews(String productId, Integer rating, String filter, Pageable pageable) {
        Page<Review> reviews;

        if (rating != null && rating >= 1 && rating <= 5) {
            reviews = reviewRepository.findByProduct_IdAndRatingOrderByCreatedAtDesc(productId, rating, pageable);
        } else if ("hasMedia".equals(filter)) {
            reviews = reviewRepository.findByProductIdWithImages(productId, pageable);
        } else if ("hasComment".equals(filter)) {
            reviews = reviewRepository.findByProductIdWithComments(productId, pageable);
        } else {
            reviews = reviewRepository.findByProduct_IdOrderByCreatedAtDesc(productId, pageable);
        }

        return reviews.map(this::toResponse);
    }

    @Override
    public ReviewStatsResponse getProductReviewStats(String productId) {
        Double avgRating = reviewRepository.getAverageRatingByProductId(productId);
        long totalReviews = reviewRepository.countByProduct_Id(productId);
        List<Object[]> ratingCountsRaw = reviewRepository.countByRatingForProduct(productId);

        Map<Integer, Long> ratingCounts = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingCounts.put(i, 0L);
        }
        long withComments = 0;
        long withImages = 0;

        for (Object[] row : ratingCountsRaw) {
            Integer starRating = (Integer) row[0];
            Long count = (Long) row[1];
            ratingCounts.put(starRating, count);
        }

        // Count reviews with comments and with images
        Page<Review> commentsPage = reviewRepository.findByProductIdWithComments(productId, Pageable.ofSize(1));
        Page<Review> imagesPage = reviewRepository.findByProductIdWithImages(productId, Pageable.ofSize(1));
        withComments = commentsPage.getTotalElements();
        withImages = imagesPage.getTotalElements();

        return ReviewStatsResponse.builder()
                .productId(productId)
                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                .totalReviews(totalReviews)
                .ratingCounts(ratingCounts)
                .reviewsWithComments(withComments)
                .reviewsWithImages(withImages)
                .build();
    }

    @Override
    @Transactional
    public ReviewResponse replyToReview(String reviewId, ReviewReplyRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException("Review not found"));

        review.setReplyText(request.getReplyText());
        review.setRepliedAt(Instant.now());
        Review saved = reviewRepository.save(review);
        log.info("Admin replied to review {}", reviewId);
        return toResponse(saved);
    }

    @Override
    public Page<ReviewResponse> getAllReviewsForAdmin(Pageable pageable) {
        return reviewRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse);
    }

    @Override
    public boolean canUserReviewProduct(String productId) {
        try {
            User user = getCurrentUser();
            // Check if user has any COMPLETED order containing this product
            List<Order> completedOrders = orderRepository.findByUser_IdOrderByCreatedAtDesc(user.getId())
                    .stream()
                    .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                    .filter(o -> o.getItems().stream()
                            .anyMatch(item -> item.getVariant() != null
                                    && item.getVariant().getProduct().getId().equals(productId)))
                    .toList();

            if (completedOrders.isEmpty()) return false;

            // Check if user already reviewed for ALL completed orders
            boolean allReviewed = completedOrders.stream()
                    .allMatch(order -> reviewRepository.existsByUser_IdAndProduct_IdAndOrder_Id(
                            user.getId(), productId, order.getId()));

            return !allReviewed;
        } catch (Exception e) {
            return false;
        }
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .productName(review.getProduct().getName())
                .userId(review.getUser().getId())
                .username(review.getUser().getUsername() != null ? review.getUser().getUsername() : review.getUser().getEmail())
                .userAvatarUrl(review.getUser().getAvatarUrl())
                .orderId(review.getOrder().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .imageKeys(review.getImages().stream()
                        .map(ReviewImage::getImageKey)
                        .toList())
                .replyText(review.getReplyText())
                .repliedAt(review.getRepliedAt())
                .build();
    }

    private User getCurrentUser() {
        String currentEmail = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new AppException("Unauthenticated"));
        return userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException("User not found"));
    }
}
