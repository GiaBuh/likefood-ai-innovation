package com.ecommerce.likefood.chat.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessageRequest {
    @NotBlank(message = "Message content is required")
    private String content;
}
