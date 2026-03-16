package com.ecommerce.likefood.review.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewReplyRequest {
    @NotBlank
    private String replyText;
}
