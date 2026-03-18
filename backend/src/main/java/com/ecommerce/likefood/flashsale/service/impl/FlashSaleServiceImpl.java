package com.ecommerce.likefood.flashsale.service.impl;

import com.ecommerce.likefood.flashsale.domain.FlashSaleEvent;
import com.ecommerce.likefood.flashsale.domain.FlashSaleItem;
import com.ecommerce.likefood.flashsale.dto.req.FlashSaleEventRequest;
import com.ecommerce.likefood.flashsale.dto.req.FlashSaleItemRequest;
import com.ecommerce.likefood.flashsale.dto.res.FlashSaleEventResponse;
import com.ecommerce.likefood.flashsale.dto.res.FlashSaleItemResponse;
import com.ecommerce.likefood.flashsale.dto.res.FlashSaleSoldUpdate;
import com.ecommerce.likefood.flashsale.repository.FlashSaleEventRepository;
import com.ecommerce.likefood.flashsale.repository.FlashSaleItemRepository;
import com.ecommerce.likefood.flashsale.service.FlashSaleCacheService;
import com.ecommerce.likefood.flashsale.service.FlashSaleService;
import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductVariant;
import com.ecommerce.likefood.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlashSaleServiceImpl implements FlashSaleService {

    private final FlashSaleEventRepository flashSaleEventRepository;
    private final FlashSaleItemRepository flashSaleItemRepository;
    private final ProductRepository productRepository;
    private final FlashSaleCacheService cacheService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public List<FlashSaleEventResponse> getActiveFlashSales() {
        Instant now = Instant.now();
        List<FlashSaleEvent> events = flashSaleEventRepository.findActiveEvents(now);
        // Level 1: Pre-warm inventory into Redis on first access
        events.forEach(cacheService::warmEventInventory);
        return events.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<FlashSaleEventResponse> getTodayFlashSales() {
        ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate today = LocalDate.now(zoneId);
        Instant startOfDay = today.atStartOfDay(zoneId).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(zoneId).toInstant();
        List<FlashSaleEvent> events = flashSaleEventRepository.findEventsForDay(startOfDay, endOfDay);
        return events.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<FlashSaleEventResponse> getAllFlashSales() {
        return flashSaleEventRepository.findAllByOrderByStartTimeDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public FlashSaleEventResponse getFlashSaleById(String id) {
        FlashSaleEvent event = flashSaleEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flash sale event not found: " + id));
        return toResponse(event);
    }

    @Override
    @Transactional
    public FlashSaleEventResponse createFlashSale(FlashSaleEventRequest request) {
        FlashSaleEvent event = FlashSaleEvent.builder()
                .name(request.getName())
                .bannerUrl(request.getBannerUrl())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .items(new ArrayList<>())
                .build();

        if (request.getItems() != null) {
            for (FlashSaleItemRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));
                FlashSaleItem item = FlashSaleItem.builder()
                        .flashSaleEvent(event)
                        .product(product)
                        .salePrice(itemReq.getSalePrice())
                        .stock(itemReq.getStock() != null ? itemReq.getStock() : 0)
                        .soldCount(0)
                        .build();
                event.getItems().add(item);
            }
        }

        FlashSaleEvent saved = flashSaleEventRepository.save(event);
        // Pre-warm new event into Redis
        cacheService.warmEventInventory(saved);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public FlashSaleEventResponse updateFlashSale(String id, FlashSaleEventRequest request) {
        FlashSaleEvent event = flashSaleEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flash sale event not found: " + id));

        event.setName(request.getName());
        event.setBannerUrl(request.getBannerUrl());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        if (request.getIsActive() != null) {
            event.setIsActive(request.getIsActive());
        }

        // Replace items
        event.getItems().clear();
        if (request.getItems() != null) {
            for (FlashSaleItemRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));
                FlashSaleItem item = FlashSaleItem.builder()
                        .flashSaleEvent(event)
                        .product(product)
                        .salePrice(itemReq.getSalePrice())
                        .stock(itemReq.getStock() != null ? itemReq.getStock() : 0)
                        .soldCount(0)
                        .build();
                event.getItems().add(item);
            }
        }

        FlashSaleEvent saved = flashSaleEventRepository.save(event);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteFlashSale(String id) {
        FlashSaleEvent event = flashSaleEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flash sale event not found: " + id));
        cacheService.invalidateEvent(id);
        flashSaleEventRepository.delete(event);
    }

    // ═══ Level 2+3: Atomic Purchase + WebSocket Broadcast ═══

    @Override
    public FlashSaleSoldUpdate purchaseItem(String itemId) {
        FlashSaleItem item = flashSaleItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Flash sale item not found: " + itemId));

        // Level 2: Redis atomic DECR — Shopee-style anti-oversell
        int remaining = cacheService.attemptPurchase(itemId);
        if (remaining < 0) {
            throw new RuntimeException("Sold out! No stock remaining.");
        }

        int soldCount = cacheService.getSoldCount(itemId);
        int soldPercent = item.getStock() > 0 ? Math.min(100, (soldCount * 100) / item.getStock()) : 0;

        FlashSaleSoldUpdate update = FlashSaleSoldUpdate.builder()
                .eventId(item.getFlashSaleEvent().getId())
                .itemId(itemId)
                .soldCount(soldCount)
                .soldPercent(soldPercent)
                .remainingStock(remaining)
                .build();

        // Level 3: WebSocket broadcast — all connected clients see sold bar update instantly
        String topic = "/topic/flash-sale/" + item.getFlashSaleEvent().getId();
        messagingTemplate.convertAndSend(topic, update);
        log.info("⚡ Flash Sale purchase: item={}, sold={}, remaining={}", itemId, soldCount, remaining);

        return update;
    }

    // ─── Mapping helpers ───

    private FlashSaleEventResponse toResponse(FlashSaleEvent event) {
        List<FlashSaleItemResponse> itemResponses = event.getItems().stream()
                .map(this::toItemResponse)
                .collect(Collectors.toList());

        return FlashSaleEventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .bannerUrl(event.getBannerUrl())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .isActive(event.getIsActive())
                .items(itemResponses)
                .build();
    }

    private FlashSaleItemResponse toItemResponse(FlashSaleItem item) {
        Product product = item.getProduct();
        BigDecimal originalPrice = getOriginalPrice(product);
        BigDecimal salePrice = item.getSalePrice();
        int discountPercent = 0;
        if (originalPrice.compareTo(BigDecimal.ZERO) > 0 && originalPrice.compareTo(salePrice) > 0) {
            discountPercent = originalPrice.subtract(salePrice)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(originalPrice, 0, RoundingMode.FLOOR)
                    .intValue();
        }

        int soldPercent = 0;
        if (item.getStock() > 0) {
            soldPercent = Math.min(100, (item.getSoldCount() * 100) / item.getStock());
        }

        return FlashSaleItemResponse.builder()
                .id(item.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productSlug(product.getSlug())
                .productImage(product.getThumbnailKey())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .originalPrice(originalPrice)
                .salePrice(salePrice)
                .discountPercent(discountPercent)
                .stock(item.getStock())
                .soldCount(item.getSoldCount())
                .soldPercent(soldPercent)
                .build();
    }

    private BigDecimal getOriginalPrice(Product product) {
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            ProductVariant firstVariant = product.getVariants().get(0);
            // Use originalPrice if available, otherwise use regular price
            if (firstVariant.getOriginalPrice() != null) {
                return firstVariant.getOriginalPrice();
            }
            return firstVariant.getPrice();
        }
        return BigDecimal.ZERO;
    }
}
