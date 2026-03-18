package com.ecommerce.likefood.flashsale.dto.res;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class FlashSaleEventResponse {
    private String id;
    private String name;
    private String bannerUrl;
    private Instant startTime;
    private Instant endTime;
    private Boolean isActive;
    private List<FlashSaleItemResponse> items;
}
