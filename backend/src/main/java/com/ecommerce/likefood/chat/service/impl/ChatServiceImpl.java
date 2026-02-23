package com.ecommerce.likefood.chat.service.impl;

import com.ecommerce.likefood.chat.domain.ChatMessage;
import com.ecommerce.likefood.chat.dto.req.ChatMessageRequest;
import com.ecommerce.likefood.chat.dto.res.ChatConversationResponse;
import com.ecommerce.likefood.chat.dto.res.ChatMessageResponse;
import com.ecommerce.likefood.chat.repository.ChatMessageRepository;
import com.ecommerce.likefood.chat.service.ChatService;
import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.common.security.SecurityUtils;
import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {
    private static final String CHAT_TOPIC_PREFIX = "/topic/chat/";

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public List<ChatConversationResponse> getConversationsForAdmin() {
        List<String> userIds = chatMessageRepository.findDistinctUserIds();
        List<ChatConversationResponse> result = new ArrayList<>();
        for (String userId : userIds) {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) continue;
            List<ChatMessage> messages = chatMessageRepository.findByUser_IdOrderByCreatedAtAsc(userId);
            ChatMessage last = messages.isEmpty() ? null : messages.get(messages.size() - 1);
            result.add(ChatConversationResponse.builder()
                    .userId(user.getId())
                    .fullname(user.getUsername())
                    .email(user.getEmail())
                    .avatarUrl(user.getAvatarUrl())
                    .lastMessage(last != null ? truncate(last.getContent(), 50) : null)
                    .lastMessageAt(last != null ? last.getCreatedAt().toString() : null)
                    .build());
        }
        result.sort(Comparator.comparing(ChatConversationResponse::getLastMessageAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    public List<ChatMessageResponse> getMessagesForAdmin(String userId) {
        List<ChatMessage> messages = chatMessageRepository.findByUser_IdOrderByCreatedAtAsc(userId);
        return messages.stream().map(this::toResponse).toList();
    }

    @Override
    public List<ChatMessageResponse> getMyMessages() {
        String email = SecurityUtils.getCurrentUserLogin().orElseThrow(() -> new AppException("Unauthenticated"));
        User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException("User not found"));
        List<ChatMessage> messages = chatMessageRepository.findByUser_IdOrderByCreatedAtAsc(user.getId());
        return messages.stream().map(this::toResponse).toList();
    }

    @Override
    public ChatMessageResponse sendMessageAsUser(ChatMessageRequest request) {
        String email = SecurityUtils.getCurrentUserLogin().orElseThrow(() -> new AppException("Unauthenticated"));
        User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException("User not found"));
        ChatMessage msg = ChatMessage.builder()
                .user(user)
                .senderType(ChatMessage.SenderType.USER)
                .content(request.getContent().trim())
                .build();
        ChatMessage saved = chatMessageRepository.save(msg);
        broadcastMessage(user.getId(), saved);
        return toResponse(saved);
    }

    @Override
    public ChatMessageResponse sendMessageAsAdmin(String userId, ChatMessageRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException("User not found"));
        ChatMessage msg = ChatMessage.builder()
                .user(user)
                .senderType(ChatMessage.SenderType.ADMIN)
                .content(request.getContent().trim())
                .build();
        ChatMessage saved = chatMessageRepository.save(msg);
        broadcastMessage(user.getId(), saved);
        return toResponse(saved);
    }

    private void broadcastMessage(String userId, ChatMessage msg) {
        messagingTemplate.convertAndSend(CHAT_TOPIC_PREFIX + userId, toResponse(msg));
    }

    private ChatMessageResponse toResponse(ChatMessage m) {
        return ChatMessageResponse.builder()
                .id(m.getId())
                .content(m.getContent())
                .sender(m.getSenderType() == ChatMessage.SenderType.USER ? "user" : "admin")
                .createdAt(m.getCreatedAt())
                .build();
    }

    private String truncate(String s, int max) {
        if (s == null || s.length() <= max) return s;
        return s.substring(0, max) + "...";
    }
}
