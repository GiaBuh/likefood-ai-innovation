package com.ecommerce.likefood.chat.controller;

import com.ecommerce.likefood.chat.dto.req.ChatMessageRequest;
import com.ecommerce.likefood.chat.dto.res.ChatConversationResponse;
import com.ecommerce.likefood.chat.dto.res.ChatMessageResponse;
import com.ecommerce.likefood.chat.service.ChatService;
import com.ecommerce.likefood.common.utils.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    @GetMapping("/me/messages")
    @ApiMessage("Get my messages")
    public ResponseEntity<List<ChatMessageResponse>> getMyMessages() {
        return ResponseEntity.ok(chatService.getMyMessages());
    }

    @PostMapping("/me/messages")
    @ApiMessage("Send message as user")
    public ResponseEntity<ChatMessageResponse> sendAsUser(@RequestBody @Valid ChatMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.sendMessageAsUser(request));
    }

    @GetMapping("/admin/conversations")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Get all conversations for admin")
    public ResponseEntity<List<ChatConversationResponse>> getConversations() {
        return ResponseEntity.ok(chatService.getConversationsForAdmin());
    }

    @GetMapping("/admin/conversations/{userId}/messages")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Get messages for a conversation")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable String userId) {
        return ResponseEntity.ok(chatService.getMessagesForAdmin(userId));
    }

    @PostMapping("/admin/conversations/{userId}/messages")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Send message as admin")
    public ResponseEntity<ChatMessageResponse> sendAsAdmin(
            @PathVariable String userId,
            @RequestBody @Valid ChatMessageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.sendMessageAsAdmin(userId, request));
    }
}
