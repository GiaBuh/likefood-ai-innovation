from __future__ import annotations

import random
import re
import unicodedata
import uuid

from .backend_client import BackendClient, ComboDict, VoucherDict
from .budget import format_usd, parse_budget_value, pick_variants_for_budget
from .config import settings
from .seasonal import get_current_seasonal_event, get_seasonal_greeting, filter_seasonal_products
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
        self.debug_context_enabled = settings.ai_debug_context_enabled

    async def respond(self, request: AiChatRequest, auth_header: str | None = None) -> AiAssistantResponse:
        message = (request.message or "").strip()
        language = "en" if request.preferredLanguage == "en" else "vi"
        context = request.context or AiChatContext()
        products = await self.backend.fetch_products()
        product_map = {p.id: p for p in products}
        # Convert history for Gemini
        chat_history = [{"role": h.role, "content": h.content} for h in (request.history or [])][-10:]

        # Stateful flow first
        state_response = await self._handle_stateful(message, context, product_map, language)
        if state_response:
            return self._attach_debug_meta(state_response, context.awaiting)

        # Receptionist-style welcome for greeting messages.
        if self._is_greeting(message):
            featured = products[:3]
            seasonal_greeting = get_seasonal_greeting()
            base_greeting = "Chào mừng anh/chị đến LikeFood! Em là lễ tân AI, rất vui được hỗ trợ."
            if seasonal_greeting:
                base_greeting = f"{base_greeting} {seasonal_greeting}"
            else:
                base_greeting = f"{base_greeting} Hôm nay anh/chị muốn em gợi ý món ngon không ạ?"
            return self._attach_debug_meta(AiAssistantResponse(
                reply=base_greeting,
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
            ), context.awaiting)

        # ── Order tracking intent ──
        if self._is_order_tracking_intent(message):
            response = await self._handle_order_tracking(message, language, auth_header)
            return self._attach_debug_meta(response, context.awaiting)

        # ── Reorder / purchase history intent ──
        if self._is_reorder_intent(message):
            response = await self._handle_reorder(message, products, language, auth_header)
            return self._attach_debug_meta(response, context.awaiting)

        # ── Compare products intent ──
        if self._is_compare_intent(message):
            response = await self._handle_compare(message, products, language)
            if response:
                return self._attach_debug_meta(response, context.awaiting)

        # ── NEW: Support intent (shipping, returns, payment, storage) ──
        if self._is_support_intent(message):
            support_reply = await self.gemini.support_response(message, history=chat_history)
            return self._attach_debug_meta(AiAssistantResponse(
                reply=support_reply,
                language=language,
                nextContext=AiChatContext(awaiting=AWAITING_NONE),
                recommendationMeta=AiRecommendationMeta(
                    reason="CSKH - Ho tro khach hang",
                    offerType="primary",
                    fallbackLevel="SAFE",
                    confidenceBand="high",
                    intent="CUSTOMER_SUPPORT",
                    formatProfile="simple_cta",
                ),
            ), context.awaiting)

        # ── Seasonal / holiday intent ──
        if self._is_seasonal_intent(message):
            response = await self._handle_seasonal(message, products, language)
            if response:
                return self._attach_debug_meta(response, context.awaiting)

        # ── NEW: Voucher / discount intent ──
        if self._is_voucher_intent(message):
            vouchers = await self.backend.fetch_active_vouchers()
            if vouchers:
                vouchers_summary = self._build_vouchers_summary(vouchers)
                voucher_reply = await self.gemini.voucher_response(vouchers_summary, message)
            else:
                voucher_reply = "Dạ hiện bên em chưa có mã giảm giá nào đang hoạt động. Anh/chị ghé lại sau hoặc để em gợi ý món ngon nhé! 😊"
            return self._attach_debug_meta(AiAssistantResponse(
                reply=voucher_reply,
                language=language,
                actions=[AiChatAction(type="navigate", label="Xem trang Voucher 🎁", command="/navigate:vouchers")],
                nextContext=AiChatContext(awaiting=AWAITING_NONE),
                recommendationMeta=AiRecommendationMeta(
                    reason="Thong tin voucher/khuyen mai",
                    offerType="primary",
                    fallbackLevel="SAFE",
                    confidenceBand="high",
                    intent="VOUCHER_INQUIRY",
                    formatProfile="simple_cta",
                ),
            ), context.awaiting)

        # ── NEW: Combo / gift intent ──
        if self._is_combo_intent(message):
            published_combos = await self.backend.fetch_published_combos()
            if published_combos:
                # Build a descriptive reply directly from combo data
                combo_lines: list[str] = []
                for c in published_combos[:5]:  # type: ComboDict
                    name = c.get("comboName", "Combo")
                    discount = c.get("discountPercentage", 0)
                    combo_price = c.get("comboPrice")
                    slogan = c.get("slogan", "")

                    # Get item names
                    combo_items = c.get("comboItems", [])
                    item_names = []
                    for item in combo_items[:5]:
                        product = item.get("product", {})
                        if product:
                            item_names.append(product.get("name", ""))
                    items_str = ", ".join(n for n in item_names if n)

                    line = f"🔥 {name}"
                    if discount and float(discount) > 0:
                        line += f" (giảm {int(float(discount))}%)"
                    if combo_price:
                        line += f" — chỉ ${combo_price}"
                    if slogan:
                        line += f'. "{slogan}"'
                    if items_str:
                        line += f" | Gồm: {items_str}"
                    combo_lines.append(line)

                rule_reply = f"Dạ bên em đang có {len(published_combos)} combo deal cực hot ạ! "
                rule_reply += " ".join(combo_lines)
                rule_reply += " Anh/chị bấm xem combo nào để em tư vấn chi tiết nhé! 😋"

                # Try Gemini enhancement, fallback to rule-based
                combos_summary = self._build_combos_summary(published_combos)
                gemini_reply = await self.gemini.combo_suggest(
                    combos_summary, "có sẵn",
                    f"Khách hỏi: {message}. Giới thiệu các combo deal đang có.",
                )
                # Use Gemini reply only if it's NOT the default fallback
                if gemini_reply and "muốn combo quà trong tầm giá" not in gemini_reply:
                    combo_reply = gemini_reply
                else:
                    combo_reply = rule_reply

                # Build a name→slug lookup from products (combos are also products)
                name_to_slug: dict[str, str] = {}
                for p in products:
                    name_to_slug[self._normalize(p.name)] = p.slug or p.id

                combo_actions = []
                for c in published_combos[:5]:
                    combo_name = c.get("comboName", "Combo")
                    combo_id = c.get("id", "")
                    if combo_id:
                        combo_actions.append(
                            AiChatAction(
                                type="open_product",
                                label=f"Xem {combo_name}",
                                productId=combo_id,
                            )
                        )
                        combo_actions.append(
                            AiChatAction(
                                type="buy_combo",
                                label=f"Mua {combo_name}",
                                productId=combo_id,
                            )
                        )
                    else:
                        combo_actions.append(
                            AiChatAction(
                                type="navigate",
                                label=f"Xem {combo_name}",
                                command="/navigate:combo",
                            )
                        )
                combo_actions.append(
                    AiChatAction(type="navigate", label="Xem tất cả Combo 🔥", command="/navigate:combo")
                )
            else:
                budget_val = parse_budget_value(message)
                budget_str = format_usd(budget_val) if budget_val else "không giới hạn"
                products_summary = self._build_products_summary(products)
                combo_reply = await self.gemini.combo_suggest(products_summary, budget_str, message)
                combo_actions = [
                    AiChatAction(type="show-more-options", label="Xem thêm sản phẩm", command="/show-more"),
                ]

            return self._attach_debug_meta(AiAssistantResponse(
                reply=combo_reply,
                language=language,
                actions=combo_actions,
                nextContext=AiChatContext(awaiting=AWAITING_NONE),
                recommendationMeta=AiRecommendationMeta(
                    reason="Tu van combo qua tang",
                    offerType="primary",
                    fallbackLevel="SAFE",
                    confidenceBand="high",
                    intent="COMBO_GIFT",
                    formatProfile="recommendation_list",
                ),
            ), context.awaiting)

        requested_category = self._detect_requested_category(products, message)
        if requested_category:
            filtered = [p for p in products if self._normalize(p.category) == self._normalize(requested_category)]
            if filtered:
                return self._attach_debug_meta(
                    await self._build_recommendation_response(
                        filtered,
                        message,
                        context,
                        language,
                        selected_category=requested_category,
                        chat_history=chat_history,
                    ),
                    context.awaiting,
                )

        # Broad query -> ask category clarification first
        if self._is_broad_query(message) and not parse_budget_value(message):
            categories = sorted({p.category for p in products if p.category})[:6]
            return self._attach_debug_meta(AiAssistantResponse(
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
            ), context.awaiting)

        category_from_command = self._parse_category_command(message)
        if category_from_command:
            filtered = [p for p in products if p.category.lower() == category_from_command.lower()]
            return self._attach_debug_meta(await self._build_recommendation_response(
                filtered or products, message, context, language, selected_category=category_from_command, chat_history=chat_history
            ), context.awaiting)

        return self._attach_debug_meta(
            await self._build_recommendation_response(products, message, context, language, chat_history=chat_history),
            context.awaiting,
        )

    def _should_break_state(self, message: str, context: AiChatContext, product_map: dict[str, Product]) -> bool:
        """Return True if user's message indicates they want to leave the current stateful flow."""
        if not context.awaiting or context.awaiting == AWAITING_NONE:
            return False
        # Never break state for command messages (e.g. /confirm-product:123)
        if message.startswith("/"):
            return False
        return (
            self._is_support_intent(message)
            or self._is_voucher_intent(message)
            or self._is_combo_intent(message)
            or self._is_broad_query(message)
            or self._is_greeting(message)
            or bool(parse_budget_value(message))
        )

    async def _handle_stateful(
        self, message: str, context: AiChatContext, product_map: dict[str, Product], language: str
    ) -> AiAssistantResponse | None:
        # Parse commands FIRST — they must always be handled deterministically
        command_name, command_arg = self._parse_command(message)
        selected_product = product_map.get(context.selectedProductId or "")
        requested_qty = self._parse_quantity(message)

        # Process deterministic commands before break-state check
        if command_name == "buy-product" and command_arg:
            target = product_map.get(command_arg)
            if target:
                return await self._build_product_confirmation(target, language, pending_quantity=context.pendingQuantity)
        if command_name == "open-product" and command_arg:
            target = product_map.get(command_arg)
            if target:
                return await self._build_product_detail_followup(target, language)
        if command_name == "confirm-product":
            if selected_product:
                return self._ask_variant_or_quantity(selected_product, language, context.pendingQuantity)
            if command_arg:
                target = product_map.get(command_arg)
                if target:
                    return self._ask_variant_or_quantity(target, language, context.pendingQuantity)
        if command_name == "reject-product":
            preferred_category = selected_product.category if selected_product else context.pendingCategory
            return self._build_three_alternatives(
                list(product_map.values()), language, preferred_category,
                intro_reply="Dạ vâng, em đổi món ngay cho anh/chị nè. Hiện tại bên em có các món sau, anh/chị xem thử có ưng món nào không ạ:",
            )
        if command_name == "show-more":
            return self._build_three_alternatives(
                list(product_map.values()), language, context.pendingCategory,
            )
        if command_name == "choose-variant" and command_arg and selected_product:
            chosen_variant = next((v for v in selected_product.variants if v.id == command_arg), None)
            if chosen_variant:
                quantity = context.pendingQuantity
                if quantity is None:
                    return self._ask_quantity_only(selected_product, chosen_variant, language)
                base_reply = f"Đã thêm {quantity} x {selected_product.name} ({chosen_variant.weight_label}) vào giỏ hàng."
                cross_sell_text = await self.gemini.cross_sell(
                    selected_product.name, selected_product.category,
                    self._build_products_summary([p for p in list(product_map.values()) if p.category != selected_product.category], limit=10),
                )
                if cross_sell_text:
                    base_reply = f"{base_reply} {cross_sell_text}"
                else:
                    base_reply = f"{base_reply} Anh/chị muốn thanh toán ngay không ạ?"
                return AiAssistantResponse(
                    reply=base_reply, language=language,
                    actions=[
                        AiChatAction(type="go_checkout", label="Thanh toán ngay", command="/go-checkout"),
                        AiChatAction(type="show-more-options", label="Xem thêm món", command="/show-more"),
                    ],
                    nextContext=AiChatContext(awaiting=AWAITING_CHECKOUT, selectedProductId=selected_product.id, selectedVariantId=chosen_variant.id),
                )

        # After commands, allow user to break out of stateful flow if they change intent
        if self._should_break_state(message, context, product_map):
            return None

        # User explicitly wants to switch item via free text.
        if self._is_switch_product_intent(message):
            preferred_category = selected_product.category if selected_product else context.pendingCategory
            return self._build_three_alternatives(
                list(product_map.values()),
                language,
                preferred_category,
                intro_reply="Dạ vâng, em đổi món ngay cho anh/chị nè. Hiện tại bên em có các món sau, anh/chị xem thử có ưng món nào không ạ:",
            )

        # Any state: if user asks availability for another product, immediately switch context.
        if self._is_availability_intent(message):
            switched_product = self._find_exact_product(list(product_map.values()), message)
            if switched_product and (not selected_product or switched_product.id != selected_product.id):
                return await self._build_product_confirmation(switched_product, language, pending_quantity=requested_qty)

        if context.awaiting == AWAITING_PRODUCT_CONFIRMATION and selected_product:
            # User asks to explain current product: answer detail and keep current product context.
            if self._is_detail_intent(message):
                return await self._build_product_detail_followup(selected_product, language)

            # If user asks about another product, replace current context with the new product.
            switched_product = self._find_exact_product(list(product_map.values()), message)
            if switched_product and switched_product.id != selected_product.id:
                return await self._build_product_confirmation(switched_product, language, pending_quantity=requested_qty)

            if command_name == "confirm-product" or self._is_affirmative(message):
                return self._ask_variant_or_quantity(selected_product, language, context.pendingQuantity)
            if self._is_negative(message):
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

            # ── NEW: Cross-sell after adding to cart ──
            base_reply = f"Đã thêm {quantity} x {selected_product.name} ({chosen_variant.weight_label}) vào giỏ hàng."
            cross_sell_text = await self.gemini.cross_sell(
                selected_product.name,
                selected_product.category,
                self._build_products_summary(
                    [p for p in list(product_map.values()) if p.category != selected_product.category],
                    limit=10,
                ),
            )
            if cross_sell_text:
                base_reply = f"{base_reply} {cross_sell_text}"
            else:
                base_reply = f"{base_reply} Anh/chị muốn thanh toán ngay không ạ?"

            return AiAssistantResponse(
                reply=base_reply,
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
                    reply="Dạ anh/chị, em giữ giỏ hàng để mình mua tiếp ạ. Anh/chị muốn xem thêm món nào?",
                    language=language,
                    actions=[AiChatAction(type="show-more-options", label="Xem thêm món", command="/show-more")],
                    nextContext=AiChatContext(awaiting=AWAITING_NONE),
                )
            # User asked about something else (product, support, etc.) — break out of checkout
            # and let normal intent processing handle it
            return None

        return None

    async def _build_recommendation_response(
        self,
        products: list[Product],
        message: str,
        context: AiChatContext,
        language: str,
        selected_category: str | None = None,
        chat_history: list[dict] | None = None,
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
                    lines.append(f"- {product.name} ({variant.weight_label}) - {format_usd(variant.price)}")
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
            # No match at all — find the cheapest product to suggest a minimum budget
            cheapest = sorted(
                [
                    (product, variant)
                    for product in products
                    for variant in product.variants
                    if variant.quantity > 0
                ],
                key=lambda item: item[1].price,
            )
            if cheapest:
                min_price = cheapest[0][1].price
                min_product = cheapest[0][0]
                reply_text = (
                    f"Dạ với ngân sách {format_usd(budget)}, hiện tại em chưa có món nào phù hợp.\n"
                    f"Sản phẩm rẻ nhất bên em là {min_product.name} giá {format_usd(min_price)}.\n"
                    f"Anh/chị có muốn nâng ngân sách lên khoảng {format_usd(min_price)} hoặc xem sản phẩm khác không ạ?"
                )
            else:
                reply_text = f"Dạ với ngân sách {format_usd(budget)}, hiện tại em chưa có sản phẩm nào phù hợp. Anh/chị thử mức cao hơn nhé!"
            return AiAssistantResponse(
                reply=reply_text,
                language=language,
                actions=[
                    AiChatAction(type="show-more-options", label="Xem sản phẩm khác", command="/show-more"),
                ],
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
                reply="Dạ hiện tại bên em chưa có đúng món anh/chị hỏi. Em gợi ý vài món cùng chủ đề để anh/chị tham khảo nhé:",
                language=language,
                **self._build_three_alternatives(products, language, topic_category).model_dump(
                    include={"actions", "matchedProductIds", "nextContext", "recommendationMeta"}
                ),
            )

        # Product search / detail / buy flow
        matches = self._search_products(products, message)
        if not matches:
            # ── NEW: Use Gemini smart_recommend instead of generic 3 alternatives ──
            products_summary = self._build_products_summary(products)
            smart_reply = await self.gemini.smart_recommend(products_summary, message, history=chat_history or [])
            topic_category = selected_category or self._infer_topic_from_message(products, message)
            fallback = self._build_three_alternatives(products, language, topic_category)
            if smart_reply and smart_reply != fallback.reply:
                fallback.reply = smart_reply
                fallback.recommendationMeta = AiRecommendationMeta(
                    reason="AI smart recommend",
                    offerType="related",
                    fallbackLevel="RELATED",
                    confidenceBand="medium",
                    intent="SMART_RECOMMEND",
                    formatProfile="recommendation_list",
                )
            return fallback

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

    async def _build_product_confirmation(
        self, product: Product, language: str, pending_quantity: int | None = None
    ) -> AiAssistantResponse:
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
            nextContext=AiChatContext(
                awaiting=AWAITING_PRODUCT_CONFIRMATION,
                selectedProductId=product.id,
                pendingQuantity=pending_quantity,
            ),
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

    def _build_three_alternatives(
        self,
        products: list[Product],
        language: str,
        selected_category: str | None,
        intro_reply: str | None = None,
    ) -> AiAssistantResponse:
        pool = [p for p in products if not selected_category or p.category.lower() == selected_category.lower()]
        if not pool or (selected_category and len(pool) <= 1):
            pool = products
        picks = random.sample(pool, k=min(3, len(pool)))
        return AiAssistantResponse(
            reply=intro_reply or "Dạ vâng hiện tại bên em có các món như sau, không biết anh/chị có quan tâm không ạ:",
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

    def _attach_debug_meta(self, response: AiAssistantResponse, from_awaiting: str | None = None) -> AiAssistantResponse:
        if not self.debug_context_enabled:
            return response
        if response.recommendationMeta is None:
            response.recommendationMeta = AiRecommendationMeta()
        response.recommendationMeta.debugContextId = f"ctx-{uuid.uuid4().hex[:8]}"
        response.recommendationMeta.debugFromAwaiting = from_awaiting or AWAITING_NONE
        response.recommendationMeta.debugToAwaiting = response.nextContext.awaiting or AWAITING_NONE
        return response

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
            "lien",
            "quan",
            "den",
            "toi",
            "muon",
            "an",
            "do",
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
        is_availability = ("co " in normalized and " khong" in normalized) or normalized.startswith("co ")
        if not is_availability:
            return False
        # Exclude messages that match higher-priority intents
        if self._is_combo_intent(message) or self._is_voucher_intent(message) or self._is_support_intent(message):
            return False
        return True

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

    def _detect_requested_category(self, products: list[Product], message: str) -> str | None:
        normalized = self._normalize(message)
        if not normalized:
            return None

        alias_map = {
            "hat": {"hat", "hat dieu", "ngu coc", "nuts"},
            "kho": {"kho", "do kho", "mon kho"},
            "banh": {"banh", "banh trang", "snack"},
            "mut": {"mut", "mut dua"},
            "muc": {"muc", "hai san", "muc rim"},
        }

        categories_by_norm: dict[str, str] = {}
        for product in products:
            norm_cat = self._normalize(product.category)
            if norm_cat and norm_cat not in categories_by_norm:
                categories_by_norm[norm_cat] = product.category

        for norm_cat, original_cat in categories_by_norm.items():
            if norm_cat in normalized:
                return original_cat
            aliases = alias_map.get(norm_cat, {norm_cat})
            if any(alias in normalized for alias in aliases):
                return original_cat
        return None

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

    def _is_switch_product_intent(self, message: str) -> bool:
        normalized = self._normalize(message)
        switch_keys = {
            "doi mon khac",
            "doi mon",
            "mon khac",
            "xem mon khac",
            "tim mon khac",
        }
        return normalized in switch_keys or any(k in normalized for k in {"doi mon khac", "xem mon khac"})

    # ── NEW intent detectors ─────────────────────────────────────────────────
    def _is_support_intent(self, message: str) -> bool:
        normalized = self._normalize(message)
        support_keys = [
            "giao hang", "don hang", "doi tra", "bao quan", "ship",
            "van chuyen", "khieu nai", "hoan tien", "phan nan",
            "thanh toan", "tra hang", "delivery", "shipping",
            "giao bao lau", "phí ship", "phi van chuyen",
        ]
        return any(k in normalized for k in support_keys)

    def _is_combo_intent(self, message: str) -> bool:
        normalized = self._normalize(message)
        combo_keys = [
            "qua tang", "combo", "set qua", "sinh nhat", "tet",
            "bieu", "hop qua", "qua bieu", "gift", "tang qua",
            "qua tet", "qua noel", "qua giang sinh",
        ]
        return any(k in normalized for k in combo_keys)

    def _is_voucher_intent(self, message: str) -> bool:
        normalized = self._normalize(message)
        voucher_keys = [
            "voucher", "ma giam gia", "khuyen mai", "discount", "coupon",
            "giam gia", "code giam", "promo", "uu dai",
        ]
        return any(k in normalized for k in voucher_keys)

    # ── NEW helper: build products summary for Gemini ────────────────────────
    def _build_products_summary(self, products: list[Product], limit: int = 20) -> str:
        lines: list[str] = []
        for p in products[:limit]:
            variant_parts = []
            for v in p.variants[:4]:
                variant_parts.append(f"{v.weight_label}: {format_usd(v.price)}")
            variants_str = ", ".join(variant_parts) if variant_parts else "liên hệ"
            lines.append(f"• {p.name} [{p.category}] — {variants_str}")
        return "\n".join(lines) if lines else "Không có sản phẩm"


    # ── NEW helper: build vouchers summary for Gemini ────────────────────────
    def _build_vouchers_summary(self, vouchers: list[VoucherDict]) -> str:
        lines: list[str] = []

        for v in vouchers[:10]:
            code = v.get("code", "???")
            discount_type = v.get("discountType", "")
            discount_value = v.get("discountValue", 0)
            min_order = v.get("minOrderValue", 0)
            voucher_type = v.get("type", "")

            if discount_type == "PERCENT":
                desc = f"Giảm {discount_value}%"
            else:
                desc = f"Giảm ${discount_value}"

            if voucher_type == "SHIPPING_DISCOUNT":
                desc += " phí ship"

            if min_order and float(min_order) > 0:
                desc += f" (đơn từ ${min_order})"

            lines.append(f"• Mã: {code} — {desc}")
        return "\n".join(lines) if lines else "Không có mã giảm giá"

    # ── NEW helper: build combos summary for Gemini ──────────────────────────
    def _build_combos_summary(self, combos: list[ComboDict]) -> str:
        lines: list[str] = []
        for c in combos[:10]:
            name = c.get("comboName", "Combo")
            discount = c.get("discountPercentage", 0)
            combo_price = c.get("comboPrice")
            source = c.get("source", "")
            desc = c.get("description", "")

            line = f"• {name}"
            if discount and float(discount) > 0:
                line += f" (giảm {int(float(discount))}%)"
            if combo_price:
                line += f" — Giá combo: ${combo_price}"

            # Extract item names if available
            combo_items = c.get("comboItems", [])
            if combo_items and isinstance(combo_items, list):
                item_names = []
                for item in combo_items[:5]:
                    product = item.get("product", {})
                    if product:
                        item_names.append(product.get("name", ""))
                if item_names:
                    line += f" | Gồm: {', '.join(n for n in item_names if n)}"

            if desc:
                line += f" | {desc[:80]}"

            lines.append(line)
        return "\n".join(lines) if lines else "Không có combo"

    # ══════════════════════════════════════════════════════════════════════════
    # NEW INTENT DETECTION + HANDLERS (Phase 3)
    # ══════════════════════════════════════════════════════════════════════════

    # ── 1. ORDER TRACKING ─────────────────────────────────────────────────────
    def _is_order_tracking_intent(self, message: str) -> bool:
        n = self._normalize(message)
        return any(kw in n for kw in [
            "don hang", "don cua toi", "tracking", "giao den dau",
            "tinh trang don", "trang thai don", "theo doi don",
            "my order", "order status", "kiem tra don",
        ])

    async def _handle_order_tracking(
        self, message: str, language: str, auth_header: str | None
    ) -> AiAssistantResponse:
        if not auth_header:
            return AiAssistantResponse(
                reply="Dạ anh/chị cần đăng nhập để xem đơn hàng. Bấm nút bên dưới để đăng nhập nhé!",
                language=language,
                nextContext=AiChatContext(awaiting=AWAITING_NONE),
            )
        orders = await self.backend.fetch_my_orders(auth_header)
        if not orders:
            return AiAssistantResponse(
                reply="Dạ anh/chị chưa có đơn hàng nào. Anh/chị muốn em gợi ý món ngon không ạ?",
                language=language,
                actions=[AiChatAction(type="show-more-options", label="Xem sản phẩm", command="/show-more")],
                nextContext=AiChatContext(awaiting=AWAITING_NONE),
            )
        recent = orders[:3]
        lines = []
        actions: list[AiChatAction] = []
        status_map = {
            "PENDING": "Chờ xác nhận", "CONFIRMED": "Đã xác nhận",
            "SHIPPING": "Đang giao", "DELIVERED": "Đã giao",
            "CANCELLED": "Đã hủy", "PROCESSING": "Đang xử lý",
        }
        for order in recent:
            order_id = order.get("id", "")
            status = order.get("status", "PENDING")
            status_label = status_map.get(status, status)
            total = order.get("totalPrice", 0)
            created = order.get("createdAt", "")[:10]
            items_count = len(order.get("orderItems", []))
            lines.append(f"Đơn #{str(order_id)[-6:]} ({created}) — {status_label} — ${total:.2f} ({items_count} món)")
            actions.append(AiChatAction(
                type="view-orders", label=f"Xem đơn #{str(order_id)[-6:]}", command="/view-orders",
            ))
        reply = "Dạ đây là các đơn hàng gần nhất của anh/chị:\n" + "\n".join(lines)
        return AiAssistantResponse(
            reply=reply, language=language, actions=actions,
            nextContext=AiChatContext(awaiting=AWAITING_NONE),
            recommendationMeta=AiRecommendationMeta(
                reason="Theo doi don hang", offerType="primary",
                fallbackLevel="EXACT", confidenceBand="high",
                intent="ORDER_TRACKING", formatProfile="simple_cta",
            ),
        )

    # ── 2. REORDER (purchase history) ─────────────────────────────────────────
    def _is_reorder_intent(self, message: str) -> bool:
        n = self._normalize(message)
        return any(kw in n for kw in [
            "mua lai", "dat lai", "lan truoc mua", "hom truoc mua",
            "lich su mua", "mua gi truoc", "reorder", "buy again",
            "order lai", "mua tiep",
        ])

    async def _handle_reorder(
        self, message: str, products: list[Product], language: str, auth_header: str | None
    ) -> AiAssistantResponse:
        if not auth_header:
            return AiAssistantResponse(
                reply="Dạ anh/chị cần đăng nhập để em xem lịch sử mua hàng nhé!",
                language=language,
                nextContext=AiChatContext(awaiting=AWAITING_NONE),
            )
        orders = await self.backend.fetch_my_orders(auth_header)
        if not orders:
            return AiAssistantResponse(
                reply="Dạ anh/chị chưa có lịch sử mua hàng. Để em gợi ý một số món ngon nhé!",
                language=language,
                actions=[AiChatAction(type="show-more-options", label="Xem sản phẩm", command="/show-more")],
                nextContext=AiChatContext(awaiting=AWAITING_NONE),
            )
        product_map = {p.id: p for p in products}
        purchased_items: list[str] = []
        purchased_product_ids: list[str] = []
        for order in orders[:10]:
            for item in order.get("orderItems", []):
                product_id = str(item.get("productId", "") or item.get("product", {}).get("id", ""))
                product_name = item.get("productName", "") or item.get("product", {}).get("name", "")
                if product_name and product_name not in purchased_items:
                    purchased_items.append(product_name)
                    if product_id:
                        purchased_product_ids.append(product_id)
        if not purchased_items:
            return AiAssistantResponse(
                reply="Dạ em chưa tìm thấy sản phẩm cụ thể trong đơn cũ. Anh/chị muốn em gợi ý món nào?",
                language=language,
                actions=[AiChatAction(type="show-more-options", label="Xem sản phẩm", command="/show-more")],
                nextContext=AiChatContext(awaiting=AWAITING_NONE),
            )
        history_summary = "Các sản phẩm đã mua: " + ", ".join(purchased_items[:10])
        reorder_reply = await self.gemini.reorder_suggest(history_summary, message)
        actions: list[AiChatAction] = []
        for pid in purchased_product_ids[:4]:
            p = product_map.get(pid)
            if p and p.variants:
                actions.append(AiChatAction(
                    type="buy-product", label=f"Mua lại {p.name}",
                    command=f"/buy-product:{p.id}", productId=p.id,
                ))
        return AiAssistantResponse(
            reply=reorder_reply, language=language, actions=actions[:6],
            matchedProductIds=purchased_product_ids[:6],
            nextContext=AiChatContext(awaiting=AWAITING_NONE),
            recommendationMeta=AiRecommendationMeta(
                reason="Goi y mua lai tu lich su", offerType="reorder",
                fallbackLevel="EXACT", confidenceBand="high",
                intent="REORDER", formatProfile="recommendation_list",
            ),
        )

    # ── 3. COMPARE PRODUCTS ───────────────────────────────────────────────────
    def _is_compare_intent(self, message: str) -> bool:
        n = self._normalize(message)
        return any(kw in n for kw in [
            "so sanh", "khac nhau", "nao ngon hon", "compare",
            "khac gi", "hon gi", "a hay b", "chon cai nao",
        ])

    async def _handle_compare(
        self, message: str, products: list[Product], language: str
    ) -> AiAssistantResponse | None:
        matched = self._search_products(products, message)
        if len(matched) < 2:
            parts = re.split(r'\b(?:hay|va|vs|or|voi)\b', self._normalize(message))
            if len(parts) >= 2:
                matched_a = self._search_products(products, parts[0].strip())
                matched_b = self._search_products(products, parts[1].strip())
                if matched_a and matched_b:
                    matched = [matched_a[0], matched_b[0]]
        if len(matched) < 2:
            return None
        product_a, product_b = matched[0], matched[1]
        summary_a = self._build_single_product_summary(product_a)
        summary_b = self._build_single_product_summary(product_b)
        compare_reply = await self.gemini.compare_products(summary_a, summary_b, message)
        return AiAssistantResponse(
            reply=compare_reply, language=language,
            actions=[
                AiChatAction(type="buy-product", label=f"Mua {product_a.name}", command=f"/buy-product:{product_a.id}", productId=product_a.id),
                AiChatAction(type="buy-product", label=f"Mua {product_b.name}", command=f"/buy-product:{product_b.id}", productId=product_b.id),
                AiChatAction(type="open-product", label=f"Xem {product_a.name}", command=f"/open-product:{product_a.id}", productId=product_a.id),
                AiChatAction(type="open-product", label=f"Xem {product_b.name}", command=f"/open-product:{product_b.id}", productId=product_b.id),
            ],
            matchedProductIds=[product_a.id, product_b.id],
            nextContext=AiChatContext(awaiting=AWAITING_NONE),
            recommendationMeta=AiRecommendationMeta(
                reason="So sanh san pham", offerType="comparison",
                fallbackLevel="EXACT", confidenceBand="high",
                intent="COMPARE", formatProfile="compact_detail",
            ),
        )

    def _build_single_product_summary(self, product: Product) -> str:
        variant_parts = []
        for v in product.variants[:4]:
            variant_parts.append(f"{v.weight_label}: {format_usd(v.price)}")
        variants_str = ", ".join(variant_parts) if variant_parts else "liên hệ"
        desc = (product.description or "")[:100]
        return f"{product.name} [{product.category}] — {variants_str}\n{desc}"

    # ── 4. SEASONAL INTENT ────────────────────────────────────────────────────
    def _is_seasonal_intent(self, message: str) -> bool:
        n = self._normalize(message)
        event = get_current_seasonal_event()
        if not event:
            return False
        return any(kw in n for kw in [
            "mua nay", "dip nay", "theo mua", "seasonal",
            "qua tet", "qua noel", "qua giang sinh",
        ] + [self._normalize(kw) for kw in event.get("keywords", [])])

    async def _handle_seasonal(
        self, message: str, products: list[Product], language: str
    ) -> AiAssistantResponse | None:
        event = get_current_seasonal_event()
        if not event:
            return None
        seasonal_products = filter_seasonal_products(products)
        if not seasonal_products:
            return None
        products_summary = self._build_products_summary(seasonal_products[:10])
        seasonal_reply = await self.gemini.seasonal_recommend(
            event["name"], products_summary, message
        )
        actions: list[AiChatAction] = []
        for p in seasonal_products[:4]:
            actions.append(AiChatAction(
                type="buy-product", label=f"Mua {p.name}",
                command=f"/buy-product:{p.id}", productId=p.id,
            ))
            actions.append(AiChatAction(
                type="open-product", label=f"Xem {p.name}",
                command=f"/open-product:{p.id}", productId=p.id,
            ))
        return AiAssistantResponse(
            reply=seasonal_reply, language=language, actions=actions[:8],
            matchedProductIds=[p.id for p in seasonal_products[:4]],
            nextContext=AiChatContext(awaiting=AWAITING_NONE),
            recommendationMeta=AiRecommendationMeta(
                reason=f"Goi y theo mua: {event['name']}", offerType="seasonal",
                fallbackLevel="RELATED", confidenceBand="high",
                intent="SEASONAL", formatProfile="recommendation_list",
            ),
        )

    def _normalize(self, text: str) -> str:
        lowered = text.lower().strip()
        lowered = lowered.replace("đ", "d")
        no_accent = "".join(
            ch for ch in unicodedata.normalize("NFD", lowered) if unicodedata.category(ch) != "Mn"
        )
        no_accent = re.sub(r"[^a-z0-9\s]", " ", no_accent)
        return re.sub(r"\s+", " ", no_accent).strip()

