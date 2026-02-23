package com.ecommerce.likefood.chat.dto.res;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessageResponse {
    private String id;
    private String content;
    private String sender; // "user" | "admin"
    private Instant createdAt;
}
