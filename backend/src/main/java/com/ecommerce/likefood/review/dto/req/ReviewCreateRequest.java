package com.ecommerce.likefood.review.dto.req;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ReviewCreateRequest {
    @NotBlank
    private String productId;

    private String orderId; // optional, auto-detected if blank

    @NotNull
    @Min(1)
    @Max(5)
    private Integer rating;

    private String comment;

    private List<String> imageKeys = new ArrayList<>();
}
