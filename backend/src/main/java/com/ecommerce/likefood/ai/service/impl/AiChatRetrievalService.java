package com.ecommerce.likefood.ai.service.impl;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
class AiChatRetrievalService {

    @Getter
    enum FallbackLevel {
        EXACT,
        RELATED,
        CATEGORY_BUDGET,
        SAFE
    }

    record RetrievalResult(
            FallbackLevel fallbackLevel,
            List<String> productIds,
            boolean noMatch) {
    }

    RetrievalResult retrieve(
            String message,
            List<Map<String, Object>> productCatalog,
            int limit,
            String categoryHint,
            int maxBudgetVnd) {
        Optional<String> exact = AiChatProductSupport.findExactMatchProductId(message, productCatalog);
        if (exact.isPresent() && hasStock(productCatalog, exact.get())) {
            return new RetrievalResult(FallbackLevel.EXACT, List.of(exact.get()), false);
        }

        List<String> related = (StringUtils.hasText(categoryHint) || maxBudgetVnd > 0)
                ? AiChatProductSupport.findRelatedProductIds(message, productCatalog, limit, categoryHint, maxBudgetVnd)
                : AiChatProductSupport.findRelatedProductIds(message, productCatalog, limit);
        related = rerankByRelevance(related, message, productCatalog, categoryHint, maxBudgetVnd, limit);
        if (!related.isEmpty()) {
            FallbackLevel level = (StringUtils.hasText(categoryHint) || maxBudgetVnd > 0)
                    ? FallbackLevel.CATEGORY_BUDGET
                    : FallbackLevel.RELATED;
            return new RetrievalResult(level, related, false);
        }

        List<String> loose = AiChatProductSupport.findLooselyRelatedProductIds(message, productCatalog, limit * 2);
        loose = rerankByRelevance(loose, message, productCatalog, categoryHint, maxBudgetVnd, limit);
        if (!loose.isEmpty()) {
            return new RetrievalResult(FallbackLevel.RELATED, loose, false);
        }

        return new RetrievalResult(FallbackLevel.SAFE, List.of(), true);
    }

    private List<String> filterInStock(List<String> ids, List<Map<String, Object>> catalog, int limit) {
        if (ids == null || ids.isEmpty()) return List.of();
        List<String> result = new ArrayList<>();
        for (String id : ids.stream().distinct().toList()) {
            if (hasStock(catalog, id)) {
                result.add(id);
            }
            if (result.size() >= limit) break;
        }
        return result;
    }

    private List<String> rerankByRelevance(
            List<String> ids,
            String message,
            List<Map<String, Object>> catalog,
            String categoryHint,
            int maxBudgetVnd,
            int limit) {
        List<String> inStock = filterInStock(ids, catalog, Math.max(limit * 2, limit));
        if (inStock.isEmpty()) return inStock;

        Set<String> queryTokens = tokenize(message);
        return inStock.stream()
                .map(id -> Map.entry(id, scoreProduct(id, catalog, queryTokens, categoryHint, maxBudgetVnd)))
                .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
                .map(Map.Entry::getKey)
                .limit(limit)
                .toList();
    }

    private int scoreProduct(
            String id,
            List<Map<String, Object>> catalog,
            Set<String> queryTokens,
            String categoryHint,
            int maxBudgetVnd) {
        Map<String, Object> item = catalog.stream()
                .filter(entry -> String.valueOf(entry.get("id")).equals(String.valueOf(id)))
                .findFirst()
                .orElse(null);
        if (item == null) return 0;

        String name = String.valueOf(item.getOrDefault("name", "")).toLowerCase();
        String category = String.valueOf(item.getOrDefault("category", "")).toLowerCase();
        int score = 0;
        for (String token : queryTokens) {
            if (name.contains(token)) score += 3;
            if (category.contains(token)) score += 2;
        }
        if (StringUtils.hasText(categoryHint) && category.contains(categoryHint.toLowerCase())) {
            score += 4;
        }
        int minPrice = extractMinPrice(item);
        if (maxBudgetVnd > 0 && minPrice > 0) {
            if (minPrice <= maxBudgetVnd) {
                score += 5;
            } else {
                score -= 4;
            }
        }
        return score;
    }

    private int extractMinPrice(Map<String, Object> item) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> variants = (List<Map<String, Object>>) item.get("variants");
        if (variants == null || variants.isEmpty()) return -1;
        return variants.stream()
                .map(v -> v.get("price"))
                .filter(Number.class::isInstance)
                .map(Number.class::cast)
                .mapToInt(Number::intValue)
                .filter(price -> price > 0)
                .min()
                .orElse(-1);
    }

    private Set<String> tokenize(String message) {
        String normalized = AiChatTextSupport.normalize(message);
        if (!StringUtils.hasText(normalized)) return Set.of();
        return List.of(normalized.split("\\s+")).stream()
                .map(String::trim)
                .filter(token -> token.length() >= 2)
                .collect(Collectors.toSet());
    }

    private boolean hasStock(List<Map<String, Object>> catalog, String productId) {
        Map<String, Object> item = catalog.stream()
                .filter(entry -> String.valueOf(entry.get("id")).equals(String.valueOf(productId)))
                .findFirst()
                .orElse(null);
        if (item == null) return false;
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> variants = (List<Map<String, Object>>) item.get("variants");
        if (variants == null || variants.isEmpty()) return false;
        return variants.stream()
                .map(v -> v.get("stock"))
                .filter(s -> s instanceof Number)
                .map(Number.class::cast)
                .anyMatch(stock -> stock.intValue() > 0);
    }
}
