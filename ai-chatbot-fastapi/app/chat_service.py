from __future__ import annotations

import random
import re
import unicodedata

from .backend_client import BackendClient
from .budget import format_usd, normalize_price_to_usd, parse_budget_value, pick_variants_for_budget
from .domain import Product, ProductVariant
from .gemini_client import GeminiClient
from .schemas import (
    AiAssistantResponse,
    AiCartInstruction,
    AiChatAction,
    AiChatContext,
    AiChatRequest,
    AiRecommendationMeta,
)

AWAITING_NONE = "NONE"
AWAITING_PRODUCT_CONFIRMATION = "AWAITING_PRODUCT_CONFIRMATION"
AWAITING_VARIANT_OR_QUANTITY = "AWAITING_VARIANT_OR_QUANTITY"
AWAITING_CHECKOUT = "AWAITING_CHECKOUT"


class ChatService:
    def __init__(self, backend_client: BackendClient, gemini_client: GeminiClient) -> None:
        self.backend = backend_client
        self.gemini = gemini_client

    async def respond(self, request: AiChatRequest, auth_header: str | None = None) -> AiAssistantResponse:
        message = (request.message or "").strip()
        language = "en" if request.preferredLanguage == "en" else "vi"
        context = request.context or AiChatContext()
        products = await self.backend.fetch_products()
        product_map = {p.id: p for p in products}

        # Stateful flow first
        state_response = await self._handle_stateful(message, context, product_map, language)
        if state_response:
            return state_response

        # Receptionist-style welcome for greeting messages.
        if self._is_greeting(message):
            featured = products[:3]
            return AiAssistantResponse(
                reply="Chào mừng anh/chị đến LikeFood! Em là lễ tân AI, rất vui được hỗ trợ. Hôm nay anh/chị muốn em gợi ý món ngon không ạ?",
                language=language,
                actions=[
                    action
                    for product in featured
                    for action in [
                        AiChatAction(type="open-product", label=f"Xem {product.name}", command=f"/open-product:{product.id}", productId=product.id),
                        AiChatAction(type="buy-product", label=f"Mua {product.name}", command=f"/buy-product:{product.id}", productId=product.id),
                    ]
                ],
                matchedProductIds=[p.id for p in featured],
                nextContext=AiChatContext(awaiting=AWAITING_NONE),
                recommendationMeta=AiRecommendationMeta(
                    reason="Loi chao tiep tan",
                    offerType="primary",
                    fallbackLevel="SAFE",
                    confidenceBand="high",
                    intent="GREETING",
                    formatProfile="simple_cta",
                ),
            )

        # Broad query -> ask category clarification first
        if self._is_broad_query(message) and not parse_budget_value(message):
            categories = sorted({p.category for p in products if p.category})[:6]
            return AiAssistantResponse(
                reply="Dạ em chào anh/chị! Anh/chị muốn tìm theo nhóm nào để em tư vấn đúng gu và chốt đơn nhanh hơn ạ?",
                language=language,
                actions=[
                    AiChatAction(type="show-more-options", label=cat, command=f"/category:{cat}") for cat in categories[:3]
                ],
                nextContext=AiChatContext(awaiting=AWAITING_NONE),
                recommendationMeta=AiRecommendationMeta(
                    reason="Lam ro danh muc truoc khi goi y",
                    offerType="primary",
                    fallbackLevel="SAFE",
                    confidenceBand="medium",
                    intent="CATEGORY_CLARIFICATION",
                    formatProfile="simple_cta",
                ),
            )

        category_from_command = self._parse_category_command(message)
        if category_from_command:
            filtered = [p for p in products if p.category.lower() == category_from_command.lower()]
            return await self._build_recommendation_response(
                filtered or products, message, context, language, selected_category=category_from_command
            )

        return await self._build_recommendation_response(products, message, context, language)

    async def _handle_stateful(
        self, message: str, context: AiChatContext, product_map: dict[str, Product], language: str
    ) -> AiAssistantResponse | None:
        command_name, command_arg = self._parse_command(message)
        selected_product = product_map.get(context.selectedProductId or "")

        if context.awaiting == AWAITING_PRODUCT_CONFIRMATION and selected_product:
            # User asks to explain current product: answer detail and keep current product context.
            if self._is_detail_intent(message):
                return await self._build_product_detail_followup(selected_product, language)

            # If user asks about another product, replace current context with the new product.
            switched_product = self._find_exact_product(list(product_map.values()), message)
            if switched_product and switched_product.id != selected_product.id:
                return await self._build_product_confirmation(switched_product, language)

            if command_name == "confirm-product" or self._is_affirmative(message):
                return self._ask_variant_or_quantity(selected_product, language, context.pendingQuantity)
            if command_name == "reject-product" or self._is_negative(message):
                return AiAssistantResponse(
                    reply="Dạ, em sẽ gợi ý 3 món khác cho anh/chị nhé.",
                    actions=[AiChatAction(type="show-more-options", label="Xem 3 gợi ý mới", command="/show-more")],
                    language=language,
                    nextContext=AiChatContext(awaiting=AWAITING_NONE),
                )
            return AiAssistantResponse(
                reply="Anh/chị chọn giúp em: mua món này hay xem món khác nhé?",
                actions=[
                    AiChatAction(type="confirm-product", label="Có, mua món này", command=f"/confirm-product:{selected_product.id}"),
                    AiChatAction(type="reject-product", label="Đổi món khác", command=f"/reject-product:{selected_product.id}"),
                ],
                language=language,
                nextContext=context,
            )

        if context.awaiting == AWAITING_VARIANT_OR_QUANTITY and selected_product:
            chosen_variant: ProductVariant | None = None
            quantity = self._parse_quantity(message) or context.pendingQuantity
            if command_name == "choose-variant":
                chosen_variant = next((v for v in selected_product.variants if v.id == command_arg), None)
            if not chosen_variant:
                chosen_variant = self._parse_variant_from_message(selected_product, message)
            if not chosen_variant and context.selectedVariantId:
                chosen_variant = next((v for v in selected_product.variants if v.id == context.selectedVariantId), None)

            # Mandatory variant first for multi-variant
            if len(selected_product.variants) > 1 and not chosen_variant:
                return self._ask_variant_only(selected_product, language, quantity)

            # Auto-select only variant when product has one variant
            if not chosen_variant and len(selected_product.variants) == 1:
                chosen_variant = selected_product.variants[0]

            if not chosen_variant:
                return self._ask_variant_only(selected_product, language, quantity)

            if quantity is None:
                return self._ask_quantity_only(selected_product, chosen_variant, language)

            return AiAssistantResponse(
                reply=f"Đã thêm {quantity} x {selected_product.name} ({chosen_variant.weight_label}) vào giỏ hàng. Anh/chị muốn thanh toán ngay không ạ?",
                language=language,
                cartInstruction=AiCartInstruction(
                    productId=selected_product.id, variantId=chosen_variant.id, quantity=quantity
                ),
                actions=[
                    AiChatAction(type="go-checkout", label="Đi đến thanh toán", command="/go-checkout"),
                    AiChatAction(type="show-more-options", label="Xem thêm món", command="/show-more"),
                ],
                nextContext=AiChatContext(
                    awaiting=AWAITING_CHECKOUT,
                    selectedProductId=selected_product.id,
                    selectedVariantId=chosen_variant.id,
                ),
            )

        if context.awaiting == AWAITING_CHECKOUT:
            if command_name == "go-checkout" or self._is_affirmative(message):
                return AiAssistantResponse(
                    reply="Anh/chị bấm nút dưới để chuyển qua trang thanh toán nhé.",
                    language=language,
                    actions=[AiChatAction(type="go-checkout", label="Đi đến thanh toán", command="/go-checkout")],
                    nextContext=AiChatContext(awaiting=AWAITING_NONE),
                )
            if self._is_negative(message):
                return AiAssistantResponse(
                    reply="Dạ anh/chị, em giữ giỏ hàng để mình mua tiếp ạ.",
                    language=language,
                    nextContext=AiChatContext(awaiting=AWAITING_NONE),
                )
            return AiAssistantResponse(
                reply="Anh/chị muốn thanh toán ngay hay xem thêm sản phẩm ạ?",
                language=language,
                actions=[
                    AiChatAction(type="go-checkout", label="Thanh toán ngay", command="/go-checkout"),
                    AiChatAction(type="show-more-options", label="Xem thêm món", command="/show-more"),
                ],
                nextContext=context,
            )

        return None

    async def _build_recommendation_response(
        self,
        products: list[Product],
        message: str,
        context: AiChatContext,
        language: str,
        selected_category: str | None = None,
    ) -> AiAssistantResponse:
        budget = parse_budget_value(message)
        if budget and budget > 0:
            selected_strict = pick_variants_for_budget(products, budget, limit_items=3)
            selected = selected_strict
            expanded = False
            if not selected_strict:
                selected = pick_variants_for_budget(products, budget * 1.3, limit_items=3)
                expanded = True
            if selected:
                lines = []
                actions: list[AiChatAction] = []
                for product, variant in selected:
                    lines.append(f"- {product.name} ({variant.weight_label}) - {format_usd(normalize_price_to_usd(variant.price))}")
                    actions.append(
                        AiChatAction(
                            type="buy-product",
                            label=f"Mua {product.name}",
                            command=f"/buy-product:{product.id}",
                            productId=product.id,
                        )
                    )
                    actions.append(
                        AiChatAction(
                            type="open-product",
                            label=f"Xem {product.name}",
                            command=f"/open-product:{product.id}",
                            productId=product.id,
                        )
                    )
                budget_reply = ""
                if not expanded:
                    budget_reply = (
                        "Dạ em đã tìm được món trong ngân sách của anh/chị "
                        + f"{format_usd(budget)}"
                        + ":\n"
                        + "\n".join(lines)
                    )
                else:
                    budget_reply = (
                        "Dạ trong ngân sách "
                        + f"{format_usd(budget)}"
                        + " hiện tại em chưa có món phù hợp.\n"
                        + "Nếu anh/chị linh động lên khoảng "
                        + f"{format_usd(budget * 1.3)}"
                        + ", hiện tại em đang có:\n"
                        + "\n".join(lines)
                    )
                return AiAssistantResponse(
                    reply=budget_reply,
                    language=language,
                    actions=actions[:6],
                    matchedProductIds=[p.id for p, _ in selected],
                    nextContext=AiChatContext(
                        awaiting=AWAITING_NONE,
                        pendingCategory=selected_category,
                        lastRecommendedVariantIds=[v.id for _, v in selected],
                        lastBudgetLimit=budget,
                        budgetExpanded=expanded,
                    ),
                    recommendationMeta=AiRecommendationMeta(
                        reason="Goi y theo ngan sach toan don",
                        offerType="related",
                        fallbackLevel="CATEGORY_BUDGET",
                        confidenceBand="high" if not expanded else "medium",
                        intent="BUDGET_CONSTRAINT",
                        formatProfile="budget_advice",
                    ),
                )
            # No strict match and no expanded match: show explicit no-fit and current cheapest options.
            cheapest = sorted(
                [
                    (product, variant)
                    for product in products
                    for variant in product.variants
                    if variant.quantity > 0
                ],
                key=lambda item: normalize_price_to_usd(item[1].price),
            )[:3]
            fallback_lines = [
                f"- {product.name} ({variant.weight_label}) - {format_usd(normalize_price_to_usd(variant.price))}"
                for product, variant in cheapest
            ]
            return AiAssistantResponse(
                reply=(
                    "Dạ trong ngân sách "
                    + f"{format_usd(budget)}"
                    + " hiện tại em chưa có món phù hợp.\n"
                    + "Hiện tại em đang có các món giá thấp nhất như sau:\n"
                    + ("\n".join(fallback_lines) if fallback_lines else "- Tạm thời chưa có sản phẩm khả dụng")
                ),
                language=language,
                matchedProductIds=[p.id for p, _ in cheapest],
                actions=[
                    action
                    for p, _ in cheapest
                    for action in [
                        AiChatAction(type="open-product", label=f"Xem {p.name}", command=f"/open-product:{p.id}", productId=p.id),
                        AiChatAction(type="buy-product", label=f"Mua {p.name}", command=f"/buy-product:{p.id}", productId=p.id),
                    ]
                ][:6],
                nextContext=AiChatContext(
                    awaiting=AWAITING_NONE,
                    pendingCategory=selected_category,
                    lastBudgetLimit=budget,
                    budgetExpanded=False,
                ),
                recommendationMeta=AiRecommendationMeta(
                    reason="Khong co mon trong ngan sach",
                    offerType="alternative",
                    fallbackLevel="SAFE",
                    confidenceBand="low",
                    intent="BUDGET_CONSTRAINT",
                    formatProfile="budget_advice",
                ),
            )

        if message.strip() == "/show-more":
            return self._build_three_alternatives(products, language, selected_category)

        # Availability query: if exact item exists, return only that one.
        if self._is_availability_intent(message):
            exact_product = self._find_exact_product(products, message)
            if exact_product:
                return await self._build_product_confirmation(exact_product, language)
            topic_category = selected_category or self._infer_topic_from_message(products, message)
            return AiAssistantResponse(
                reply="Dạ hiện tại em chưa thấy đúng món anh/chị hỏi. Em gợi ý vài món gần nhất để anh/chị tham khảo ạ.",
                language=language,
                **self._build_three_alternatives(products, language, topic_category).model_dump(
                    include={"actions", "matchedProductIds", "nextContext", "recommendationMeta"}
                ),
            )

        # Product search / detail / buy flow
        matches = self._search_products(products, message)
        if not matches:
            topic_category = selected_category or self._infer_topic_from_message(products, message)
            return self._build_three_alternatives(products, language, topic_category)

        first = matches[0]
        if self._is_buy_intent(message):
            return await self._build_product_confirmation(first, language)

        if self._is_detail_intent(message):
            return await self._build_product_detail_followup(first, language)

        top = matches[:3]
        return AiAssistantResponse(
            reply=f"Dạ em tìm thấy các món hợp với nhu cầu của anh/chị: {', '.join([p.name for p in top])}. Anh/chị muốn em mở món nào trước để tư vấn kỹ hơn ạ?",
            language=language,
            matchedProductIds=[p.id for p in top],
            actions=[
                action
                for product in top
                for action in [
                    AiChatAction(type="open-product", label=f"Xem {product.name}", command=f"/open-product:{product.id}", productId=product.id),
                    AiChatAction(type="buy-product", label=f"Mua {product.name}", command=f"/buy-product:{product.id}", productId=product.id),
                ]
            ],
            nextContext=AiChatContext(awaiting=AWAITING_NONE, pendingCategory=selected_category),
            recommendationMeta=AiRecommendationMeta(
                reason="Mon lien quan",
                offerType="related",
                fallbackLevel="RELATED",
                confidenceBand="medium",
                intent="PRODUCT_SEARCH",
                formatProfile="recommendation_list",
            ),
        )

    async def _build_product_confirmation(self, product: Product, language: str) -> AiAssistantResponse:
        base = f"Dạ bên em có {product.name}. Anh/chị muốn mua luôn không ạ?"
        reply = await self.gemini.rewrite_persuasive(base)
        return AiAssistantResponse(
            reply=reply,
            language=language,
            matchedProductIds=[product.id],
            actions=[
                AiChatAction(type="confirm-product", label="Có, mình muốn mua", command=f"/confirm-product:{product.id}", productId=product.id),
                AiChatAction(type="reject-product", label="Để mình xem thêm", command=f"/reject-product:{product.id}", productId=product.id),
                AiChatAction(type="open-product", label="Xem chi tiết", command=f"/open-product:{product.id}", productId=product.id),
            ],
            nextContext=AiChatContext(awaiting=AWAITING_PRODUCT_CONFIRMATION, selectedProductId=product.id),
        )

    async def _build_product_detail_followup(self, product: Product, language: str) -> AiAssistantResponse:
        detail = self._build_persuasive_detail(product)
        detail = await self.gemini.rewrite_persuasive(detail)
        return AiAssistantResponse(
            reply=detail,
            language=language,
            matchedProductIds=[product.id],
            actions=[
                AiChatAction(type="confirm-product", label="Có, mua món này", command=f"/confirm-product:{product.id}", productId=product.id),
                AiChatAction(type="reject-product", label="Đổi món khác", command=f"/reject-product:{product.id}", productId=product.id),
                AiChatAction(type="open-product", label="Xem chi tiết", command=f"/open-product:{product.id}", productId=product.id),
            ],
            nextContext=AiChatContext(
                awaiting=AWAITING_PRODUCT_CONFIRMATION,
                selectedProductId=product.id,
            ),
            recommendationMeta=AiRecommendationMeta(
                reason="Chi tiet mon dang quan tam",
                offerType="primary",
                fallbackLevel="EXACT",
                confidenceBand="high",
                intent="PRODUCT_DETAIL",
                formatProfile="compact_detail",
            ),
        )

    def _ask_variant_or_quantity(self, product: Product, language: str, pending_quantity: int | None) -> AiAssistantResponse:
        if len(product.variants) == 1:
            return self._ask_quantity_only(product, product.variants[0], language)
        return self._ask_variant_only(product, language, pending_quantity)

    def _ask_variant_only(self, product: Product, language: str, pending_quantity: int | None) -> AiAssistantResponse:
        actions = [
            AiChatAction(
                type="choose-variant",
                label=variant.weight_label,
                command=f"/choose-variant:{variant.id}",
                productId=product.id,
                variantId=variant.id,
                quantity=pending_quantity,
            )
            for variant in product.variants[:6]
        ]
        labels = ", ".join([v.weight_label for v in product.variants[:6]])
        return AiAssistantResponse(
            reply=f'"{product.name}" có các loại: {labels}. Anh/chị chọn loại trước giúp em nhé.',
            language=language,
            actions=actions,
            matchedProductIds=[product.id],
            nextContext=AiChatContext(
                awaiting=AWAITING_VARIANT_OR_QUANTITY,
                selectedProductId=product.id,
                pendingQuantity=pending_quantity,
            ),
        )

    def _ask_quantity_only(self, product: Product, variant: ProductVariant, language: str) -> AiAssistantResponse:
        return AiAssistantResponse(
            reply=f"Anh/chị muốn mua {product.name} ({variant.weight_label}) số lượng bao nhiêu ạ?",
            language=language,
            actions=[
                AiChatAction(type="choose-qty", label="1", command="/choose-qty:1", productId=product.id, variantId=variant.id, quantity=1),
                AiChatAction(type="choose-qty", label="2", command="/choose-qty:2", productId=product.id, variantId=variant.id, quantity=2),
                AiChatAction(type="choose-qty", label="3", command="/choose-qty:3", productId=product.id, variantId=variant.id, quantity=3),
            ],
            matchedProductIds=[product.id],
            nextContext=AiChatContext(
                awaiting=AWAITING_VARIANT_OR_QUANTITY,
                selectedProductId=product.id,
                selectedVariantId=variant.id,
            ),
        )

    def _build_three_alternatives(self, products: list[Product], language: str, selected_category: str | None) -> AiAssistantResponse:
        pool = [p for p in products if not selected_category or p.category.lower() == selected_category.lower()]
        if not pool:
            pool = products
        picks = random.sample(pool, k=min(3, len(pool)))
        return AiAssistantResponse(
            reply="Dạ em mời anh/chị tham khảo thêm 3 lựa chọn nổi bật này:",
            language=language,
            matchedProductIds=[p.id for p in picks],
            actions=[
                action
                for p in picks
                for action in [
                    AiChatAction(type="open-product", label=f"Xem {p.name}", command=f"/open-product:{p.id}", productId=p.id),
                    AiChatAction(type="buy-product", label=f"Mua {p.name}", command=f"/buy-product:{p.id}", productId=p.id),
                ]
            ],
            nextContext=AiChatContext(awaiting=AWAITING_NONE, pendingCategory=selected_category),
            recommendationMeta=AiRecommendationMeta(
                reason="Ba goi y thay the",
                offerType="alternative",
                fallbackLevel="RELATED",
                confidenceBand="medium",
                intent="RELATED_RECOMMENDATION",
                formatProfile="recommendation_list",
            ),
        )

    def _search_products(self, products: list[Product], message: str) -> list[Product]:
        normalized = self._normalize(message)
        stopwords = {
            "co",
            "khong",
            "ko",
            "khong?",
            "mon",
            "san",
            "pham",
            "cho",
            "toi",
            "duoc",
            "khong",
            "khong",
            "khong",
            "xin",
            "nhe",
            "a",
            "ạ",
        }
        tokens = [t for t in normalized.split(" ") if len(t) > 1 and t not in stopwords]
        scored: list[tuple[int, Product]] = []
        for p in products:
            score = 0
            p_name = self._normalize(p.name)
            p_text = self._normalize(f"{p.name} {p.description} {p.category}")
            if normalized and normalized == p_name:
                score += 12
            for token in tokens:
                if token in p_name:
                    score += 4
                elif token in p_text:
                    score += 2
            if normalized and normalized in p_text:
                score += 4
            if score > 0:
                scored.append((score, p))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored][:6]

    def _parse_variant_from_message(self, product: Product, message: str) -> ProductVariant | None:
        normalized = self._normalize(message)
        for variant in product.variants:
            if self._normalize(variant.weight_label) in normalized:
                return variant
        return None

    def _parse_quantity(self, message: str) -> int | None:
        matched = re.search(r"\b(\d{1,2})\b", message)
        if not matched:
            return None
        value = int(matched.group(1))
        return value if 1 <= value <= 99 else None

    def _build_persuasive_detail(self, product: Product) -> str:
        desc = product.description.strip()
        if not desc:
            desc = "Món này đang được nhiều khách chọn vì vị dễ ăn và tiện dùng."
        return f"{product.name}: {desc} Em gợi ý món này rất hợp để chốt đơn nhanh, anh/chị muốn em chọn loại phù hợp ngân sách luôn không ạ?"

    def _parse_category_command(self, message: str) -> str | None:
        if not message.startswith("/category:"):
            return None
        return message.split(":", 1)[1].strip() or None

    def _parse_command(self, message: str) -> tuple[str, str]:
        msg = message.strip()
        if not msg.startswith("/"):
            return "", ""
        if ":" in msg:
            name, arg = msg[1:].split(":", 1)
            return name, arg
        return msg[1:], ""

    def _is_broad_query(self, message: str) -> bool:
        normalized = self._normalize(message)
        broad_keys = ["goi y", "tu van", "co mon gi", "an gi", "menu", "tim mon", "tim san pham"]
        return any(key in normalized for key in broad_keys)

    def _is_buy_intent(self, message: str) -> bool:
        normalized = self._normalize(message)
        return any(k in normalized for k in ["mua", "them vao gio", "dat hang", "lay cho toi"])

    def _is_availability_intent(self, message: str) -> bool:
        normalized = self._normalize(message)
        return ("co " in normalized and " khong" in normalized) or normalized.startswith("co ")

    def _extract_requested_name(self, message: str) -> str:
        normalized = self._normalize(message)
        match = re.search(r"\bco\s+(.+?)\s+khong\b", normalized)
        if match:
            return match.group(1).strip()
        if normalized.startswith("co "):
            return normalized[3:].strip()
        return normalized

    def _find_exact_product(self, products: list[Product], message: str) -> Product | None:
        requested = self._extract_requested_name(message)
        if not requested:
            return None
        requested_tokens = [t for t in requested.split(" ") if len(t) > 1]
        best: Product | None = None
        best_score = 0
        for product in products:
            name_norm = self._normalize(product.name)
            score = 0
            if requested == name_norm or requested in name_norm or name_norm in requested:
                score += 10
            token_hits = sum(1 for t in requested_tokens if t in name_norm)
            score += token_hits * 2
            if requested_tokens and token_hits == len(requested_tokens):
                score += 4
            if score > best_score:
                best_score = score
                best = product
        return best if best_score >= 6 else None

    def _infer_topic_from_message(self, products: list[Product], message: str) -> str | None:
        normalized = self._normalize(message)
        if not normalized:
            return None
        best_score = 0
        best_category: str | None = None
        tokens = [t for t in normalized.split(" ") if len(t) > 1]
        for product in products:
            p_text = self._normalize(f"{product.name} {product.description} {product.category}")
            score = sum(2 for token in tokens if token in p_text)
            if score > best_score:
                best_score = score
                best_category = product.category
        return best_category if best_score > 0 else None

    def _is_greeting(self, message: str) -> bool:
        lowered = message.lower().strip()
        normalized = self._normalize(message)
        greeting_keys = ["xin chao", "chao", "hello", "hi", "alo", "shop oi", "xin chào", "chào", "shop ơi"]
        return any(
            k == normalized
            or normalized.startswith(k + " ")
            or k == lowered
            or lowered.startswith(k + " ")
            for k in greeting_keys
        )

    def _is_detail_intent(self, message: str) -> bool:
        normalized = self._normalize(message)
        return any(k in normalized for k in ["chi tiet", "mo ta", "co gi hay", "giai thich"])

    def _is_affirmative(self, message: str) -> bool:
        normalized = self._normalize(message)
        return normalized in {"co", "ok", "dong y", "duoc", "yes"} or "co mua" in normalized

    def _is_negative(self, message: str) -> bool:
        normalized = self._normalize(message)
        return normalized in {"khong", "ko", "khong mua", "de sau", "no"}

    def _normalize(self, text: str) -> str:
        lowered = text.lower().strip()
        lowered = lowered.replace("đ", "d")
        no_accent = "".join(
            ch for ch in unicodedata.normalize("NFD", lowered) if unicodedata.category(ch) != "Mn"
        )
        no_accent = re.sub(r"[^a-z0-9\s]", " ", no_accent)
        return re.sub(r"\s+", " ", no_accent).strip()

