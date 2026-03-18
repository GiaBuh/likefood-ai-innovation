package com.ecommerce.likefood.flashsale.controller;

import com.ecommerce.likefood.common.utils.ApiMessage;
import com.ecommerce.likefood.flashsale.dto.req.FlashSaleEventRequest;
import com.ecommerce.likefood.flashsale.dto.res.FlashSaleEventResponse;
import com.ecommerce.likefood.flashsale.dto.res.FlashSaleSoldUpdate;
import com.ecommerce.likefood.flashsale.service.FlashSaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/flash-sale")
@RequiredArgsConstructor
public class FlashSaleController {

    private final FlashSaleService flashSaleService;

    // ─── Public endpoints ───

    @GetMapping("/active")
    @ApiMessage("Fetched active flash sales successfully")
    public ResponseEntity<List<FlashSaleEventResponse>> getActiveFlashSales() {
        return ResponseEntity.ok(flashSaleService.getActiveFlashSales());
    }

    @GetMapping("/today")
    @ApiMessage("Fetched today's flash sales successfully")
    public ResponseEntity<List<FlashSaleEventResponse>> getTodayFlashSales() {
        return ResponseEntity.ok(flashSaleService.getTodayFlashSales());
    }

    /**
     * Shopee-level: Server time sync endpoint.
     * Frontend syncs countdown timer with server clock, prevents user clock manipulation.
     */
    @GetMapping("/server-time")
    public ResponseEntity<Map<String, Object>> getServerTime() {
        return ResponseEntity.ok(Map.of("serverTime", Instant.now().toString()));
    }

    /**
     * Shopee-level: Atomic Flash Sale purchase via Redis DECR.
     * Race-condition proof — handles thousands of concurrent purchases.
     * WebSocket broadcasts real-time sold count update to all connected clients.
     */
    @PostMapping("/purchase/{itemId}")
    @ApiMessage("Flash sale purchase processed")
    public ResponseEntity<FlashSaleSoldUpdate> purchaseItem(@PathVariable String itemId) {
        return ResponseEntity.ok(flashSaleService.purchaseItem(itemId));
    }

    // ─── Admin endpoints ───

    @GetMapping
    @PreAuthorize("hasPermission(null, 'FLASH_SALE', 'VIEW')")
    @ApiMessage("Fetched all flash sales successfully")
    public ResponseEntity<List<FlashSaleEventResponse>> getAllFlashSales() {
        return ResponseEntity.ok(flashSaleService.getAllFlashSales());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'FLASH_SALE', 'VIEW')")
    @ApiMessage("Fetched flash sale successfully")
    public ResponseEntity<FlashSaleEventResponse> getFlashSaleById(@PathVariable String id) {
        return ResponseEntity.ok(flashSaleService.getFlashSaleById(id));
    }

    @PostMapping
    @PreAuthorize("hasPermission(null, 'FLASH_SALE', 'CREATE')")
    @ApiMessage("Created flash sale successfully")
    public ResponseEntity<FlashSaleEventResponse> createFlashSale(@RequestBody FlashSaleEventRequest request) {
        return ResponseEntity.ok(flashSaleService.createFlashSale(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'FLASH_SALE', 'EDIT')")
    @ApiMessage("Updated flash sale successfully")
    public ResponseEntity<FlashSaleEventResponse> updateFlashSale(
            @PathVariable String id,
            @RequestBody FlashSaleEventRequest request) {
        return ResponseEntity.ok(flashSaleService.updateFlashSale(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'FLASH_SALE', 'DELETE')")
    @ApiMessage("Deleted flash sale successfully")
    public ResponseEntity<Void> deleteFlashSale(@PathVariable String id) {
        flashSaleService.deleteFlashSale(id);
        return ResponseEntity.ok().build();
    }
}
