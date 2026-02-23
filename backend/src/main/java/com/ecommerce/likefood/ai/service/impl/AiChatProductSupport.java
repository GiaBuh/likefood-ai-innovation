package com.ecommerce.likefood.ai.service.impl;

import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductVariant;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

final class AiChatProductSupport {
    private static final Set<String> SEARCH_STOP_WORDS = Set.of(
            "xin", "chao", "hello", "hi", "ban", "toi", "anh", "chi", "em", "cho", "co", "the",
            "duoc", "khong", "gi", "nao", "mot", "vai", "di", "nhe", "a", "ha", "va", "voi", "hay",
            "goi", "y", "tu", "van", "mon", "hom", "nay", "menu", "danh", "sach", "an", "uong",
            "please", "can", "you", "i", "me", "my", "some", "any", "the", "a", "an", "what", "which",
            "show", "suggest", "recommend");
    private static final Map<String, String> EN_TO_VI_HINTS = Map.ofEntries(
            Map.entry("dried beef", "kho bo"),
            Map.entry("beef jerky", "kho bo"),
            Map.entry("chicken jerky", "kho ga"),
            Map.entry("dried chicken", "kho ga"),
            Map.entry("chicken", "ga"),
            Map.entry("lime leaf", "la chanh"),
            Map.entry("lime leaves", "la chanh"),
            Map.entry("shrimp", "tom"),
            Map.entry("squid", "muc"),
            Map.entry("fish sauce", "nuoc mam"),
            Map.entry("tamarind", "me"),
            Map.entry("spicy", "cay"),
            Map.entry("seaweed", "rong bien"),
            Map.entry("dried", "kho"));

    private AiChatProductSupport() {
    }

    static List<Map<String, Object>> buildProductCatalog(List<Product> products) {
        return products.stream()
                .map(product -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", product.getId());
                    item.put("name", product.getName());
                    item.put("category", product.getCategory() != null ? product.getCategory().getName() : "");
                    item.put("description", product.getDescription() == null ? "" : product.getDescription());

                    List<Map<String, Object>> variants = product.getVariants().stream().map(variant -> {
                        Map<String, Object> variantMap = new LinkedHashMap<>();
                        variantMap.put("id", variant.getId());
                        variantMap.put("weight", formatWeight(variant.getWeightValue(), variant.getWeightUnit()));
                        variantMap.put("price", variant.getPrice());
                        variantMap.put("stock", variant.getQuantity());
                        return variantMap;
                    }).toList();

                    item.put("variants", variants);
                    return item;
                })
                .toList();
    }

    private static final int STRICT_SCORE_THRESHOLD = 3;
    private static final int LOOSE_SCORE_THRESHOLD = 2;

    static List<String> findRelatedProductIds(String message, List<Map<String, Object>> productCatalog, int limit) {
        return findRelatedProductIds(message, productCatalog, limit, STRICT_SCORE_THRESHOLD);
    }

    /** Tìm món liên quan với ngưỡng thấp - khi không có món khớp chính xác. VD: "khô gà lá chanh" -> Khô bò, Khô mực. */
    static List<String> findLooselyRelatedProductIds(String message, List<Map<String, Object>> productCatalog, int limit) {
        return findRelatedProductIds(message, productCatalog, limit, LOOSE_SCORE_THRESHOLD);
    }

    static List<Product> pickFeaturedProducts(List<Product> products, int limit) {
        return products.stream()
                .sorted((a, b) -> {
                    int stockA = a.getVariants().stream().mapToInt(v -> v.getQuantity() == null ? 0 : v.getQuantity())
                            .sum();
                    int stockB = b.getVariants().stream().mapToInt(v -> v.getQuantity() == null ? 0 : v.getQuantity())
                            .sum();
                    return Integer.compare(stockB, stockA);
                })
                .limit(limit)
                .toList();
    }

    static Optional<ProductVariant> parseVariantFromMessage(String message, Product product) {
        String normalized = AiChatTextSupport.normalize(message);
        for (ProductVariant variant : product.getVariants()) {
            String weightStr = AiChatTextSupport.normalize(formatWeight(variant.getWeightValue(), variant.getWeightUnit()));
            if (weightStr.isEmpty()) continue;
            if (normalized.contains(weightStr)) return Optional.of(variant);
            String alt = toGramEquivalent(variant.getWeightValue(), variant.getWeightUnit());
            if (StringUtils.hasText(alt) && normalized.contains(alt)) return Optional.of(variant);
        }
        return Optional.empty();
    }

    /** VD: variant 0.92kg -> "920g" để match khi user gõ "920g". */
    private static String toGramEquivalent(BigDecimal value, String unit) {
        if (value == null || !StringUtils.hasText(unit)) return "";
        if ("kg".equalsIgnoreCase(unit)) {
            return value.multiply(BigDecimal.valueOf(1000)).stripTrailingZeros().toPlainString().replaceAll("\\.0+$", "") + "g";
        }
        return "";
    }

    static String formatWeight(BigDecimal value, String unit) {
        if (value == null || unit == null) {
            return "";
        }
        return value.stripTrailingZeros().toPlainString() + unit;
    }

    static String buildCatalogSummary(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return "(No products available)";
        }
        StringBuilder sb = new StringBuilder();
        for (Product product : products) {
            sb.append("- ").append(product.getName());
            if (product.getCategory() != null && StringUtils.hasText(product.getCategory().getName())) {
                sb.append(" [").append(product.getCategory().getName()).append("]");
            }
            if (StringUtils.hasText(product.getDescription())) {
                String desc = product.getDescription();
                if (desc.length() > 80) desc = desc.substring(0, 80) + "...";
                sb.append(": ").append(desc);
            }
            if (product.getVariants() != null && !product.getVariants().isEmpty()) {
                String variantInfo = product.getVariants().stream()
                        .map(v -> {
                            String w = formatWeight(v.getWeightValue(), v.getWeightUnit());
                            String p = v.getPrice() != null ? v.getPrice().toPlainString() + "đ" : "?";
                            return w + " = " + p;
                        })
                        .collect(Collectors.joining(", "));
                sb.append(" | Quy cách: ").append(variantInfo);
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    static String buildProductDetailText(Product product, String language) {
        StringBuilder sb = new StringBuilder();
        sb.append(product.getName());
        if (product.getCategory() != null && StringUtils.hasText(product.getCategory().getName())) {
            sb.append(" (").append(product.getCategory().getName()).append(")");
        }
        sb.append("\n");
        if (StringUtils.hasText(product.getDescription())) {
            sb.append(product.getDescription()).append("\n");
        }
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            for (ProductVariant v : product.getVariants()) {
                String w = formatWeight(v.getWeightValue(), v.getWeightUnit());
                String p = v.getPrice() != null ? v.getPrice().toPlainString() + "đ" : "?";
                int stock = v.getQuantity() != null ? v.getQuantity() : 0;
                String stockLabel = "en".equalsIgnoreCase(language)
                        ? (stock > 0 ? "in stock" : "out of stock")
                        : (stock > 0 ? "còn hàng" : "hết hàng");
                sb.append("  • ").append(w).append(" — ").append(p).append(" (").append(stockLabel).append(")\n");
            }
        }
        return sb.toString().trim();
    }

    /**
     * Tìm sản phẩm liên quan với ngưỡng điểm thấp hơn (score >= minScore).
     * Dùng khi tìm kiếm chặt không ra kết quả - để gợi ý món có chung từ khóa (vd: "khô" -> Khô bò, Khô mực).
     */
    static List<String> findRelatedProductIds(String message, List<Map<String, Object>> productCatalog, int limit,
            int minScore) {
        String normalizedMessage = AiChatTextSupport.normalize(expandSearchQuery(message));
        if (!StringUtils.hasText(normalizedMessage)) {
            return List.of();
        }
        List<String> tokens = List.of(normalizedMessage.split(" ")).stream()
                .filter(token -> token.length() >= 2)
                .filter(token -> !SEARCH_STOP_WORDS.contains(token))
                .toList();
        if (tokens.isEmpty()) {
            return List.of();
        }

        return productCatalog.stream()
                .map(item -> {
                    String id = String.valueOf(item.get("id"));
                    String name = AiChatTextSupport.normalize(String.valueOf(item.getOrDefault("name", "")));
                    String category = AiChatTextSupport.normalize(String.valueOf(item.getOrDefault("category", "")));
                    String description = AiChatTextSupport
                            .normalize(String.valueOf(item.getOrDefault("description", "")));
                    int score = 0;
                    if (name.contains(normalizedMessage) || normalizedMessage.contains(name)) {
                        score += 8;
                    }
                    for (String token : tokens) {
                        if (containsWord(name, token))
                            score += 3;
                        else if (name.contains(token))
                            score += 1;
                        if (category.contains(token))
                            score += 1;
                        if (description.contains(token))
                            score += 1;
                    }
                    return Map.entry(id, score);
                })
                .filter(entry -> entry.getValue() >= minScore)
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .map(Map.Entry::getKey)
                .distinct()
                .limit(limit)
                .toList();
    }

    /** Kiểm tra text có chứa token như một từ riêng (tránh "kho" khớp trong "khoai"). */
    private static boolean containsWord(String text, String token) {
        if (!StringUtils.hasText(text) || !StringUtils.hasText(token))
            return false;
        String withSpaces = " " + text + " ";
        return withSpaces.contains(" " + token + " ");
    }

    private static String expandSearchQuery(String message) {
        if (!StringUtils.hasText(message))
            return "";
        String expanded = message;
        String lower = message.toLowerCase();
        for (Map.Entry<String, String> entry : EN_TO_VI_HINTS.entrySet()) {
            if (lower.contains(entry.getKey())) {
                expanded = expanded + " " + entry.getValue();
            }
        }
        return expanded;
    }
}
