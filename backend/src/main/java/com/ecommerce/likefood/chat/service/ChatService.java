package com.ecommerce.likefood.chat.service;

import com.ecommerce.likefood.chat.dto.req.ChatMessageRequest;
import com.ecommerce.likefood.chat.dto.res.ChatConversationResponse;
import com.ecommerce.likefood.chat.dto.res.ChatMessageResponse;

import java.util.List;

public interface ChatService {
    List<ChatConversationResponse> getConversationsForAdmin();

    List<ChatMessageResponse> getMessagesForAdmin(String userId);

    List<ChatMessageResponse> getMyMessages();

    ChatMessageResponse sendMessageAsUser(ChatMessageRequest request);

    ChatMessageResponse sendMessageAsAdmin(String userId, ChatMessageRequest request);
}
