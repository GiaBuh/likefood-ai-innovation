package com.ecommerce.likefood.flashsale.dto.req;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashSaleEventRequest {
    private String name;
    private String bannerUrl;
    private Instant startTime;
    private Instant endTime;
    private Boolean isActive;
    private List<FlashSaleItemRequest> items;
}
