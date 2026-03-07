package com.ecommerce.likefood.cart.service.impl;

import com.ecommerce.likefood.cart.domain.Cart;
import com.ecommerce.likefood.cart.domain.CartItem;
import com.ecommerce.likefood.cart.dto.res.CartRecommendationItemResponse;
import com.ecommerce.likefood.cart.dto.res.CartRecommendationResponse;
import com.ecommerce.likefood.cart.repository.CartRepository;
import com.ecommerce.likefood.cart.service.CartRecommendationService;
import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.common.security.SecurityUtils;
import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductStatus;
import com.ecommerce.likefood.product.domain.ProductVariant;
import com.ecommerce.likefood.product.repository.ProductRepository;
import com.ecommerce.likefood.user.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartRecommendationServiceImpl implements CartRecommendationService {

    private static final String GEMINI_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Value("${likefood.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${likefood.ai.gemini.model:gemini-1.5-pro}")
    private String model;

    @Value("${likefood.ai.gemini.enabled:true}")
    private boolean geminiEnabled;

    private static final int MIN_RECOMMENDATIONS = 2;
    private static final int MAX_RECOMMENDATIONS = 3;

    @Override
    @Transactional(readOnly = true)
    public CartRecommendationResponse getRecommendations() {
        Cart cart = getCurrentUserCart();
        if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
            return CartRecommendationResponse.builder().recommendations(List.of()).build();
        }

        List<Product> allProducts = productRepository.findByStatusOrderByCreatedAtDesc(
                ProductStatus.ACTIVE, org.springframework.data.domain.PageRequest.of(0, 200));
        Set<String> cartProductIds = cart.getItems().stream()
                .map(item -> item.getVariant().getProduct().getId())
                .collect(Collectors.toSet());

        if (geminiEnabled && StringUtils.hasText(apiKey)) {
            String cartJson = buildCartJson(cart);
            String catalogJson = buildCatalogJson(allProducts, cartProductIds);
            String prompt = buildRecommendationPrompt(cartJson, catalogJson);
            try {
                String rawResponse = callGemini(prompt);
                CartRecommendationResponse aiResult = parseAndMapRecommendations(cleanupJson(rawResponse), allProducts, cartProductIds);
                if (aiResult.getRecommendations().size() >= MIN_RECOMMENDATIONS) {
                    return limitRecommendations(aiResult, MAX_RECOMMENDATIONS);
                }
            } catch (Exception e) {
                log.warn("Cart recommendation failed: {}", e.getMessage());
            }
        }
        return fallbackRecommendations(allProducts, cartProductIds, MIN_RECOMMENDATIONS, MAX_RECOMMENDATIONS);
    }

    private CartRecommendationResponse limitRecommendations(CartRecommendationResponse resp, int max) {
        List<CartRecommendationItemResponse> list = resp.getRecommendations();
        if (list.size() <= max) return resp;
        return CartRecommendationResponse.builder()
                .recommendations(new ArrayList<>(list.subList(0, max)))
                .build();
    }

    /** Fallback: chọn 2-3 sản phẩm không có trong giỏ, ưu tiên category bổ sung. */
    private CartRecommendationResponse fallbackRecommendations(List<Product> products, Set<String> excludeIds, int min, int max) {
        List<Product> available = products.stream()
                .filter(p -> !excludeIds.contains(p.getId()))
                .filter(p -> p.getVariants() != null && !p.getVariants().isEmpty())
                .toList();
        if (available.isEmpty()) return CartRecommendationResponse.builder().recommendations(List.of()).build();

        Set<String> cartCategories = new HashSet<>();
        for (String pid : excludeIds) {
            products.stream().filter(p -> p.getId().equals(pid)).findFirst()
                    .ifPresent(p -> {
                        if (p.getCategory() != null && StringUtils.hasText(p.getCategory().getName()))
                            cartCategories.add(p.getCategory().getName());
                    });
        }
        List<String> complementaryOrder = List.of("Bánh", "Mứt", "Hạt", "Mực", "Khô");
        List<Product> sorted = available.stream()
                .sorted((a, b) -> {
                    String catA = a.getCategory() != null ? a.getCategory().getName() : "";
                    String catB = b.getCategory() != null ? b.getCategory().getName() : "";
                    boolean aInCart = cartCategories.contains(catA);
                    boolean bInCart = cartCategories.contains(catB);
                    if (aInCart != bInCart) return aInCart ? 1 : -1;
                    int idxA = complementaryOrder.indexOf(catA);
                    int idxB = complementaryOrder.indexOf(catB);
                    return Integer.compare(idxA < 0 ? 999 : idxA, idxB < 0 ? 999 : idxB);
                })
                .limit(max)
                .toList();

        List<String> compellingReasons = List.of(
                "Giòn thơm, ăn kèm món chính cực đã — nhiều khách mua cùng!",
                "Vị ngọt thanh nhâm nhi tráng miệng — được yêu thích nhất tuần!",
                "Giòn bùi bổ dưỡng — món nhấm nháp không thể thiếu!"
        );
        List<CartRecommendationItemResponse> result = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            Product p = sorted.get(i);
            ProductVariant v = p.getVariants().get(0);
            String reason = i < compellingReasons.size() ? compellingReasons.get(i) : compellingReasons.get(0);
            result.add(CartRecommendationItemResponse.builder()
                    .productId(p.getId())
                    .variantId(v.getId())
                    .productName(p.getName())
                    .category(p.getCategory() != null ? p.getCategory().getName() : "")
                    .variant(formatWeight(v.getWeightValue(), v.getWeightUnit()))
                    .price(v.getPrice())
                    .reason(reason)
                    .imageKey(p.getThumbnailKey())
                    .build());
            if (result.size() >= max) break;
        }
        return CartRecommendationResponse.builder().recommendations(result).build();
    }

    private Cart getCurrentUserCart() {
        String email = SecurityUtils.getCurrentUserLogin().orElse(null);
        if (email == null) return null;
        return userRepository.findByEmail(email)
                .map(user -> cartRepository.findByUser_Id(user.getId()).orElse(null))
                .orElse(null);
    }

    private String buildCartJson(Cart cart) {
        List<Map<String, Object>> items = cart.getItems().stream()
                .map(this::cartItemToMap)
                .toList();
        try {
            return objectMapper.writeValueAsString(Map.of("cartItems", items));
        } catch (IOException e) {
            throw new AppException("Cannot build cart JSON");
        }
    }

    private Map<String, Object> cartItemToMap(CartItem item) {
        ProductVariant v = item.getVariant();
        Product p = v.getProduct();
        String variantStr = formatWeight(v.getWeightValue(), v.getWeightUnit());
        return Map.of(
                "productName", p.getName(),
                "category", p.getCategory() != null ? p.getCategory().getName() : "",
                "variant", variantStr,
                "quantity", item.getQuantity());
    }

    private String buildCatalogJson(List<Product> products, Set<String> excludeProductIds) {
        List<Map<String, Object>> list = products.stream()
                .filter(p -> !excludeProductIds.contains(p.getId()))
                .map(p -> {
                    List<String> variants = p.getVariants().stream()
                            .map(v -> formatWeight(v.getWeightValue(), v.getWeightUnit()))
                            .filter(StringUtils::hasText)
                            .toList();
                    return Map.<String, Object>of(
                            "productName", p.getName(),
                            "category", p.getCategory() != null ? p.getCategory().getName() : "",
                            "variants", variants);
                })
                .toList();
        try {
            return objectMapper.writeValueAsString(list);
        } catch (IOException e) {
            throw new AppException("Cannot build catalog JSON");
        }
    }

    private String formatWeight(BigDecimal value, String unit) {
        if (value == null || unit == null) return "";
        return value.stripTrailingZeros().toPlainString() + unit;
    }

    private String buildRecommendationPrompt(String cartJson, String catalogJson) {
        return """
                You are an AI recommendation engine for LikeFood — a Vietnamese food & snack store.

                === USER'S CURRENT CART ===
                %s
                === END CART ===

                === AVAILABLE PRODUCTS (do NOT recommend items already in cart) ===
                %s
                === END CATALOG ===

                Task: Recommend exactly 2 to 3 additional food items (minimum 2, maximum 3) that pair well with the cart. Rules:
                1. Choose items that complement the existing cart (e.g. Mực + Bánh tráng; Khô + Mứt; snacks combo).
                2. Prefer complementary categories: Bánh (rice paper, cakes), Mứt (jam), Hạt (nuts), Khô (dried meat).
                3. Match variant sizes: if cart has 500g/1kg, recommend similar sizes.
                4. Do NOT recommend items already in the cart.
                5. Only recommend products from the AVAILABLE PRODUCTS list. Use exact productName and variant.
                6. You MUST return at least 2 and at most 3 recommendations.

                Return STRICT JSON only:
                {
                  "recommendations": [
                    {
                      "productName": "exact name from catalog",
                      "category": "category name",
                      "variant": "e.g. 500g or 1kg",
                      "reason": "short compelling reason in Vietnamese that makes customer want to add (e.g. Giòn thơm ăn kèm cực đã!, Vị ngọt thanh nhâm nhi tuyệt vời, Nhiều khách mua kèm giỏ tương tự)"
                    }
                  ]
                }

                Recommend exactly 2-3 items. Use exact productName and variant from the catalog. Write enticing, persuasive reasons in Vietnamese.
                """.formatted(cartJson, catalogJson);
    }

    private String callGemini(String prompt) throws IOException, InterruptedException {
        var requestBody = Map.of(
                "generationConfig", Map.of("temperature", 0.3, "responseMimeType", "application/json"),
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", prompt)))));

        String endpoint = GEMINI_URL_TEMPLATE.formatted(
                URLEncoder.encode(model, StandardCharsets.UTF_8),
                URLEncoder.encode(apiKey, StandardCharsets.UTF_8));

        var request = java.net.http.HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                .build();

        var response = java.net.http.HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build()
                .send(request, java.net.http.HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new AppException("GEMINI_HTTP_" + response.statusCode());
        }

        var root = objectMapper.readTree(response.body());
        var text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText("");
        if (!StringUtils.hasText(text)) throw new AppException("Gemini returned empty content.");
        return text;
    }

    private String cleanupJson(String text) {
        String s = text.trim();
        if (s.startsWith("```")) {
            s = s.replaceFirst("^```json\\s*", "").replaceFirst("^```\\s*", "").replaceFirst("\\s*```$", "");
        }
        return s.trim();
    }

    private CartRecommendationResponse parseAndMapRecommendations(String json, List<Product> products,
            Set<String> excludeProductIds) {
        try {
            Map<String, Object> root = objectMapper.readValue(json, new TypeReference<>() {});
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> recs = (List<Map<String, Object>>) root.get("recommendations");
            if (recs == null || recs.isEmpty()) {
                return CartRecommendationResponse.builder().recommendations(List.of()).build();
            }

            List<CartRecommendationItemResponse> result = new ArrayList<>();
            for (Map<String, Object> r : recs) {
                String productName = String.valueOf(r.getOrDefault("productName", "")).trim();
                String variantStr = String.valueOf(r.getOrDefault("variant", "")).trim();
                String reason = String.valueOf(r.getOrDefault("reason", "")).trim();
                if (!StringUtils.hasText(productName)) continue;

                Product product = findProductByNameAndVariant(products, productName, variantStr);
                if (product == null || excludeProductIds.contains(product.getId())) continue;

                ProductVariant variant = findVariantByWeight(product, variantStr);
                if (variant == null) variant = product.getVariants().isEmpty() ? null : product.getVariants().get(0);
                if (variant == null) continue;

                result.add(CartRecommendationItemResponse.builder()
                        .productId(product.getId())
                        .variantId(variant.getId())
                        .productName(product.getName())
                        .category(product.getCategory() != null ? product.getCategory().getName() : "")
                        .variant(formatWeight(variant.getWeightValue(), variant.getWeightUnit()))
                        .price(variant.getPrice())
                        .reason(reason)
                        .imageKey(product.getThumbnailKey())
                        .build());

                if (result.size() >= 5) break;
            }
            return CartRecommendationResponse.builder().recommendations(result).build();
        } catch (IOException e) {
            log.warn("Parse recommendation JSON failed: {}", e.getMessage());
            return CartRecommendationResponse.builder().recommendations(List.of()).build();
        }
    }

    private Product findProductByNameAndVariant(List<Product> products, String name, String variantStr) {
        String normName = normalize(name);
        for (Product p : products) {
            if (normalize(p.getName()).equals(normName) || p.getName().equalsIgnoreCase(name)) {
                return p;
            }
        }
        for (Product p : products) {
            if (normalize(p.getName()).contains(normName) || normName.contains(normalize(p.getName()))) {
                return p;
            }
        }
        return null;
    }

    private ProductVariant findVariantByWeight(Product product, String variantStr) {
        if (!StringUtils.hasText(variantStr)) return null;
        String norm = normalize(variantStr);
        for (ProductVariant v : product.getVariants()) {
            String w = formatWeight(v.getWeightValue(), v.getWeightUnit());
            if (normalize(w).equals(norm) || w.equalsIgnoreCase(variantStr)) return v;
            if (norm.contains(normalize(w)) || normalize(w).contains(norm)) return v;
        }
        return null;
    }

    private String normalize(String s) {
        if (!StringUtils.hasText(s)) return "";
        return java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]", "");
    }
}
