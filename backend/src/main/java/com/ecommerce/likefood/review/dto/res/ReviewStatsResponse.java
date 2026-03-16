package com.ecommerce.likefood.review.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@Builder
public class ReviewStatsResponse {
    private String productId;
    private double averageRating;
    private long totalReviews;
    private Map<Integer, Long> ratingCounts; // e.g., {5: 120, 4: 30, 3: 5, 2: 1, 1: 2}
    private long reviewsWithComments;
    private long reviewsWithImages;
}
