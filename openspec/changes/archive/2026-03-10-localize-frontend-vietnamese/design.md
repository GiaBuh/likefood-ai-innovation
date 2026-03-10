## Context

Frontend LikeFood hiện dùng nhiều chuỗi tiếng Anh hardcode trong components (auth, checkout, admin, chat, product, cart, orders...). Chatbot AI phía backend đã hỗ trợ `preferredLanguage` (vi/en), frontend có `chatLanguage` và helper `t(vi, en)` trong `useChatAi`, nhưng UI tổng thể vẫn tiếng Anh. Người dùng muốn toàn bộ giao diện và câu trả lời chatbot đều tiếng Việt.

## Goals / Non-Goals

**Goals:**
- Hiển thị tất cả chuỗi UI (labels, buttons, errors, placeholders, titles) bằng tiếng Việt.
- Mặc định gửi `preferredLanguage: "vi"` khi gọi API AI chat để câu trả lời luôn tiếng Việt.
- Đảm bảo fallback/local responses trong `useChatAi` luôn dùng tiếng Việt khi không có backend.

**Non-Goals:**
- Không xây hệ thống i18n đa ngôn ngữ (chỉ tiếng Việt).
- Không thay đổi logic nghiệp vụ, API, hay backend.
- Không dịch nội dung sản phẩm (tên món, mô tả) – chỉ UI.

## Decisions

### 1) Chuỗi trực tiếp, không thêm thư viện i18n
- **Decision**: Thay chuỗi tiếng Anh bằng chuỗi tiếng Việt trực tiếp trong components.
- **Rationale**: Yêu cầu chỉ có tiếng Việt; thêm i18n (react-i18next, etc.) tăng độ phức tạp không cần thiết.
- **Alternative considered**: Tạo file `frontend/locales/vi.json` rồi dùng `useTranslation` – bỏ qua vì scope đơn ngôn ngữ.

### 2) Tập trung chuỗi UI theo nhóm component
- **Decision**: Cập nhật từng component (layout, home, product, cart, checkout, orders, chat, auth, admin) – mỗi file thay chuỗi tương ứng.
- **Rationale**: Không đổi cấu trúc code; chỉ tìm và thay chuỗi. Dễ review và rollback.
- **Alternative considered**: Tạo `constants/vi.ts` export object – có thể dùng sau nếu muốn tách chuỗi ra.

### 3) Chatbot mặc định tiếng Việt
- **Decision**: Luôn gửi `preferredLanguage: "vi"` trong `askAiAssistant` (hoặc theo `chatLanguage` nếu user chọn en – giữ hành vi hiện tại nhưng default là vi).
- **Rationale**: User muốn chatbot trả lời tiếng Việt; backend đã hỗ trợ.
- **Alternative considered**: Detect từ browser – phức tạp hơn và có thể sai với người Việt dùng browser tiếng Anh.

### 4) useChatAi: ưu tiên tiếng Việt
- **Decision**: Đặt `chatLanguage` default `'vi'` thay vì `null`; khi `null` vẫn coi là `'vi'` (đã có `activeLang = chatLanguage || 'vi'`).
- **Rationale**: Đảm bảo `t(vi, en)` luôn trả về vi khi không rõ; các fallback local message luôn tiếng Việt.

## Risks / Trade-offs

- **[Risk] Thiếu chuỗi sau khi thay** → **Mitigation**: Duyệt từng component, dùng grep/search chuỗi tiếng Anh.
- **[Risk] Chuỗi validation/error API từ backend vẫn tiếng Anh** → **Mitigation**: Chỉ thay chuỗi frontend; error backend có thể wrap/map sau nếu cần.
- **[Risk] Admin panel cũng tiếng Việt – admin quen tiếng Anh** → **Mitigation**: Chấp nhận vì user yêu cầu toàn bộ tiếng Việt; có thể mở rộng i18n sau.

## Migration Plan

1. Cập nhật `askAiAssistant` và `useChatAi` để mặc định `preferredLanguage: "vi"`.
2. Thay chuỗi UI từng nhóm: layout → home → product → cart → checkout → orders → chat → auth → admin.
3. Kiểm tra validation messages trong `utils/validation.ts`.
4. Chạy build và kiểm tra thủ công các màn hình chính.

## Open Questions

- Có cần giữ tùy chọn chuyển chatbot sang tiếng Anh (cho user nước ngoài) không? Hiện `chatLanguage` có thể đổi theo detect – giữ nguyên hành vi detect nếu cần.
