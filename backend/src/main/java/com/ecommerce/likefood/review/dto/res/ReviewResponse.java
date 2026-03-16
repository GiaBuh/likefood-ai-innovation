package com.ecommerce.likefood.review.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
public class ReviewResponse {
    private String id;
    private String productId;
    private String productName;
    private String userId;
    private String username;
    private String userAvatarUrl;
    private String orderId;
    private Integer rating;
    private String comment;
    private Instant createdAt;

    @Builder.Default
    private List<String> imageKeys = new ArrayList<>();

    // Shop reply
    private String replyText;
    private Instant repliedAt;
}
