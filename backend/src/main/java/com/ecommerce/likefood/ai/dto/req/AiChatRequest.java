package com.ecommerce.likefood.ai.dto.req;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatRequest {
    @NotBlank(message = "message must not be blank")
    private String message;
    // Optional: locked by frontend based on first user input ("vi" | "en")
    private String preferredLanguage;
    private AiChatContext context;

    @Valid
    @Builder.Default
    private List<AiChatHistoryItem> history = new ArrayList<>();
}
