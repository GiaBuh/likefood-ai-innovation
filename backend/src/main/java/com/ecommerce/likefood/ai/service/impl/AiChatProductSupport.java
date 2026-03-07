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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

final class AiChatProductSupport {
    private static final Set<String> SEARCH_STOP_WORDS = Set.of(
            "xin", "chao", "hello", "hi", "ban", "toi", "anh", "chi", "em", "cho", "co", "the",
            "duoc", "khong", "gi", "nao", "mot", "vai", "di", "nhe", "a", "ha", "va", "voi", "hay",
            "goi", "y", "tu", "van", "mon", "hom", "nay", "menu", "danh", "sach", "an", "uong",
            "mua", "dat", "them", "gio", "hang",
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
            Map.entry("dried", "kho"),
            Map.entry("nuts", "hat"));
    /** Map query terms to catalog category names for category-based search. */
    private static final Map<String, String> CATEGORY_QUERY_MAP = Map.ofEntries(
            Map.entry("hat", "Hạt"),
            Map.entry("banh", "Bánh"),
            Map.entry("muc", "Mực"),
            Map.entry("mut", "Mứt"),
            Map.entry("kho", "Khô"));

    /** Phát hiện category từ message (VD: "dạng hạt", "loại hạt" -> "Hạt"). Dùng pattern cụ thể để tránh match sai (vd: "kho" trong "khoai"). */
    static String parseCategoryHintFromMessage(String message) {
        if (!StringUtils.hasText(message)) return "";
        String n = AiChatTextSupport.normalize(message);
        if (n.contains("dang hat") || n.contains("loai hat") || n.contains("thuoc dang hat") || n.contains("thuoc loai hat") || n.contains("mon hat") || n.contains("nuts")) return "Hạt";
        if (n.contains("dang banh") || n.contains("loai banh") || n.contains("thuoc dang banh") || n.contains("mon banh")) return "Bánh";
        if (n.contains("dang muc") || n.contains("loai muc") || n.contains("thuoc dang muc") || n.contains("mon muc")) return "Mực";
        if (n.contains("dang mut") || n.contains("loai mut") || n.contains("thuoc dang mut") || n.contains("mon mut")) return "Mứt";
        if (n.contains("dang kho") || n.contains("loai kho") || n.contains("thuoc dang kho") || n.contains("mon kho")) return "Khô";
        return "";
    }

    private static final Pattern BUDGET_K = Pattern.compile("(\\d+)\\s*k\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern BUDGET_DO = Pattern.compile("(\\d+)\\s*(đô|do|usd|dollar)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern BUDGET_NGHIN = Pattern.compile("(\\d+)\\s*(nghin|ngan|nghìn|ngàn|trăm|tram)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern BUDGET_SO = Pattern.compile("(\\d{1,3}(?:[.,]\\d{3})*)\\s*(?:đ|vnd|dong)?", Pattern.CASE_INSENSITIVE);

    /** Phát hiện ngân sách VND từ message (VD: "50k"->50000, "100 nghìn"->100000, "50 đô"->1250000). */
    static int parseBudgetVndFromMessage(String message) {
        if (!StringUtils.hasText(message)) return 0;
        String s = message.replaceAll("[\\s,]", " ");
        Matcher m = BUDGET_K.matcher(s);
        if (m.find()) return Integer.parseInt(m.group(1)) * 1000;
        m = BUDGET_DO.matcher(s);
        if (m.find()) return Integer.parseInt(m.group(1)) * 25000;
        m = BUDGET_NGHIN.matcher(s);
        if (m.find()) {
            int n = Integer.parseInt(m.group(1));
            String u = m.group(2).toLowerCase();
            if (u.contains("trăm") || u.contains("tram")) return n * 100;
            return n * 1000;
        }
        m = BUDGET_SO.matcher(s);
        if (m.find()) return Integer.parseInt(m.group(1).replaceAll("[.,]", ""));
        return 0;
    }

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

    private static final int STRICT_SCORE_THRESHOLD = 4;
    private static final int LOOSE_SCORE_THRESHOLD = 3;
    /** Độ dài tối thiểu của token để chấm điểm - tránh "mu" match cả "muc" và "mut". */
    private static final int MIN_TOKEN_LENGTH = 3;

    static List<String> findRelatedProductIds(String message, List<Map<String, Object>> productCatalog, int limit) {
        return findRelatedProductIds(message, productCatalog, limit, STRICT_SCORE_THRESHOLD);
    }

    /** Tìm món liên quan với ngưỡng thấp - khi không có món khớp chính xác. VD: "khô gà lá chanh" -> Khô bò, Khô mực. */
    static List<String> findLooselyRelatedProductIds(String message, List<Map<String, Object>> productCatalog, int limit) {
        return findRelatedProductIds(message, productCatalog, limit, LOOSE_SCORE_THRESHOLD);
    }

    /** Tìm sản phẩm với lọc category và budget. categoryHint: tên category (Hạt, Bánh, Mực...) - chỉ lấy sản phẩm trong category. maxBudgetVnd: ngân sách VND - chỉ lấy sản phẩm có giá <= budget (1 USD ~ 25000 VND). */
    static List<String> findRelatedProductIds(String message, List<Map<String, Object>> productCatalog, int limit,
            String categoryHint, int maxBudgetVnd) {
        List<String> base = findRelatedProductIds(message, productCatalog, limit * 2, STRICT_SCORE_THRESHOLD);
        if (base.isEmpty() && StringUtils.hasText(categoryHint)) {
            String normCat = AiChatTextSupport.normalize(categoryHint);
            base = productCatalog.stream()
                    .filter(item -> {
                        String cat = AiChatTextSupport.normalize(String.valueOf(item.getOrDefault("category", "")));
                        return cat.contains(normCat) || normCat.contains(cat);
                    })
                    .map(item -> String.valueOf(item.get("id")))
                    .toList();
        }
        return filterByCategoryAndBudget(base, productCatalog, categoryHint, maxBudgetVnd, limit);
    }

    static List<String> filterByCategoryAndBudget(List<String> productIds, List<Map<String, Object>> productCatalog,
            String categoryHint, int maxBudgetVnd, int limit) {
        if (productIds.isEmpty()) return List.of();
        Map<String, Map<String, Object>> catalogById = productCatalog.stream()
                .collect(Collectors.toMap(item -> String.valueOf(item.get("id")), item -> item));
        double maxPriceUsd = maxBudgetVnd > 0 ? maxBudgetVnd / 25000.0 : Double.MAX_VALUE;
        String normalizedCategory = StringUtils.hasText(categoryHint) ? AiChatTextSupport.normalize(categoryHint) : "";

        return productIds.stream()
                .map(id -> catalogById.get(id))
                .filter(item -> item != null)
                .filter(item -> {
                    if (StringUtils.hasText(normalizedCategory)) {
                        String cat = AiChatTextSupport.normalize(String.valueOf(item.getOrDefault("category", "")));
                        if (!cat.contains(normalizedCategory) && !normalizedCategory.contains(cat)) return false;
                    }
                    if (maxBudgetVnd > 0) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> variants = (List<Map<String, Object>>) item.get("variants");
                        if (variants == null || variants.isEmpty()) return false;
                        double minPrice = variants.stream()
                                .map(v -> v.get("price"))
                                .filter(p -> p != null)
                                .mapToDouble(p -> ((Number) p).doubleValue())
                                .min().orElse(Double.MAX_VALUE);
                        if (minPrice > maxPriceUsd) return false;
                    }
                    return true;
                })
                .map(item -> String.valueOf(item.get("id")))
                .limit(limit)
                .toList();
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
                    int nameScore = 0;
                    if (name.contains(normalizedMessage) || normalizedMessage.contains(name)) {
                        score += 8;
                        nameScore += 8;
                    }
                    for (String token : tokens) {
                        if (containsWord(name, token)) {
                            score += 3;
                            nameScore += 3;
                        } else if (name.contains(token)) {
                            score += 1;
                            nameScore += 1;
                        }
                        if (category.contains(token))
                            score += 1;
                        if (description.contains(token))
                            score += 1;
                    }
                    return Map.entry(id, new int[]{ score, nameScore });
                })
                .filter(entry -> {
                    int score = entry.getValue()[0];
                    int nameScore = entry.getValue()[1];
                    if (score < minScore) return false;
                    // Khi user hỏi sản phẩm cụ thể (2+ token), bắt buộc phải có match trong TÊN sản phẩm
                    if (tokens.size() >= 2 && nameScore <= 0) return false;
                    return true;
                })
                .sorted((a, b) -> Integer.compare(b.getValue()[0], a.getValue()[0]))
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
