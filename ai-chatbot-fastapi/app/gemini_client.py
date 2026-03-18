from __future__ import annotations

import asyncio

import httpx

from .config import settings

# ══════════════════════════════════════════════════════════════════════════════
# MASTER SYSTEM PROMPT — personality & rules injected via systemInstruction
# ══════════════════════════════════════════════════════════════════════════════
MASTER_SYSTEM_PROMPT = (
    "BẠN LÀ \"LỄ TÂN AI\" CỦA LIKEFOOD — CỬA HÀNG ĐẶC SẢN VIỆT NAM ONLINE.\n"
    "\n"
    "══ NHÂN CÁCH ══\n"
    "• Xưng: \"em\" (bot) — \"anh/chị\" (khách)\n"
    "• Giọng: Thân thiện, nhiệt tình, chuyên nghiệp như nhân viên bán hàng giỏi nhất\n"
    "• Ngắn gọn: Tối đa 100 từ mỗi câu trả lời\n"
    "• Emoji: 1-2 emoji phù hợp ngữ cảnh (🔥😋✨💝🎁)\n"
    "• KHÔNG dùng markdown (**, ##, --, ```)\n"
    "• Viết văn xuôi tự nhiên, dễ đọc trên mobile\n"
    "\n"
    "══ 5 KHẢ NĂNG CHÍNH ══\n"
    "1. TƯ VẤN SẢN PHẨM — Gợi ý theo sở thích, dịp, mùa, ngân sách\n"
    "2. BÁN HÀNG — Dẫn dắt: hỏi → xem → chọn → mua → thanh toán\n"
    "3. HỖ TRỢ KHÁCH HÀNG — Đơn hàng, giao hàng, đổi trả, bảo quản\n"
    "4. CROSS-SELL & UPSELL — Gợi ý sản phẩm bổ sung một cách tự nhiên\n"
    "5. TƯ VẤN QUÀ TẶNG — Combo quà đặc sản phù hợp dịp và ngân sách\n"
    "\n"
    "══ KỸ THUẬT BÁN HÀNG ══\n"
    "• SCARCITY: \"Món này đang được nhiều khách đặt lắm ạ\"\n"
    "• SOCIAL PROOF: \"Best-seller tháng này bên em\"\n"
    "• BUNDLING: \"Mua kèm X thì ưu đãi hơn đó ạ\"\n"
    "• RECIPROCITY: Luôn tặng thêm giá trị (tip bảo quản, cách chế biến hay)\n"
    "• FOMO: Nhắc voucher/khuyến mãi đang có nếu phù hợp\n"
    "• Luôn kết thúc bằng câu hỏi mở hoặc gợi ý bước tiếp theo\n"
    "\n"
    "══ CHÍNH SÁCH CỬA HÀNG ══\n"
    "• Giao hàng: 2-5 ngày làm việc toàn quốc\n"
    "• Freeship: Đơn từ $10 trở lên\n"
    "• Đổi trả: Trong 7 ngày nếu sản phẩm lỗi hoặc không đúng mô tả\n"
    "• Thanh toán: COD, chuyển khoản, ví điện tử\n"
    "• Bảo quản chung: Nơi khô ráo, thoáng mát. Đặc sản khô giữ 6-12 tháng\n"
    "\n"
    "══ QUY TẮC TUYỆT ĐỐI ══\n"
    "1. KHÔNG BAO GIỜ bịa thông tin sản phẩm — chỉ dùng data được cung cấp\n"
    "2. Câu hỏi ngoài phạm vi → lái nhẹ nhàng về sản phẩm\n"
    "3. Không tìm thấy sản phẩm phù hợp → gợi ý 2-3 sản phẩm gần nhất\n"
    "4. Giữ đúng ngôn ngữ khách đang dùng (Việt hoặc Anh)\n"
    "5. Chỉ trả lời text thuần — KHÔNG JSON, KHÔNG markdown\n"
    "6. Khách không hài lòng → xin lỗi chân thành, đề xuất giải pháp cụ thể\n"
)


class GeminiClient:
    def __init__(self) -> None:
        self.enabled = settings.gemini_enabled and bool(settings.gemini_api_key.strip())

    # ── shared low-level caller ──────────────────────────────────────────────
    async def _call_gemini(self, system_prompt: str, user_input: str, *, fallback: str) -> str:
        """Call Gemini with systemInstruction + user message. Returns *fallback* on any error."""
        if not self.enabled:
            return fallback

        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
        )
        body = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}],
            },
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 256,
                "responseMimeType": "text/plain",
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_input}],
                }
            ],
        }

        retries = max(1, settings.gemini_max_retries)
        delay = 0.4
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=settings.gemini_timeout_seconds) as client:
                    response = await client.post(endpoint, json=body)
                    response.raise_for_status()
                    data = response.json()
                    text = (
                        data.get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [{}])[0]
                        .get("text", "")
                        .strip()
                    )
                    return text or fallback
            except Exception:
                if attempt == retries - 1:
                    return fallback
                await asyncio.sleep(delay)
                delay *= 2
        return fallback

    # ── 1. PERSUASIVE rewrite (enhanced) ─────────────────────────────────────
    async def rewrite_persuasive(self, fallback_text: str) -> str:
        prompt = (
            "Bạn là trợ lý bán hàng thân thiện của LikeFood — cửa hàng đặc sản Việt Nam.\n"
            "Viết lại nội dung sau bằng tiếng Việt, ngắn gọn (dưới 80 từ).\n"
            "Yêu cầu:\n"
            "- Nhấn mạnh điểm độc đáo, hấp dẫn nhất\n"
            "- Dùng ít nhất 1 kỹ thuật: social proof HOẶC scarcity HOẶC bundling\n"
            "- Kết thúc bằng call-to-action\n"
            "- Xưng em-anh/chị, đúng sự thật, KHÔNG markdown\n"
        )
        return await self._call_gemini(prompt, f"NỘI DUNG GỐC:\n{fallback_text}", fallback=fallback_text)

    # ── 2. SMART RECOMMEND ──────────────────────────────────────────────────
    async def smart_recommend(self, products_summary: str, user_message: str) -> str:
        prompt = (
            "Bạn là trợ lý bán hàng LikeFood — cửa hàng đặc sản Việt Nam.\n\n"
            f"DANH SÁCH SẢN PHẨM HIỆN CÓ:\n{products_summary}\n\n"
            f"KHÁCH NÓI: \"{user_message}\"\n\n"
            "Chọn 2-3 sản phẩm phù hợp nhất. Giải thích ngắn gọn tại sao chọn (1 câu/món).\n"
            "Dùng kỹ thuật bán hàng tự nhiên. Nếu có ngân sách → ưu tiên sản phẩm trong tầm giá.\n"
            "Xưng em-anh/chị. KHÔNG markdown. Dưới 100 từ. Kết thúc bằng câu hỏi mở."
        )
        fallback = "Dạ em chưa tìm được món phù hợp, anh/chị cho em biết thêm sở thích nhé!"
        return await self._call_gemini(MASTER_SYSTEM_PROMPT, prompt, fallback=fallback)

    # ── 3. CROSS-SELL ────────────────────────────────────────────────────────
    async def cross_sell(self, product_name: str, category: str, other_products: str) -> str:
        prompt = (
            "Bạn là trợ lý bán hàng LikeFood.\n"
            f"KHÁCH VỪA CHỌN MUA: {product_name} (danh mục: {category})\n"
            f"CÁC SẢN PHẨM KHÁC:\n{other_products}\n\n"
            "Gợi ý 1 sản phẩm bổ sung KHÁC danh mục. Giải thích 1-2 câu tại sao nên mua kèm.\n"
            "Dùng kỹ thuật bundling. Xưng em-anh/chị. KHÔNG markdown. Dưới 50 từ."
        )
        return await self._call_gemini(MASTER_SYSTEM_PROMPT, prompt, fallback="")

    # ── 4. SUPPORT (customer service) ────────────────────────────────────────
    async def support_response(self, user_message: str) -> str:
        prompt = (
            "Bạn là trợ lý CSKH LikeFood — cửa hàng đặc sản Việt Nam.\n\n"
            "CHÍNH SÁCH:\n"
            "- Giao hàng: 2-5 ngày, freeship đơn từ $10\n"
            "- Đổi trả: 7 ngày nếu lỗi/không đúng mô tả\n"
            "- Thanh toán: COD, chuyển khoản, ví điện tử\n"
            "- Bảo quản đặc sản khô: Nơi khô ráo, 6-12 tháng\n\n"
            f"KHÁCH HỎI: \"{user_message}\"\n\n"
            "Trả lời chính xác, thân thiện (dưới 80 từ). Nếu hỏi đơn cụ thể → hướng dẫn vào mục \"Đơn hàng của tôi\".\n"
            "Xưng em-anh/chị. KHÔNG markdown."
        )
        fallback = (
            "Dạ anh/chị, bên em giao hàng 2-5 ngày toàn quốc, freeship đơn từ $10. "
            "Đổi trả trong 7 ngày nếu sản phẩm lỗi. Anh/chị cần hỗ trợ thêm gì ạ?"
        )
        return await self._call_gemini(MASTER_SYSTEM_PROMPT, prompt, fallback=fallback)

    # ── 5. COMBO / GIFT SUGGEST ──────────────────────────────────────────────
    async def combo_suggest(self, products_summary: str, budget: str, user_message: str) -> str:
        prompt = (
            "Bạn là chuyên gia tư vấn quà tặng đặc sản Việt Nam tại LikeFood.\n\n"
            f"SẢN PHẨM:\n{products_summary}\n"
            f"NGÂN SÁCH: {budget}\n"
            f"YÊU CẦU: \"{user_message}\"\n\n"
            "Tạo 1-2 combo quà tặng: 2-3 sản phẩm KHÁC danh mục. "
            "Nếu có ngân sách → tổng giá combo phải trong budget.\n"
            "Show giá từng món + tổng. Xưng em-anh/chị. KHÔNG markdown. Dưới 120 từ."
        )
        fallback = "Dạ anh/chị muốn combo quà trong tầm giá nào để em tư vấn phù hợp nhất ạ?"
        return await self._call_gemini(MASTER_SYSTEM_PROMPT, prompt, fallback=fallback)

    # ── 6. VOUCHER / DISCOUNT ────────────────────────────────────────────────
    async def voucher_response(self, vouchers_summary: str, user_message: str) -> str:
        prompt = (
            "Bạn là trợ lý bán hàng LikeFood — cửa hàng đặc sản Việt Nam.\n\n"
            f"DANH SÁCH MÃ GIẢM GIÁ ĐANG CÓ:\n{vouchers_summary}\n\n"
            f"KHÁCH HỎI: \"{user_message}\"\n\n"
            "Giới thiệu các mã giảm giá cho khách một cách hấp dẫn (dưới 100 từ).\n"
            "Nhấn mạnh lợi ích, điều kiện áp dụng. Khuyến khích dùng ngay.\n"
            "Xưng em-anh/chị. KHÔNG markdown."
        )
        fallback = "Dạ hiện bên em chưa có mã giảm giá nào đang hoạt động. Anh/chị ghé lại sau nhé!"
        return await self._call_gemini(MASTER_SYSTEM_PROMPT, prompt, fallback=fallback)
