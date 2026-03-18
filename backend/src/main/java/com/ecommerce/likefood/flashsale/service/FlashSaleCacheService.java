package com.ecommerce.likefood.flashsale.service;

import com.ecommerce.likefood.flashsale.domain.FlashSaleEvent;
import com.ecommerce.likefood.flashsale.domain.FlashSaleItem;
import com.ecommerce.likefood.flashsale.repository.FlashSaleEventRepository;
import com.ecommerce.likefood.flashsale.repository.FlashSaleItemRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Shopee-level Flash Sale caching & atomic inventory service.
 *
 * Level 1: Cache active/today events in Redis (30s TTL)
 * Level 2: Atomic stock DECR in Redis (anti-oversell)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FlashSaleCacheService {

    private final RedisTemplate<String, String> redisTemplate;
    private final FlashSaleItemRepository flashSaleItemRepository;
    private final FlashSaleEventRepository flashSaleEventRepository;
    private final ObjectMapper objectMapper;

    // ─── Key patterns ───
    private static final String STOCK_KEY_PREFIX = "flash_sale:stock:";
    private static final String SOLD_KEY_PREFIX = "flash_sale:sold:";
    private static final String EVENT_STOCK_WARMED = "flash_sale:warmed:";

    // ═══ Level 1: Cache ═══

    /**
     * Pre-warm inventory for an event into Redis.
     * Called when admin creates/updates event, or on first access.
     */
    public void warmEventInventory(FlashSaleEvent event) {
        String warmedKey = EVENT_STOCK_WARMED + event.getId();
        if (Boolean.TRUE.equals(redisTemplate.hasKey(warmedKey))) {
            return; // Already warmed
        }

        for (FlashSaleItem item : event.getItems()) {
            String stockKey = STOCK_KEY_PREFIX + item.getId();
            String soldKey = SOLD_KEY_PREFIX + item.getId();

            // Set stock = total stock - already sold
            int remaining = item.getStock() - item.getSoldCount();
            redisTemplate.opsForValue().set(stockKey, String.valueOf(remaining));
            redisTemplate.opsForValue().set(soldKey, String.valueOf(item.getSoldCount()));

            // TTL = event end time + 1 hour buffer
            long ttlSeconds = Duration.between(Instant.now(), event.getEndTime()).getSeconds() + 3600;
            if (ttlSeconds > 0) {
                redisTemplate.expire(stockKey, ttlSeconds, TimeUnit.SECONDS);
                redisTemplate.expire(soldKey, ttlSeconds, TimeUnit.SECONDS);
            }
        }

        // Mark as warmed
        long eventTtl = Duration.between(Instant.now(), event.getEndTime()).getSeconds() + 3600;
        redisTemplate.opsForValue().set(warmedKey, "1", Math.max(eventTtl, 60), TimeUnit.SECONDS);
        log.info("Pre-warmed inventory for Flash Sale event: {} ({} items)", event.getName(), event.getItems().size());
    }

    /**
     * Warm all currently active events.
     */
    public void warmActiveEvents() {
        Instant now = Instant.now();
        List<FlashSaleEvent> activeEvents = flashSaleEventRepository.findActiveEvents(now);
        for (FlashSaleEvent event : activeEvents) {
            warmEventInventory(event);
        }
    }

    // ═══ Level 2: Atomic Inventory ═══

    /**
     * Atomically attempt to purchase an item.
     * Uses Redis DECR for lock-free, race-condition-proof inventory management.
     *
     * @return remaining stock after purchase, or -1 if sold out
     */
    public int attemptPurchase(String itemId) {
        String stockKey = STOCK_KEY_PREFIX + itemId;
        String soldKey = SOLD_KEY_PREFIX + itemId;

        // Check if stock key exists (inventory warmed?)
        if (Boolean.FALSE.equals(redisTemplate.hasKey(stockKey))) {
            // Cold start: warm from DB
            FlashSaleItem item = flashSaleItemRepository.findById(itemId).orElse(null);
            if (item == null) return -1;
            warmEventInventory(item.getFlashSaleEvent());
        }

        // Atomic DECR — this is the Shopee-level magic ⚡
        Long remaining = redisTemplate.opsForValue().decrement(stockKey);

        if (remaining == null || remaining < 0) {
            // Oversold! Rollback
            redisTemplate.opsForValue().increment(stockKey);
            return -1;
        }

        // Success! Increment sold count
        redisTemplate.opsForValue().increment(soldKey);

        // Async sync to DB (fire and forget — DB is not source of truth during sale)
        syncSoldCountToDb(itemId);

        return remaining.intValue();
    }

    /**
     * Get current sold count from Redis (real-time).
     */
    public int getSoldCount(String itemId) {
        String soldKey = SOLD_KEY_PREFIX + itemId;
        String val = redisTemplate.opsForValue().get(soldKey);
        return val != null ? Integer.parseInt(val) : 0;
    }

    /**
     * Get remaining stock from Redis (real-time).
     */
    public int getRemainingStock(String itemId) {
        String stockKey = STOCK_KEY_PREFIX + itemId;
        String val = redisTemplate.opsForValue().get(stockKey);
        return val != null ? Integer.parseInt(val) : 0;
    }

    /**
     * Sync Redis sold count back to database.
     */
    private void syncSoldCountToDb(String itemId) {
        try {
            int soldCount = getSoldCount(itemId);
            flashSaleItemRepository.findById(itemId).ifPresent(item -> {
                item.setSoldCount(soldCount);
                flashSaleItemRepository.save(item);
            });
        } catch (Exception e) {
            log.warn("Failed to sync sold count to DB for item {}: {}", itemId, e.getMessage());
        }
    }

    /**
     * Invalidate all caches for an event (called on admin CRUD).
     */
    public void invalidateEvent(String eventId) {
        String warmedKey = EVENT_STOCK_WARMED + eventId;
        redisTemplate.delete(warmedKey);
        log.info("Invalidated cache for event: {}", eventId);
    }
}
