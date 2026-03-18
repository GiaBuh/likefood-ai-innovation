package com.ecommerce.likefood.flashsale.service;

import com.ecommerce.likefood.flashsale.dto.req.FlashSaleEventRequest;
import com.ecommerce.likefood.flashsale.dto.res.FlashSaleEventResponse;

import com.ecommerce.likefood.flashsale.dto.res.FlashSaleSoldUpdate;

import java.util.List;

public interface FlashSaleService {
    List<FlashSaleEventResponse> getActiveFlashSales();
    List<FlashSaleEventResponse> getTodayFlashSales();
    List<FlashSaleEventResponse> getAllFlashSales();
    FlashSaleEventResponse getFlashSaleById(String id);
    FlashSaleEventResponse createFlashSale(FlashSaleEventRequest request);
    FlashSaleEventResponse updateFlashSale(String id, FlashSaleEventRequest request);
    void deleteFlashSale(String id);
    FlashSaleSoldUpdate purchaseItem(String itemId);
}
