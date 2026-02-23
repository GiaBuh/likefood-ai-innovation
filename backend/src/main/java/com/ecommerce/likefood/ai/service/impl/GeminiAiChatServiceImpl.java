package com.ecommerce.likefood.ai.service.impl;

import com.ecommerce.likefood.ai.dto.req.AiChatContext;
import com.ecommerce.likefood.ai.dto.req.AiChatRequest;
import com.ecommerce.likefood.ai.dto.res.AiCartInstruction;
import com.ecommerce.likefood.ai.dto.res.AiChatAction;
import com.ecommerce.likefood.ai.dto.res.AiChatResponse;
import com.ecommerce.likefood.ai.service.AiChatService;
import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductVariant;
import com.ecommerce.likefood.product.repository.ProductRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
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
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiAiChatServiceImpl implements AiChatService {

    private static final String GEMINI_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";
    private static final int PRODUCT_CONTEXT_LIMIT = 120;
    private static final int HISTORY_LIMIT = 10;
    private static final int RELATED_PRODUCTS_LIMIT = 4;
    private static final String AWAITING_NONE = "NONE";
    private static final String AWAITING_VARIANT_OR_QUANTITY = "AWAITING_VARIANT_OR_QUANTITY";
    private static final String AWAITING_CHECKOUT = "AWAITING_CHECKOUT";
    private static final Pattern GEMINI_HTTP_STATUS_PATTERN = Pattern.compile("GEMINI_HTTP_(\\d{3})");
    private static final int GEMINI_KEYWORD_LIMIT = 6;
    private static final int CACHE_MAX_SIZE = 500;

    private static final Set<String> NEW_PRODUCT_QUERY_TRIGGERS = Set.of(
            "co ", "mua ", "mon", "san pham", "do you have", "buy ", "product", "tim ", "tim mon",
            "them mon", "goi y", "tu van", "nen mua", "co gi", "mon gi", "menu", "danh sach",
            "gi ngon", "an gi", "dat mon", "recommend", "suggest", "what");

    private static final Set<String> BUY_INTENT_TRIGGERS = Set.of(
            "mua", "them vao gio", "add to cart", "dat mon", "dat hang", "buy", "cho toi ", "cho minh ");

    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final Map<String, CachedAiResponseEntry> responseCache = new ConcurrentHashMap<>();
    private volatile long geminiBlockedUntilMs = 0L;

    @Value("${likefood.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${likefood.ai.gemini.model:gemini-1.5-pro}")
    private String model;

    @Value("${likefood.ai.gemini.enabled:true}")
    private boolean geminiEnabled;

    @Value("${likefood.ai.gemini.retry.max-attempts:3}")
    private int maxRetryAttempts;

    @Value("${likefood.ai.gemini.retry.initial-backoff-ms:700}")
    private long initialBackoffMs;

    @Value("${likefood.ai.gemini.cache.ttl-ms:45000}")
    private long cacheTtlMs;

    @Value("${likefood.ai.gemini.cooldown-ms:180000}")
    private long geminiCooldownMs;

    @Override
    @Transactional(readOnly = true)
    public AiChatResponse respond(AiChatRequest request) {
        try {
            return respondInternal(request);
        } catch (Exception e) {
            log.error("AI respond failed, returning safe fallback. message={}", e.getMessage(), e);
            String lang = "vi";
            if (request != null && StringUtils.hasText(request.getPreferredLanguage())) {
                lang = request.getPreferredLanguage();
            }
            boolean isEn = "en".equalsIgnoreCase(lang);
            return AiChatResponse.builder()
                    .reply(isEn
                            ? "Sorry, the system is temporarily busy. Please try again with a product name (e.g. \"khoai môn cọng 3\")."
                            : "Xin lỗi, hệ thống đang bận. Bạn thử nhập lại tên món (vd: khoai môn cọng 3) để tôi gợi ý nhé.")
                    .refusal(false)
                    .shouldOfferAddToCart(false)
                    .language(lang)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .matchedProductIds(List.of())
                    .actions(List.of())
                    .build();
        }
    }

    private AiChatResponse respondInternal(AiChatRequest request) {
        if (!StringUtils.hasText(apiKey)) {
            throw new AppException("Gemini API key is missing. Please set GEMINI_API_KEY.");
        }

        List<Product> activeProducts = productRepository.findActiveProducts(PRODUCT_CONTEXT_LIMIT);
        Map<String, Product> productById = activeProducts.stream()
                .collect(Collectors.toMap(Product::getId, item -> item));
        List<Map<String, Object>> productCatalog = buildProductCatalog(activeProducts);
        String catalogSummary = AiChatProductSupport.buildCatalogSummary(activeProducts);

        String language = resolveLanguage(request);
        AiChatContext context = sanitizeContext(request.getContext());
        String message = request.getMessage().trim();

        AiChatResponse stateResponse = handleStateDrivenFlow(message, context, productById, language);
        if (stateResponse != null) {
            return stateResponse;
        }

        String cacheKey = buildCacheKey(language, message, context);
        AiChatResponse cachedResponse = getCachedResponse(cacheKey);
        if (cachedResponse != null) {
            return cachedResponse;
        }

        if (geminiEnabled && !isGeminiTemporarilyBlocked()) {
            try {
                GeminiKeywordPlan plan = extractKeywordPlanWithGemini(request, language, catalogSummary);
                AiChatResponse byPlan = buildResponseFromGeminiPlan(plan, message, language, productCatalog,
                        productById);
                if (byPlan != null) {
                    putCachedResponse(cacheKey, byPlan);
                    return byPlan;
                }
                AiChatResponse geminiFallback = buildGeminiPlanFallbackResponse(plan, language, productById);
                putCachedResponse(cacheKey, geminiFallback);
                return geminiFallback;
            } catch (AppException ex) {
                log.warn("Gemini unavailable, fallback to local recommendation. reason={}", ex.getMessage());
            }
        }

        AiChatResponse localFirstResponse = buildLocalFirstResponseIfPossible(message, language, productCatalog,
                productById);
        if (localFirstResponse != null) {
            putCachedResponse(cacheKey, localFirstResponse);
            return localFirstResponse;
        }

        AiChatResponse fallbackResponse = AiChatResponse.builder()
                .reply(t(
                        language,
                        "Em đang tư vấn theo dữ liệu sản phẩm hiện có của shop. Anh/chị cứ hỏi tên món để em gợi ý nhanh nhé.",
                        "I am currently assisting directly from the product catalog. Ask any product name and I will suggest quickly."))
                .refusal(false)
                .shouldOfferAddToCart(false)
                .language(language)
                .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                .matchedProductIds(List.of())
                .actions(List.of())
                .build();
        putCachedResponse(cacheKey, fallbackResponse);
        return fallbackResponse;
    }

    private List<Map<String, Object>> buildProductCatalog(List<Product> products) {
        return AiChatProductSupport.buildProductCatalog(products);
    }

    private String formatWeight(BigDecimal value, String unit) {
        return AiChatProductSupport.formatWeight(value, unit);
    }

    private String buildKeywordPrompt(AiChatRequest request, String language, String catalogSummary) {
        return AiChatPromptSupport.buildKeywordPrompt(request, language, objectMapper, HISTORY_LIMIT, catalogSummary);
    }

    private String resolveLanguage(AiChatRequest request) {
        return AiChatTextSupport.resolveLanguage(request);
    }

    private String callGemini(String prompt, String responseMimeType) {
        try {
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("generationConfig", Map.of(
                    "temperature", 0.4,
                    "responseMimeType", responseMimeType));
            requestBody.put("contents", List.of(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", prompt)))));

            String endpoint = GEMINI_URL_TEMPLATE.formatted(
                    URLEncoder.encode(model, StandardCharsets.UTF_8),
                    URLEncoder.encode(apiKey, StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(25))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new AppException("GEMINI_HTTP_" + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            String text = textNode.asText("");
            if (!StringUtils.hasText(text)) {
                throw new AppException("Gemini returned empty content.");
            }
            return text;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AppException("Gemini request interrupted.");
        } catch (IOException e) {
            throw new AppException("Cannot parse Gemini response: " + e.getMessage());
        }
    }

    private String callGeminiWithRetry(String prompt) {
        return callGeminiWithRetry(prompt, "application/json");
    }

    private String callGeminiWithRetry(String prompt, String responseMimeType) {
        int attempts = Math.max(1, maxRetryAttempts);
        long backoffMs = Math.max(200L, initialBackoffMs);
        AppException lastError = null;

        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                return callGemini(prompt, responseMimeType);
            } catch (AppException ex) {
                lastError = ex;
                Integer status = extractGeminiHttpStatus(ex);
                if (status != null && status == 429) {
                    blockGeminiTemporarily();
                }
                if (!isRetryableGeminiError(ex) || attempt == attempts) {
                    break;
                }
                try {
                    Thread.sleep(backoffMs);
                } catch (InterruptedException interruptedException) {
                    Thread.currentThread().interrupt();
                    throw new AppException("Gemini retry interrupted.");
                }
                backoffMs = Math.min(backoffMs * 2, 5000L);
            }
        }

        if (lastError != null) {
            throw lastError;
        }
        throw new AppException("Gemini request failed unexpectedly.");
    }

    private boolean isRetryableGeminiError(AppException ex) {
        Integer status = extractGeminiHttpStatus(ex);
        if (status == null)
            return false;
        int statusCode = status;
        return statusCode == 429 || statusCode == 500 || statusCode == 502 || statusCode == 503 || statusCode == 504;
    }

    private Integer extractGeminiHttpStatus(AppException ex) {
        Matcher matcher = GEMINI_HTTP_STATUS_PATTERN.matcher(ex.getMessage() == null ? "" : ex.getMessage());
        if (!matcher.find())
            return null;
        return Integer.parseInt(matcher.group(1));
    }

    private void blockGeminiTemporarily() {
        long cooldown = Math.max(10000L, geminiCooldownMs);
        geminiBlockedUntilMs = System.currentTimeMillis() + cooldown;
    }

    private boolean isGeminiTemporarilyBlocked() {
        return System.currentTimeMillis() < geminiBlockedUntilMs;
    }

    private GeminiKeywordPlan extractKeywordPlanWithGemini(AiChatRequest request, String language,
            String catalogSummary) {
        String prompt = buildKeywordPrompt(request, language, catalogSummary);
        String rawGeminiText = callGeminiWithRetry(prompt);
        String clean = cleanupJson(rawGeminiText);
        try {
            Map<String, Object> map = objectMapper.readValue(clean, new TypeReference<>() {
            });
            String reply = String.valueOf(map.getOrDefault("reply", ""));
            boolean refusal = Boolean.parseBoolean(String.valueOf(map.getOrDefault("refusal", "false")));
            List<String> intents = toStringList(map.get("intents")).stream()
                    .map(item -> item.trim().toUpperCase())
                    .toList();
            List<String> keywords = toStringList(map.get("keywords")).stream()
                    .map(this::normalize)
                    .filter(StringUtils::hasText)
                    .distinct()
                    .limit(GEMINI_KEYWORD_LIMIT)
                    .toList();
            String outputLanguage = String.valueOf(map.getOrDefault("language", language));
            if (!"en".equalsIgnoreCase(outputLanguage)) {
                outputLanguage = "vi";
            } else {
                outputLanguage = "en";
            }
            Integer quantity = parseQuantityFromPlan(map.get("quantity"));
            String variantHint = String.valueOf(map.getOrDefault("variantHint", "")).trim();
            return new GeminiKeywordPlan(reply, refusal, intents, keywords, quantity, variantHint, outputLanguage);
        } catch (IOException e) {
            throw new AppException("Gemini keyword JSON parse failed.");
        }
    }

    private Integer parseQuantityFromPlan(Object raw) {
        if (raw == null) return null;
        if (raw instanceof Number n) {
            int v = n.intValue();
            return (v >= 1 && v <= 99) ? v : null;
        }
        try {
            int v = Integer.parseInt(String.valueOf(raw).trim());
            return (v >= 1 && v <= 99) ? v : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private List<String> toStringList(Object rawValue) {
        return AiChatPromptSupport.toStringList(rawValue);
    }

    private String cleanupJson(String text) {
        return AiChatPromptSupport.cleanupJson(text);
    }

    private List<String> findRelatedProductIds(String message, List<Map<String, Object>> productCatalog, int limit) {
        return AiChatProductSupport.findRelatedProductIds(message, productCatalog, limit);
    }

    private List<String> findLooselyRelatedProductIds(String message, List<Map<String, Object>> productCatalog, int limit) {
        return AiChatProductSupport.findLooselyRelatedProductIds(message, productCatalog, limit);
    }

    private String normalize(String value) {
        return AiChatTextSupport.normalize(value);
    }

    private AiChatContext sanitizeContext(AiChatContext context) {
        if (context == null) {
            return AiChatContext.builder().awaiting(AWAITING_NONE).build();
        }
        String awaiting = StringUtils.hasText(context.getAwaiting()) ? context.getAwaiting().trim() : AWAITING_NONE;
        return AiChatContext.builder()
                .selectedProductId(context.getSelectedProductId())
                .selectedVariantId(context.getSelectedVariantId())
                .awaiting(awaiting)
                .build();
    }

    private AiChatResponse handleStateDrivenFlow(
            String message,
            AiChatContext context,
            Map<String, Product> productById,
            String language) {
        ParsedCommand command = parseCommand(message);
        if ("open-product".equals(command.name)) {
            return null;
        }

        if (AWAITING_VARIANT_OR_QUANTITY.equals(context.getAwaiting())) {
            return handleVariantQuantityState(message, command, context, productById, language);
        }

        if (AWAITING_CHECKOUT.equals(context.getAwaiting())) {
            return handleCheckoutState(message, command, context, language);
        }

        if ("buy-product".equals(command.name) || "choose-product".equals(command.name)) {
            Product product = productById.get(command.arg);
            if (product == null) {
                return AiChatResponse.builder()
                        .reply(t(language, "Sản phẩm không tồn tại, bạn vui lòng chọn món khác nhé.",
                                "The product does not exist, please choose another one."))
                        .language(language)
                        .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                        .actions(List.of())
                        .build();
            }
            return buildAskVariantOrQuantityResponse(product, language);
        }

        return null;
    }

    private AiChatResponse handleVariantQuantityState(
            String message,
            ParsedCommand command,
            AiChatContext context,
            Map<String, Product> productById,
            String language) {
        Product selectedProduct = productById.get(context.getSelectedProductId());
        if (selectedProduct == null) {
            return AiChatResponse.builder()
                    .reply(t(language, "Mình bị mất ngữ cảnh món đã chọn. Bạn chọn lại sản phẩm giúp mình nhé.",
                            "I lost the selected product context. Please choose a product again."))
                    .language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of())
                    .build();
        }

        String variantId = context.getSelectedVariantId();
        if ("choose-variant".equals(command.name)) {
            variantId = command.arg;
        }
        if (!StringUtils.hasText(variantId)) {
            ProductVariant parsedVariant = parseVariantFromMessage(message, selectedProduct).orElse(null);
            if (parsedVariant != null) {
                variantId = parsedVariant.getId();
            }
        }

        Integer quantity = null;
        if ("choose-qty".equals(command.name)) {
            quantity = parsePositiveInt(command.arg);
        } else if (!StringUtils.hasText(command.name)) {
            quantity = parseQuantity(message);
        }

        if (shouldInterruptVariantQuantityFlow(message, command, selectedProduct, variantId, quantity)) {
            return null;
        }

        if (!StringUtils.hasText(variantId)) {
            return askVariantOnly(selectedProduct, language);
        }
        final String finalVariantId = variantId;
        ProductVariant variant = selectedProduct.getVariants().stream()
                .filter(item -> item.getId().equals(finalVariantId))
                .findFirst()
                .orElse(null);
        if (variant == null) {
            return askVariantOnly(selectedProduct, language);
        }

        if (quantity == null) {
            return askQuantityOnly(selectedProduct, variant, language);
        }

        AiCartInstruction instruction = AiCartInstruction.builder()
                .productId(selectedProduct.getId())
                .variantId(variant.getId())
                .quantity(quantity)
                .build();

        List<AiChatAction> actions = List.of(
                AiChatAction.builder()
                        .type("go-checkout")
                        .label(t(language, "Di den thanh toan", "Go to Checkout"))
                        .command("/go-checkout")
                        .build(),
                AiChatAction.builder()
                        .type("view-orders")
                        .label(t(language, "Xem don hang", "View Orders"))
                        .command("/view-orders")
                        .build());
        return AiChatResponse.builder()
                .reply(t(
                        language,
                        "Đã thêm %s x %s (%s) vào giỏ hàng. Bạn muốn thanh toán ngay không?"
                                .formatted(quantity, selectedProduct.getName(),
                                        formatWeight(variant.getWeightValue(), variant.getWeightUnit())),
                        "Added %s x %s (%s) to cart. Do you want to checkout now?"
                                .formatted(quantity, selectedProduct.getName(),
                                        formatWeight(variant.getWeightValue(), variant.getWeightUnit()))))
                .language(language)
                .nextContext(AiChatContext.builder()
                        .selectedProductId(selectedProduct.getId())
                        .selectedVariantId(variant.getId())
                        .awaiting(AWAITING_CHECKOUT)
                        .build())
                .cartInstruction(instruction)
                .actions(actions)
                .matchedProductIds(List.of(selectedProduct.getId()))
                .build();
    }

    private AiChatResponse handleCheckoutState(String message, ParsedCommand command, AiChatContext context,
            String language) {
        if ("/continue".equals(message.trim())) {
            return AiChatResponse.builder()
                    .reply(t(language, "Được rồi, mình sẽ giữ giỏ hàng để bạn tiếp tục mua sắm.",
                            "Okay, your cart is saved for later shopping."))
                    .language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of())
                    .build();
        }
        if (shouldInterruptCheckoutFlow(message, command)) {
            return null;
        }
        String normalized = normalize(message);
        if (isAffirmative(normalized) || "/go-checkout".equals(message.trim())) {
            return AiChatResponse.builder()
                    .reply(t(language, "Bạn bấm nút bên dưới để chuyển đến trang thanh toán nhé.",
                            "Tap the button below to continue to checkout."))
                    .language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of(
                            AiChatAction.builder()
                                    .type("go-checkout")
                                    .label(t(language, "Di den thanh toan", "Go to Checkout"))
                                    .command("/go-checkout")
                                    .build()))
                    .build();
        }
        if (isNegative(normalized)) {
            return AiChatResponse.builder()
                    .reply(t(language, "Được rồi, mình sẽ giữ giỏ hàng để bạn tiếp tục mua sắm.",
                            "Okay, your cart is saved for later shopping."))
                    .language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of())
                    .build();
        }
        return AiChatResponse.builder()
                .reply(t(language, "Bạn muốn thanh toán ngay không? Bạn có thể bấm một trong các nút bên dưới.",
                        "Would you like to checkout now? You can tap a button below."))
                .language(language)
                .nextContext(context)
                .actions(List.of(
                        AiChatAction.builder().type("go-checkout")
                                .label(t(language, "Di den thanh toan", "Go to Checkout")).command("/go-checkout")
                                .build(),
                        AiChatAction.builder().type("continue-shopping")
                                .label(t(language, "Mua them", "Continue shopping")).command("/continue").build()))
                .build();
    }

    private boolean shouldInterruptVariantQuantityFlow(
            String message,
            ParsedCommand command,
            Product selectedProduct,
            String variantId,
            Integer quantity) {
        if (StringUtils.hasText(command.name))
            return false;
        String normalized = normalize(message);
        if (!StringUtils.hasText(normalized))
            return false;
        if (quantity != null)
            return false;

        if (!StringUtils.hasText(variantId)) {
            ProductVariant parsedVariant = parseVariantFromMessage(message, selectedProduct).orElse(null);
            if (parsedVariant != null)
                return false;
        }

        if (isAffirmative(normalized) || isNegative(normalized))
            return false;
        if (parsePositiveInt(normalized) != null)
            return false;
        return normalized.length() >= 4;
    }

    private boolean shouldInterruptCheckoutFlow(String message, ParsedCommand command) {
        if (StringUtils.hasText(command.name))
            return false;
        String normalized = normalize(message);
        if (!StringUtils.hasText(normalized))
            return false;
        if (isPotentialNewProductQuery(normalized))
            return true;
        if (normalized.split(" ").length > 3)
            return true;
        if (isAffirmative(normalized) || isNegative(normalized))
            return false;
        return false;
    }

    private boolean isPotentialNewProductQuery(String normalized) {
        return NEW_PRODUCT_QUERY_TRIGGERS.stream().anyMatch(normalized::contains);
    }

    /**
     * Xử lý khi user có ý mua với 1 sản phẩm. Hỗ trợ cả Gemini plan (quantity, variantHint) và parse từ message.
     * VD: "tôi muốn mua khô bò số lượng là 2", "I want to buy beef jerky, quantity is 2"
     */
    private AiChatResponse buildBuyIntentResponse(Product product, String message, String language) {
        return buildBuyIntentResponse(product, message, language, null);
    }

    private AiChatResponse buildBuyIntentResponse(Product product, String message, String language,
            GeminiKeywordPlan plan) {
        if (product.getVariants() == null || product.getVariants().isEmpty()) {
            return buildAskVariantOrQuantityResponse(product, language);
        }
        Integer quantity = plan != null ? plan.quantity() : null;
        if (quantity == null) quantity = parseQuantity(message);
        String variantHint = plan != null && StringUtils.hasText(plan.variantHint()) ? plan.variantHint() : null;
        Optional<ProductVariant> parsedVariant = variantHint != null
                ? findVariantByHint(product, variantHint)
                : parseVariantFromMessage(message, product);

        if (parsedVariant.isPresent() && quantity != null) {
            return buildAddToCartResponse(product, parsedVariant.get(), quantity, language);
        }
        if (parsedVariant.isPresent()) {
            return askQuantityOnly(product, parsedVariant.get(), language);
        }
        if (quantity != null && product.getVariants().size() == 1) {
            ProductVariant singleVariant = product.getVariants().getFirst();
            return buildAddToCartResponse(product, singleVariant, quantity, language);
        }
        return buildAskVariantOrQuantityResponse(product, language);
    }

    private Optional<ProductVariant> findVariantByHint(Product product, String hint) {
        if (product.getVariants() == null || !StringUtils.hasText(hint)) return Optional.empty();
        String normalizedHint = normalize(hint);
        return product.getVariants().stream()
                .filter(v -> normalizedHint.contains(normalize(formatWeight(v.getWeightValue(), v.getWeightUnit())))
                        || normalize(formatWeight(v.getWeightValue(), v.getWeightUnit())).contains(normalizedHint))
                .findFirst();
    }

    private AiChatResponse buildAddToCartResponse(Product product, ProductVariant variant, int quantity,
            String language) {
        AiCartInstruction instruction = AiCartInstruction.builder()
                .productId(product.getId())
                .variantId(variant.getId())
                .quantity(quantity)
                .build();
        List<AiChatAction> actions = List.of(
                AiChatAction.builder()
                        .type("go-checkout")
                        .label(t(language, "Di den thanh toan", "Go to Checkout"))
                        .command("/go-checkout")
                        .build(),
                AiChatAction.builder()
                        .type("view-orders")
                        .label(t(language, "Xem don hang", "View Orders"))
                        .command("/view-orders")
                        .build());
        String variantLabel = formatWeight(variant.getWeightValue(), variant.getWeightUnit());
        return AiChatResponse.builder()
                .reply(t(
                        language,
                        "Đã thêm %s x %s (%s) vào giỏ hàng. Bạn muốn thanh toán ngay không?"
                                .formatted(quantity, product.getName(), variantLabel),
                        "Added %s x %s (%s) to cart. Do you want to checkout now?"
                                .formatted(quantity, product.getName(), variantLabel)))
                .language(language)
                .nextContext(AiChatContext.builder()
                        .selectedProductId(product.getId())
                        .selectedVariantId(variant.getId())
                        .awaiting(AWAITING_CHECKOUT)
                        .build())
                .cartInstruction(instruction)
                .actions(actions)
                .matchedProductIds(List.of(product.getId()))
                .build();
    }

    private AiChatResponse buildAskVariantOrQuantityResponse(Product product, String language) {
        if (product.getVariants() == null || product.getVariants().isEmpty()) {
            return AiChatResponse.builder()
                    .reply(t(language, "San pham nay chua co quy cach hop le.",
                            "This product has no valid variants yet."))
                    .language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of())
                    .build();
        }

        List<AiChatAction> variantActions = product.getVariants().stream()
                .limit(6)
                .map(variant -> AiChatAction.builder()
                        .type("choose-variant")
                        .label(formatWeight(variant.getWeightValue(), variant.getWeightUnit()))
                        .command("/choose-variant:" + variant.getId())
                        .productId(product.getId())
                        .variantId(variant.getId())
                        .build())
                .toList();

        List<AiChatAction> allActions = new ArrayList<>();
        allActions.addAll(variantActions);
        allActions.add(AiChatAction.builder()
                .type("open-product")
                .label(t(language, "Xem chi tiet", "View details"))
                .command("/open-product:" + product.getId())
                .productId(product.getId())
                .build());

        String variantLabels = product.getVariants().stream()
                .map(v -> formatWeight(v.getWeightValue(), v.getWeightUnit()))
                .collect(Collectors.joining(", "));
        String fallbackReply = t(
                language,
                "Ve %s, ben minh co cac quy cach: %s. Ban chon giup em loai truoc nhe."
                        .formatted(product.getName(), variantLabels),
                "For %s, available variants are: %s. Please choose a variant first."
                        .formatted(product.getName(), variantLabels));
        String aiReply = generateConversationalReply(
                language,
                "Ask customer to choose product variant first for product %s with variants: %s. Do not ask quantity in this step."
                        .formatted(product.getName(), variantLabels),
                fallbackReply);

        return AiChatResponse.builder()
                .reply(aiReply)
                .language(language)
                .nextContext(AiChatContext.builder()
                        .selectedProductId(product.getId())
                        .awaiting(AWAITING_VARIANT_OR_QUANTITY)
                        .build())
                .matchedProductIds(List.of(product.getId()))
                .actions(allActions)
                .build();
    }

    private AiChatResponse askVariantOnly(Product product, String language) {
        List<AiChatAction> actions = product.getVariants().stream()
                .limit(6)
                .map(variant -> AiChatAction.builder()
                        .type("choose-variant")
                        .label(formatWeight(variant.getWeightValue(), variant.getWeightUnit()))
                        .command("/choose-variant:" + variant.getId())
                        .productId(product.getId())
                        .variantId(variant.getId())
                        .build())
                .toList();

        String variantLabels = product.getVariants().stream()
                .map(v -> formatWeight(v.getWeightValue(), v.getWeightUnit()))
                .collect(Collectors.joining(", "));
        String fallbackReply = t(
                language,
                "Bạn chọn giúp mình quy cách trước nhé (ví dụ: 300g, 500g, 1kg).",
                "Please choose a variant (e.g. 300g, 500g, 1kg).");
        String aiReply = generateConversationalReply(
                language,
                "Customer already selected product %s. Ask customer to choose variant among: %s."
                        .formatted(product.getName(), variantLabels),
                fallbackReply);
        return AiChatResponse.builder()
                .reply(aiReply)
                .language(language)
                .nextContext(AiChatContext.builder()
                        .selectedProductId(product.getId())
                        .awaiting(AWAITING_VARIANT_OR_QUANTITY)
                        .build())
                .actions(actions)
                .build();
    }

    private AiChatResponse askQuantityOnly(Product product, ProductVariant variant, String language) {
        List<AiChatAction> actions = List.of(
                AiChatAction.builder().type("choose-qty").label("1").command("/choose-qty:1").productId(product.getId()).variantId(variant.getId()).quantity(1).build(),
                AiChatAction.builder().type("choose-qty").label("2").command("/choose-qty:2").productId(product.getId()).variantId(variant.getId()).quantity(2).build(),
                AiChatAction.builder().type("choose-qty").label("3").command("/choose-qty:3").productId(product.getId()).variantId(variant.getId()).quantity(3).build());
        String variantLabel = formatWeight(variant.getWeightValue(), variant.getWeightUnit());
        String fallbackReply = t(
                language,
                "Bạn muốn mua %s (%s) với số lượng bao nhiêu? Bạn có thể bấm 1/2/3 hoặc tự nhập số lượng."
                        .formatted(product.getName(), variantLabel),
                "How many of %s (%s) would you like? You can tap 1/2/3 or type quantity."
                        .formatted(product.getName(), variantLabel));
        String aiReply = generateConversationalReply(
                language,
                "Customer selected product %s variant %s. Ask quantity only in this step. Offer quick options 1/2/3 and allow typed quantity."
                        .formatted(product.getName(), variantLabel),
                fallbackReply);
        return AiChatResponse.builder()
                .reply(aiReply)
                .language(language)
                .nextContext(AiChatContext.builder()
                        .selectedProductId(product.getId())
                        .selectedVariantId(variant.getId())
                        .awaiting(AWAITING_VARIANT_OR_QUANTITY)
                        .build())
                .actions(actions)
                .build();
    }

    private List<AiChatAction> buildProductListActions(List<Product> products, String language) {
        return buildProductListActions(products, language, false);
    }

    private List<AiChatAction> buildProductListActions(List<Product> products, String language, boolean buyIntentFirst) {
        List<AiChatAction> actions = new ArrayList<>();
        for (Product product : products.stream().limit(RELATED_PRODUCTS_LIMIT).toList()) {
            AiChatAction openAction = AiChatAction.builder()
                    .type("open-product")
                    .label(t(language, "Xem " + product.getName(), "View " + product.getName()))
                    .command("/open-product:" + product.getId())
                    .productId(product.getId())
                    .build();
            AiChatAction buyAction = AiChatAction.builder()
                    .type("buy-product")
                    .label(t(language, "Mua " + product.getName(), "Buy " + product.getName()))
                    .command("/buy-product:" + product.getId())
                    .productId(product.getId())
                    .build();
            if (buyIntentFirst) {
                actions.add(buyAction);
                actions.add(openAction);
            } else {
                actions.add(openAction);
                actions.add(buyAction);
            }
        }
        return actions;
    }

    private boolean isBuyIntent(String normalized) {
        if (!StringUtils.hasText(normalized)) return false;
        return BUY_INTENT_TRIGGERS.stream().anyMatch(normalized::contains);
    }

    private List<Product> pickFeaturedProducts(List<Product> products, int limit) {
        return AiChatProductSupport.pickFeaturedProducts(products, limit);
    }

    private AiChatResponse buildLocalFirstResponseIfPossible(
            String message,
            String language,
            List<Map<String, Object>> productCatalog,
            Map<String, Product> productById) {
        String normalized = normalize(message);
        if (!StringUtils.hasText(normalized) || normalized.length() < 2) {
            return AiChatResponse.builder()
                    .reply(t(language, "Anh/chị cứ hỏi tên món, em sẽ gợi ý ngay.",
                            "Ask any product name and I will suggest right away."))
                    .language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of()).build();
        }

        boolean isThanks = normalized.contains("cam on") || normalized.contains("thank")
                || normalized.equals("ok cam on") || normalized.contains("thanks");
        if (isThanks) {
            return AiChatResponse.builder()
                    .reply(t(language,
                            "Cảm ơn anh/chị đã ghé thăm LikeFood! Nếu cần thêm gì cứ nhắn em nhé. Chúc anh/chị ngon miệng!",
                            "Thank you for visiting LikeFood! If you need anything else, just let me know. Enjoy!"))
                    .refusal(false).shouldOfferAddToCart(false).language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of()).matchedProductIds(List.of()).build();
        }

        boolean isHelp = normalized.contains("giup do") || normalized.contains("huong dan")
                || normalized.contains("lam duoc gi") || normalized.equals("help")
                || normalized.contains("ho tro") || normalized.contains("what can you do");
        if (isHelp) {
            return AiChatResponse.builder()
                    .reply(t(language,
                            "Em có thể giúp anh/chị:\n• Tìm và gợi ý các món ăn vặt, đặc sản\n• Xem giá, quy cách\n• Thêm sản phẩm vào giỏ hàng\n• Hỗ trợ thanh toán\nAnh/chị cứ hỏi tên món hoặc nói \"gợi ý\" để em tư vấn nhé!",
                            "I can help you:\n• Find and suggest snacks & specialty food\n• Check prices, variants\n• Add products to your cart\n• Assist with checkout\nJust ask a product name or say \"suggest\"!"))
                    .refusal(false).shouldOfferAddToCart(false).language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of()).matchedProductIds(List.of()).build();
        }

        boolean isBrowseIntent = normalized.contains("co gi") || normalized.contains("mon gi")
                || normalized.contains("menu") || normalized.contains("danh sach")
                || normalized.contains("gi ngon") || normalized.contains("an gi")
                || normalized.contains("hom nay") || normalized.contains("goi y")
                || normalized.contains("tu van") || normalized.contains("nen mua")
                || normalized.contains("recommend") || normalized.contains("suggest");
        boolean isPureGreeting = !isBrowseIntent && (normalized.equals("xin chao")
                || normalized.equals("chao") || normalized.equals("hello") || normalized.equals("hi")
                || normalized.startsWith("chao ") || normalized.startsWith("xin chao "));

        if (isPureGreeting) {
            return AiChatResponse.builder()
                    .reply(t(language,
                            "Xin chào! Em là trợ lý bán hàng của LikeFood. Hôm nay anh/chị muốn tìm món gì ạ?",
                            "Hello! I'm LikeFood's shopping assistant. What are you looking for today?"))
                    .refusal(false).shouldOfferAddToCart(false).language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of()).matchedProductIds(List.of()).build();
        }

        if (isBrowseIntent) {
            List<Product> featured = pickFeaturedProducts(new ArrayList<>(productById.values()), RELATED_PRODUCTS_LIMIT);
            return AiChatResponse.builder()
                    .reply(t(language,
                            "Hiện tại shop có các món nổi bật: %s. Bạn muốn xem món nào trước ạ?"
                                    .formatted(featured.isEmpty() ? "chưa có sản phẩm" : joinProductNames(featured)),
                            "Here are our featured items: %s. Which one interests you?"
                                    .formatted(featured.isEmpty() ? "no products yet" : joinProductNames(featured))))
                    .refusal(false).shouldOfferAddToCart(false).language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .matchedProductIds(featured.stream().map(Product::getId).toList())
                    .actions(buildProductListActions(featured, language, false)).build();
        }

        List<String> matchedIds = findRelatedProductIds(message, productCatalog, RELATED_PRODUCTS_LIMIT);
        if (matchedIds.isEmpty()) {
            List<String> looselyRelatedIds = findLooselyRelatedProductIds(message, productCatalog, RELATED_PRODUCTS_LIMIT);
            List<Product> relatedProducts = looselyRelatedIds.stream()
                    .map(productById::get).filter(item -> item != null).toList();
            if (!relatedProducts.isEmpty()) {
                return AiChatResponse.builder()
                        .reply(t(language,
                                "Hiện tại bên em không có món đó nhưng em có các món liên quan sau: %s. Anh/chị muốn xem món nào ạ?"
                                        .formatted(joinProductNames(relatedProducts)),
                                "We don't have that item, but here are related products: %s. Which one would you like to view?"
                                        .formatted(joinProductNames(relatedProducts))))
                        .refusal(false).shouldOfferAddToCart(false).language(language)
                        .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                        .matchedProductIds(relatedProducts.stream().map(Product::getId).toList())
                        .actions(buildProductListActions(relatedProducts, language, false)).build();
            }
            List<Product> featured = pickFeaturedProducts(new ArrayList<>(productById.values()), RELATED_PRODUCTS_LIMIT);
            return AiChatResponse.builder()
                    .reply(t(language,
                            "Hiện tại bên em không có món đó. Em gợi ý các món đang có: %s."
                                    .formatted(featured.isEmpty() ? "chưa có sản phẩm" : joinProductNames(featured)),
                            "We don't have that item. Here are our available products: %s."
                                    .formatted(featured.isEmpty() ? "no products yet" : joinProductNames(featured))))
                    .refusal(false).shouldOfferAddToCart(false).language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .matchedProductIds(featured.stream().map(Product::getId).toList())
                    .actions(buildProductListActions(featured, language, false)).build();
        }

        List<Product> matchedProducts = matchedIds.stream()
                .map(productById::get).filter(item -> item != null).toList();
        if (matchedProducts.isEmpty()) return null;

        if (isBuyIntent(normalized) && matchedProducts.size() == 1) {
            return buildBuyIntentResponse(matchedProducts.getFirst(), message, language);
        }

        boolean buyIntent = isBuyIntent(normalized);
        return AiChatResponse.builder()
                .reply(t(language,
                        buyIntent
                                ? "Bạn muốn mua à? Em có các món: %s. Chọn quy cách để mua nhé!"
                                        .formatted(joinProductNames(matchedProducts))
                                : "Em tìm thấy các món liên quan: %s. Anh/chị muốn xem món nào ạ?"
                                        .formatted(joinProductNames(matchedProducts)),
                        buyIntent
                                ? "You want to buy? I have: %s. Choose a variant to add to cart!"
                                        .formatted(joinProductNames(matchedProducts))
                                : "I found related products: %s. Which one would you like to view?"
                                        .formatted(joinProductNames(matchedProducts))))
                .refusal(false).shouldOfferAddToCart(false).language(language)
                .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                .matchedProductIds(matchedProducts.stream().map(Product::getId).toList())
                .actions(buildProductListActions(matchedProducts, language, buyIntent)).build();
    }

    private AiChatResponse buildResponseFromGeminiPlan(
            GeminiKeywordPlan plan,
            String message,
            String fallbackLanguage,
            List<Map<String, Object>> productCatalog,
            Map<String, Product> productById) {
        String language = StringUtils.hasText(plan.language) ? plan.language : fallbackLanguage;
        boolean greeting = plan.intents.contains("GREETING");
        boolean recommendation = plan.intents.contains("RECOMMENDATION");
        boolean browse = plan.intents.contains("BROWSE");
        boolean buy = plan.intents.contains("BUY");
        boolean productQuery = plan.intents.contains("PRODUCT_QUERY");
        boolean productDetail = plan.intents.contains("PRODUCT_DETAIL");
        boolean thanks = plan.intents.contains("THANKS");
        boolean help = plan.intents.contains("HELP");
        boolean outOfDomain = plan.intents.contains("OUT_OF_DOMAIN");

        if (!productQuery && !plan.keywords.isEmpty()) {
            productQuery = true;
        }

        if (thanks) {
            String reply = StringUtils.hasText(plan.reply)
                    ? plan.reply
                    : t(language,
                            "Cảm ơn anh/chị đã ghé thăm LikeFood! Nếu cần thêm gì cứ nhắn em nhé. Chúc anh/chị ngon miệng! 😊",
                            "Thank you for visiting LikeFood! If you need anything else, just let me know. Enjoy! 😊");
            return AiChatResponse.builder()
                    .reply(reply).refusal(false).shouldOfferAddToCart(false).language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of()).matchedProductIds(List.of()).build();
        }

        if (help) {
            String reply = StringUtils.hasText(plan.reply)
                    ? plan.reply
                    : t(language,
                            "Em có thể giúp anh/chị:\n• Tìm và gợi ý các món ăn vặt, đặc sản\n• Xem giá, quy cách (300g, 500g, 1kg...)\n• Thêm sản phẩm vào giỏ hàng\n• Hỗ trợ thanh toán\nAnh/chị cứ hỏi tên món hoặc nói \"gợi ý\" để em tư vấn nhé!",
                            "I can help you:\n• Find and suggest snacks & specialty food\n• Check prices, variants (300g, 500g, 1kg...)\n• Add products to your cart\n• Assist with checkout\nJust ask a product name or say \"suggest\" and I'll help!");
            return AiChatResponse.builder()
                    .reply(reply).refusal(false).shouldOfferAddToCart(false).language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of()).matchedProductIds(List.of()).build();
        }

        if (outOfDomain && !productQuery && !greeting && !recommendation && !browse && !productDetail) {
            return AiChatResponse.builder()
                    .reply(StringUtils.hasText(plan.reply)
                            ? plan.reply
                            : t(language, "Xin lỗi, em chỉ hỗ trợ tư vấn sản phẩm và đặt hàng thôi ạ. Anh/chị hỏi về món ăn để em giúp nhé!",
                                    "Sorry, I only support product consultation and ordering. Ask me about food products and I'll help!"))
                    .refusal(true).shouldOfferAddToCart(false).language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of()).matchedProductIds(List.of()).build();
        }

        if (greeting && !browse && !recommendation && !productQuery && !productDetail && plan.keywords.isEmpty()) {
            String reply = StringUtils.hasText(plan.reply) ? plan.reply
                    : t(language,
                            "Xin chào! Em là trợ lý bán hàng của LikeFood. Hôm nay anh/chị muốn tìm món gì ạ?",
                            "Hello! I'm LikeFood's shopping assistant. What are you looking for today?");
            return AiChatResponse.builder()
                    .reply(reply).refusal(false).shouldOfferAddToCart(false).language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .actions(List.of()).matchedProductIds(List.of()).build();
        }

        String lookup = plan.keywords.isEmpty() ? message : (message + " " + String.join(" ", plan.keywords));
        List<String> matchedIds = findRelatedProductIds(lookup, productCatalog, RELATED_PRODUCTS_LIMIT);
        List<Product> matchedProducts = matchedIds.stream()
                .map(productById::get).filter(item -> item != null).toList();

        if (productDetail && !matchedProducts.isEmpty()) {
            Product detailProduct = matchedProducts.getFirst();
            String detailText = AiChatProductSupport.buildProductDetailText(detailProduct, language);
            String reply = StringUtils.hasText(plan.reply)
                    ? plan.reply + "\n\n" + detailText
                    : t(language,
                            "Thông tin chi tiết sản phẩm:\n" + detailText,
                            "Product details:\n" + detailText);
            List<AiChatAction> actions = new ArrayList<>();
            actions.add(AiChatAction.builder().type("buy-product")
                    .label(t(language, "Mua " + detailProduct.getName(), "Buy " + detailProduct.getName()))
                    .command("/buy-product:" + detailProduct.getId()).productId(detailProduct.getId()).build());
            actions.add(AiChatAction.builder().type("open-product")
                    .label(t(language, "Xem chi tiết", "View details"))
                    .command("/open-product:" + detailProduct.getId()).productId(detailProduct.getId()).build());
            return AiChatResponse.builder()
                    .reply(reply).refusal(false).shouldOfferAddToCart(false).language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .matchedProductIds(List.of(detailProduct.getId())).actions(actions).build();
        }

        if (greeting || recommendation || browse) {
            if (!matchedProducts.isEmpty()) {
                String reply = StringUtils.hasText(plan.reply) ? plan.reply
                        : t(language,
                                "Chào bạn! Em tìm thấy các món liên quan: %s."
                                        .formatted(joinProductNames(matchedProducts)),
                                "Hello! I found related products: %s."
                                        .formatted(joinProductNames(matchedProducts)));
                return AiChatResponse.builder()
                        .reply(reply).refusal(false).shouldOfferAddToCart(false).language(language)
                        .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                        .matchedProductIds(matchedProducts.stream().map(Product::getId).toList())
                        .actions(buildProductListActions(matchedProducts, language, buy)).build();
            }
            List<Product> featured = pickFeaturedProducts(new ArrayList<>(productById.values()), RELATED_PRODUCTS_LIMIT);
            if (featured.isEmpty()) return null;
            String reply = StringUtils.hasText(plan.reply) ? plan.reply
                    : t(language,
                            "Chào bạn! Hiện tại shop có các món nổi bật: %s. Bạn muốn xem món nào ạ?"
                                    .formatted(joinProductNames(featured)),
                            "Hello! Here are our featured items: %s. Which one interests you?"
                                    .formatted(joinProductNames(featured)));
            return AiChatResponse.builder()
                    .reply(reply).refusal(false).shouldOfferAddToCart(false).language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .matchedProductIds(featured.stream().map(Product::getId).toList())
                    .actions(buildProductListActions(featured, language, buy)).build();
        }

        if (matchedProducts.isEmpty()) {
            if (!productQuery) return null;
            List<String> looselyRelatedIds = findLooselyRelatedProductIds(lookup, productCatalog, RELATED_PRODUCTS_LIMIT);
            List<Product> relatedProducts = looselyRelatedIds.stream()
                    .map(productById::get).filter(item -> item != null).toList();
            List<Product> productsToShow = relatedProducts.isEmpty()
                    ? pickFeaturedProducts(new ArrayList<>(productById.values()), RELATED_PRODUCTS_LIMIT)
                    : relatedProducts;
            boolean isRelated = !relatedProducts.isEmpty();
            String reply = StringUtils.hasText(plan.reply) ? plan.reply
                    : t(language,
                            isRelated
                                    ? "Hiện tại bên em không có món đó nhưng em có các món liên quan sau: %s. Anh/chị muốn xem món nào ạ?"
                                            .formatted(joinProductNames(productsToShow))
                                    : "Hiện tại bên em không có món đó. Em gợi ý các món đang có: %s."
                                            .formatted(productsToShow.isEmpty() ? "chưa có sản phẩm" : joinProductNames(productsToShow)),
                            isRelated
                                    ? "We don't have that item, but here are related products: %s. Which one would you like to view?"
                                            .formatted(joinProductNames(productsToShow))
                                    : "We don't have that item. Here are our available products: %s."
                                            .formatted(productsToShow.isEmpty() ? "no available products yet" : joinProductNames(productsToShow)));
            return AiChatResponse.builder()
                    .reply(reply).refusal(false).shouldOfferAddToCart(false).language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .matchedProductIds(productsToShow.stream().map(Product::getId).toList())
                    .actions(buildProductListActions(productsToShow, language)).build();
        }

        if (buy && matchedProducts.size() == 1) {
            return buildBuyIntentResponse(matchedProducts.getFirst(), message, language, plan);
        }

        String reply = StringUtils.hasText(plan.reply) ? plan.reply
                : t(language,
                        "Em tìm thấy các món liên quan: %s. Bạn muốn mua món nào ạ?"
                                .formatted(joinProductNames(matchedProducts)),
                        "I found related products: %s. Which one would you like to buy?"
                                .formatted(joinProductNames(matchedProducts)));
        return AiChatResponse.builder()
                .reply(reply).refusal(false).shouldOfferAddToCart(false).language(language)
                .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                .matchedProductIds(matchedProducts.stream().map(Product::getId).toList())
                .actions(buildProductListActions(matchedProducts, language, buy)).build();
    }

    private AiChatResponse buildGeminiPlanFallbackResponse(
            GeminiKeywordPlan plan,
            String fallbackLanguage,
            Map<String, Product> productById) {
        String language = StringUtils.hasText(plan.language) ? plan.language : fallbackLanguage;
        boolean outOfDomain = plan.intents.contains("OUT_OF_DOMAIN");
        String reply = StringUtils.hasText(plan.reply)
                ? plan.reply
                : t(language,
                        "Anh/chị mô tả cụ thể hơn tên món giúp em nhé, em sẽ tìm đúng món cho mình.",
                        "Please share a more specific product name and I will find the best match for you.");
        if (outOfDomain && plan.refusal) {
            return AiChatResponse.builder()
                    .reply(reply)
                    .refusal(true)
                    .shouldOfferAddToCart(false)
                    .language(language)
                    .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                    .matchedProductIds(List.of())
                    .actions(List.of())
                    .build();
        }
        List<Product> featured = pickFeaturedProducts(new ArrayList<>(productById.values()), RELATED_PRODUCTS_LIMIT);
        return AiChatResponse.builder()
                .reply(reply)
                .refusal(false)
                .shouldOfferAddToCart(false)
                .language(language)
                .nextContext(AiChatContext.builder().awaiting(AWAITING_NONE).build())
                .matchedProductIds(featured.stream().map(Product::getId).toList())
                .actions(buildProductListActions(featured, language))
                .build();
    }

    private boolean isAffirmative(String normalized) {
        return AiChatTextSupport.isAffirmative(normalized);
    }

    private boolean isNegative(String normalized) {
        return AiChatTextSupport.isNegative(normalized);
    }

    private Optional<ProductVariant> parseVariantFromMessage(String message, Product product) {
        return AiChatProductSupport.parseVariantFromMessage(message, product);
    }

    private Integer parseQuantity(String message) {
        return AiChatTextSupport.parseQuantity(message);
    }

    private Integer parsePositiveInt(String value) {
        return AiChatTextSupport.parsePositiveInt(value);
    }

    private ParsedCommand parseCommand(String message) {
        String trimmed = message.trim();
        if (!trimmed.startsWith("/")) {
            return new ParsedCommand("", "");
        }
        int separator = trimmed.indexOf(':');
        if (separator < 0) {
            return new ParsedCommand(trimmed.substring(1), "");
        }
        return new ParsedCommand(trimmed.substring(1, separator), trimmed.substring(separator + 1));
    }

    private String t(String language, String vi, String en) {
        return "en".equalsIgnoreCase(language) ? en : vi;
    }

    private String joinProductNames(List<Product> products) {
        return products.stream().map(Product::getName).collect(Collectors.joining(", "));
    }

    private String generateConversationalReply(String language, String task, String fallback) {
        if (!geminiEnabled || isGeminiTemporarilyBlocked()) {
            return fallback;
        }
        try {
            String targetLanguage = "en".equalsIgnoreCase(language) ? "English" : "Vietnamese";
            String prompt = """
                    You are a friendly sales assistant for LikeFood.
                    Write ONLY one short sentence in %s.
                    Task: %s
                    Keep it natural and concise. No markdown. No JSON.
                    """.formatted(targetLanguage, task);
            String text = callGeminiWithRetry(prompt, "text/plain");
            String cleaned = cleanupJson(text).trim();
            if (!StringUtils.hasText(cleaned)) {
                return fallback;
            }
            return cleaned;
        } catch (AppException ex) {
            log.debug("Gemini dynamic reply fallback: {}", ex.getMessage());
            return fallback;
        }
    }

    private String buildCacheKey(String language, String message, AiChatContext context) {
        String normalizedMessage = normalize(message);
        String awaiting = context == null || !StringUtils.hasText(context.getAwaiting()) ? AWAITING_NONE
                : context.getAwaiting();
        String selectedProductId = context == null || !StringUtils.hasText(context.getSelectedProductId()) ? "-"
                : context.getSelectedProductId();
        String selectedVariantId = context == null || !StringUtils.hasText(context.getSelectedVariantId()) ? "-"
                : context.getSelectedVariantId();
        return String.join("|", language, awaiting, selectedProductId, selectedVariantId, normalizedMessage);
    }

    private AiChatResponse getCachedResponse(String cacheKey) {
        CachedAiResponseEntry entry = responseCache.get(cacheKey);
        if (entry == null)
            return null;
        long now = System.currentTimeMillis();
        if (entry.expireAtMs < now) {
            responseCache.remove(cacheKey);
            return null;
        }
        return entry.response;
    }

    private void putCachedResponse(String cacheKey, AiChatResponse response) {
        if (!StringUtils.hasText(cacheKey) || response == null || cacheTtlMs <= 0)
            return;
        evictCacheIfNeeded();
        long expireAtMs = System.currentTimeMillis() + cacheTtlMs;
        responseCache.put(cacheKey, new CachedAiResponseEntry(response, expireAtMs));
    }

    private void evictCacheIfNeeded() {
        if (responseCache.size() < CACHE_MAX_SIZE)
            return;
        long now = System.currentTimeMillis();
        responseCache.entrySet().removeIf(e -> e.getValue().expireAtMs < now);
        if (responseCache.size() >= CACHE_MAX_SIZE) {
            List<String> keysToRemove = responseCache.keySet().stream()
                    .limit(CACHE_MAX_SIZE / 4)
                    .toList();
            keysToRemove.forEach(responseCache::remove);
        }
    }

    private record CachedAiResponseEntry(AiChatResponse response, long expireAtMs) {
    }

    private record GeminiKeywordPlan(
            String reply,
            boolean refusal,
            List<String> intents,
            List<String> keywords,
            Integer quantity,
            String variantHint,
            String language) {
    }

    private static class ParsedCommand {
        final String name;
        final String arg;

        ParsedCommand(String name, String arg) {
            this.name = name;
            this.arg = arg;
        }
    }
}
