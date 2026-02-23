package com.ecommerce.likefood.chat.scheduler;

import com.ecommerce.likefood.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatCleanupScheduler {

    private final ChatMessageRepository chatMessageRepository;

    /** Runs daily at 00:00, deletes chat messages older than 1 day */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void deleteOldConversations() {
        Instant cutoff = Instant.now().minus(1, ChronoUnit.DAYS);
        try {
            int deleted = chatMessageRepository.deleteByCreatedAtBefore(cutoff);
            log.info("Chat cleanup: deleted {} message(s) older than 1 day", deleted);
        } catch (Exception e) {
            log.error("Chat cleanup failed", e);
        }
    }
}
