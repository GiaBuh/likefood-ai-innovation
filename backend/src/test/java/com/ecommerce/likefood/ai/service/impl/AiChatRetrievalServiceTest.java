package com.ecommerce.likefood.ai.service.impl;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiChatRetrievalServiceTest {

    private final AiChatRetrievalService retrievalService = new AiChatRetrievalService();

    @Test
    void shouldReturnRelatedWhenNoExactMatch() {
        List<Map<String, Object>> catalog = List.of(
                product("p1", "Kho bo cay", "Kho", 2.5, 10),
                product("p2", "Kho ga la chanh", "Kho", 2.0, 12),
                product("p3", "Banh gao", "Banh", 1.5, 5));

        AiChatRetrievalService.RetrievalResult result = retrievalService.retrieve(
                "kho heo", catalog, 4, "", 0);

        assertEquals(AiChatRetrievalService.FallbackLevel.RELATED, result.fallbackLevel());
        assertFalse(result.productIds().isEmpty());
        assertFalse(result.noMatch());
    }

    @Test
    void shouldSkipOutOfStockProducts() {
        List<Map<String, Object>> catalog = List.of(
                product("p1", "Muc rim", "Muc", 3.0, 0),
                product("p2", "Muc sa te", "Muc", 3.5, 4));

        AiChatRetrievalService.RetrievalResult result = retrievalService.retrieve(
                "muc", catalog, 4, "Muc", 0);

        assertTrue(result.productIds().contains("p2"));
        assertFalse(result.productIds().contains("p1"));
    }

    @Test
    void shouldApplyBudgetFilter() {
        List<Map<String, Object>> catalog = List.of(
                product("p1", "Hat dieu", "Hat", 3.5, 8),
                product("p2", "Hat bi", "Hat", 1.2, 9));

        AiChatRetrievalService.RetrievalResult result = retrievalService.retrieve(
                "hat", catalog, 4, "Hat", 30000);

        assertEquals(AiChatRetrievalService.FallbackLevel.CATEGORY_BUDGET, result.fallbackLevel());
        assertTrue(result.productIds().contains("p2"));
        assertFalse(result.productIds().contains("p1"));
    }

    @Test
    void shouldKeepPrimaryNameClusterAndDropWeakSingleTokenMatches() {
        List<Map<String, Object>> catalog = List.of(
                product("p1", "Cha bong heo 200g", "Kho", 1.8, 10),
                product("p2", "Kho ga la chanh", "Kho", 2.0, 12),
                product("p3", "Cha bong ca", "Kho", 1.9, 6));

        AiChatRetrievalService.RetrievalResult result = retrievalService.retrieve(
                "toi muon cha bong ga", catalog, 4, "", 0);

        assertTrue(result.productIds().contains("p1"));
        assertTrue(result.productIds().contains("p3"));
        assertFalse(result.productIds().contains("p2"));
    }

    @Test
    void shouldBoostCategoryHintInReranking() {
        List<Map<String, Object>> catalog = List.of(
                product("p1", "Kho ga sot cay", "Ga", 22000, 12),
                product("p2", "Kho ga la chanh", "Kho", 22000, 12));

        AiChatRetrievalService.RetrievalResult result = retrievalService.retrieve(
                "kho ga", catalog, 2, "Ga", 30000);

        assertEquals("p1", result.productIds().getFirst());
    }

    private Map<String, Object> product(String id, String name, String category, double priceUsd, int stock) {
        return Map.of(
                "id", id,
                "name", name,
                "category", category,
                "description", "",
                "variants", List.of(Map.of(
                        "id", id + "-v1",
                        "weight", "100g",
                        "price", priceUsd,
                        "stock", stock)));
    }
}
