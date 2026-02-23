package com.ecommerce.likefood.chat.repository;

import com.ecommerce.likefood.chat.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
    List<ChatMessage> findByUser_IdOrderByCreatedAtAsc(String userId);

    boolean existsByUser_Id(String userId);

    @Query("SELECT DISTINCT m.user.id FROM ChatMessage m")
    List<String> findDistinctUserIds();

    @Modifying
    @Query("DELETE FROM ChatMessage m WHERE m.createdAt < :before")
    int deleteByCreatedAtBefore(@Param("before") Instant before);
}
