package com.ecommerce.likefood.chat.dto.res;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatConversationResponse {
    private String userId;
    private String fullname;
    private String email;
    private String avatarUrl;
    private String initials;
    private String initialsBgColor;
    private String initialsTextColor;
    private String lastMessage;
    private String lastMessageAt;
}
