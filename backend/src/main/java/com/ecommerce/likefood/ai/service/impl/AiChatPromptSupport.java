package com.ecommerce.likefood.ai.service.impl;

import com.ecommerce.likefood.ai.dto.req.AiChatHistoryItem;
import com.ecommerce.likefood.ai.dto.req.AiChatRequest;
import com.ecommerce.likefood.common.exception.AppException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class AiChatPromptSupport {
    private AiChatPromptSupport() {
    }

    static String buildKeywordPrompt(AiChatRequest request, String language, ObjectMapper objectMapper,
            int historyLimit, String productCatalogSummary) {
        try {
            String historyJson = buildHistoryJson(request.getHistory(), objectMapper, historyLimit);
            String preferredLanguage = "en".equalsIgnoreCase(language) ? "English" : "Vietnamese";
            return """
                    You are a smart shopping assistant for LikeFood — an online Vietnamese food & snack store.

                    === PRODUCT CATALOG (this is all products we currently sell) ===
                    %s
                    === END CATALOG ===

                    Your job:
                    1) Detect user intent (multiple intents can co-exist).
                    2) Extract concise product keywords for database search.
                    3) Write a short, friendly, natural reply in %s based on the catalog above.

                    Return STRICT JSON only:
                    {
                      "reply": "string",
                      "refusal": false,
                      "intents": ["GREETING"],
                      "keywords": ["keyword1"],
                      "quantity": 0,
                      "variantHint": "",
                      "categoryHint": "",
                      "maxBudgetVnd": 0,
                      "language": "vi"
                    }

                    === INTENT DEFINITIONS ===
                    - GREETING: user says hello/hi/xin chào.
                    - BROWSE: user asks to see what's available, the menu, or open-ended like "có gì ngon không".
                    - RECOMMENDATION: user asks for suggestions ("gợi ý", "tư vấn", "nên mua gì", "món nào ngon").
                    - PRODUCT_QUERY: user asks about a specific product or category by name.
                    - PRODUCT_DETAIL: user asks for price, description, weight, or detailed info about a product ("giá bao nhiêu", "mô tả", "chi tiết").
                    - BUY: user wants to add a product to cart / purchase something ("mua", "thêm vào giỏ", "đặt hàng").
                    - THANKS: user says thank you / cảm ơn / thanks.
                    - HELP: user asks what the bot can do, or asks for help/guidance ("giúp đỡ", "hướng dẫn", "bạn làm được gì").
                    - OUT_OF_DOMAIN: question is completely unrelated to food shopping.

                    === CRITICAL RULES ===
                    - A message CAN have MULTIPLE intents. Example: "xin chào, có khô bò không" -> ["GREETING","PRODUCT_QUERY"]
                    - When BROWSE or RECOMMENDATION: refusal=false, keywords can be empty.
                    - When PRODUCT_DETAIL: include the product name in keywords so we can look it up.
                    - When THANKS or HELP: refusal=false, keywords=[].
                    - keywords must be short product-focused terms only. Max 6 keywords. Extract EXACT product name from user.
                    - CRITICAL: "Mứt" (jam/candy) and "Mực" (squid) are DIFFERENT. "Mua Mứt dừa" -> keywords ["mut dua"], NEVER ["muc"]. "có mực rim" -> keywords ["muc rim"], NEVER ["mut"]. Do NOT confuse similar-sounding words.
                    - If user writes English but products have Vietnamese names, convert keywords to Vietnamese for DB search.
                    - OUT_OF_DOMAIN -> refusal=true ONLY if there is zero shopping component.
                    - reply MUST reference actual products from the catalog when relevant (use real names, real prices).
                    - reply must sound like a warm, helpful Vietnamese sales assistant.
                    - For PRODUCT_DETAIL: include the product's actual price, weight options, and description in the reply.
                    - For RECOMMENDATION/BROWSE: mention 2-4 actual product names from the catalog.
                    - For BUY intent: extract quantity and variant from natural language. Set quantity (1-99) when user specifies amount. Set variantHint (e.g. "500g", "1kg") when user specifies size.
                    - quantity: integer 1-99, or 0/null when not specified. Extract from: "số lượng là 2", "số lượng 3", "quantity is 2", "2 cái", "3 cái", "2 pieces", "I want 3", "cho tôi 2", "mua 2 cái", "920g số lượng 3" (quantity=3)...
                    - variantHint: string like "500g", "1kg", "300g" when user mentions size. Empty string when not specified.
                    - categoryHint: when user asks for a CATEGORY type (not a specific product name), set to the catalog category name. Map: "hạt"/"dạng hạt"/"loại hạt"/"nuts" -> "Hạt", "bánh" -> "Bánh", "mực" -> "Mực", "mứt" -> "Mứt", "khô" -> "Khô". Empty when searching by product name.
                    - maxBudgetVnd: when user mentions budget (e.g. "50k", "100 nghìn", "tôi có 50k", "100.000đ", "50 đô"), extract number. "50k"=50000, "100 nghìn"=100000, "50 đô"=1250000 (1 USD ~ 25000 VND). 0 when not specified.

                    === EXAMPLES ===
                    - "xin chào" -> intents: ["GREETING"], keywords: [], quantity: 0, variantHint: ""
                    - "có gì ngon không" -> intents: ["BROWSE"], keywords: [], quantity: 0, variantHint: ""
                    - "khô bò giá bao nhiêu" -> intents: ["PRODUCT_DETAIL"], keywords: ["kho bo"], quantity: 0, variantHint: ""
                    - "mua khô bò 500g" -> intents: ["BUY","PRODUCT_QUERY"], keywords: ["kho bo"], quantity: 0, variantHint: "500g"
                    - "mua khô bò 500g 2" -> intents: ["BUY","PRODUCT_QUERY"], keywords: ["kho bo"], quantity: 2, variantHint: "500g"
                    - "tôi muốn mua khô bò số lượng là 2" -> intents: ["BUY","PRODUCT_QUERY"], keywords: ["kho bo"], quantity: 2, variantHint: ""
                    - "có khô gà lá chanh không" -> intents: ["PRODUCT_QUERY"], keywords: ["kho ga la chanh"], quantity: 0, variantHint: ""
                    - "I want to buy beef jerky, the quantity is 2" -> intents: ["BUY","PRODUCT_QUERY"], keywords: ["kho bo"], quantity: 2, variantHint: ""
                    - "cho tôi 3 gói khô bò 500g" -> intents: ["BUY","PRODUCT_QUERY"], keywords: ["kho bo"], quantity: 3, variantHint: "500g"
                    - "920g số lượng 3" (trong flow chọn variant) -> quantity: 3, variantHint: "920g"
                    - "cảm ơn bạn" -> intents: ["THANKS"], keywords: [], quantity: 0, variantHint: ""
                    - "bạn làm được gì" -> intents: ["HELP"], keywords: [], quantity: 0, variantHint: "", categoryHint: "", maxBudgetVnd: 0
                    - "thời tiết hôm nay" -> intents: ["OUT_OF_DOMAIN"], refusal: true, quantity: 0, variantHint: "", categoryHint: "", maxBudgetVnd: 0
                    - "bạn có món gì thuộc dạng hạt không" -> intents: ["PRODUCT_QUERY"], keywords: [], quantity: 0, variantHint: "", categoryHint: "Hạt", maxBudgetVnd: 0
                    - "gợi ý món khô dưới 100k" -> intents: ["RECOMMENDATION","PRODUCT_QUERY"], keywords: ["kho"], quantity: 0, variantHint: "", categoryHint: "Khô", maxBudgetVnd: 100000
                    - "tôi có 50k muốn mua đồ ăn vặt" -> intents: ["BROWSE","RECOMMENDATION"], keywords: [], quantity: 0, variantHint: "", categoryHint: "", maxBudgetVnd: 50000
                    - "có mực rim không" -> intents: ["PRODUCT_QUERY"], keywords: ["muc rim"], quantity: 0, variantHint: "", categoryHint: "Mực", maxBudgetVnd: 0
                    - "xin chào bên bạn có mực rim không" -> intents: ["GREETING","PRODUCT_QUERY"], keywords: ["muc rim"], quantity: 0, variantHint: "", categoryHint: "Mực", maxBudgetVnd: 0
                    - "Mua Mứt dừa 400g" -> intents: ["BUY","PRODUCT_QUERY"], keywords: ["mut dua"], quantity: 0, variantHint: "400g", categoryHint: "Mứt", maxBudgetVnd: 0

                    Recent conversation:
                    %s

                    User message:
                    %s
                    """
                    .formatted(productCatalogSummary, preferredLanguage, historyJson, request.getMessage());
        } catch (IOException e) {
            throw new AppException("Cannot build Gemini keyword prompt: " + e.getMessage());
        }
    }

    static List<String> toStringList(Object rawValue) {
        if (!(rawValue instanceof List<?> list)) {
            return List.of();
        }
        return list.stream()
                .map(String::valueOf)
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
    }

    static String cleanupJson(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```json\\s*", "");
            cleaned = cleaned.replaceFirst("^```\\s*", "");
            cleaned = cleaned.replaceFirst("\\s*```$", "");
        }
        return cleaned.trim();
    }

    private static String buildHistoryJson(List<AiChatHistoryItem> history, ObjectMapper objectMapper, int historyLimit)
            throws IOException {
        if (history == null || history.isEmpty()) {
            return "[]";
        }
        List<Map<String, String>> compactHistory = history.stream()
                .filter(item -> StringUtils.hasText(item.getRole()) && StringUtils.hasText(item.getContent()))
                .skip(Math.max(0, history.size() - historyLimit))
                .map(item -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("role", item.getRole().trim());
                    map.put("content", item.getContent().trim());
                    return map;
                })
                .toList();
        return objectMapper.writeValueAsString(compactHistory);
    }
}
