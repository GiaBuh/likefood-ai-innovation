package com.ecommerce.likefood.flashsale.dto.res;

import lombok.Builder;
import lombok.Data;

/**
 * Real-time WebSocket payload for sold count updates.
 * Broadcast to /topic/flash-sale/{eventId} after each purchase.
 */
@Data
@Builder
public class FlashSaleSoldUpdate {
    private String eventId;
    private String itemId;
    private int soldCount;
    private int soldPercent;
    private int remainingStock;
}
