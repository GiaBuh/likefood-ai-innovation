package com.ecommerce.likefood.ai.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatHistoryItem {
    @NotBlank(message = "history.role must not be blank")
    private String role;

    @NotBlank(message = "history.content must not be blank")
    private String content;
}
