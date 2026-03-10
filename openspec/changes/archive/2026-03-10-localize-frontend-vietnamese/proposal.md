## Why

Giao diện frontend hiện tại đang hiển thị bằng tiếng Anh, trong khi người dùng mục tiêu là người Việt. Chatbot AI đã hỗ trợ trả lời tiếng Việt qua `preferredLanguage`, nhưng UI vẫn tiếng Anh và frontend có thể gửi ngôn ngữ khác. Cần chuyển toàn bộ giao diện sang tiếng Việt và đảm bảo chatbot mặc định trả lời tiếng Việt để trải nghiệm thống nhất.

## What Changes

- Dịch tất cả chuỗi UI trên frontend (labels, buttons, messages, errors, placeholders) sang tiếng Việt.
- Thiết lập mặc định `preferredLanguage: "vi"` khi gọi AI chat để câu trả lời luôn là tiếng Việt.
- Cập nhật fallback/local responses trong `useChatAi` để ưu tiên tiếng Việt khi UI là tiếng Việt.
- Không thay đổi cấu trúc API, types, hay logic nghiệp vụ.

## Capabilities

### New Capabilities
- `frontend-vietnamese-localization`: Tập trung tất cả chuỗi UI vào cơ chế dịch/thay thế tiếng Việt; mặc định ngôn ngữ chatbot là tiếng Việt.

### Modified Capabilities
- (Không có – backend AI đã hỗ trợ tiếng Việt qua `preferredLanguage`; chỉ cần frontend gửi đúng và hiển thị đúng.)

## Impact

- **Frontend**: toàn bộ components (layout, home, product, cart, checkout, orders, chat, auth, admin) – thay chuỗi tiếng Anh bằng tiếng Việt hoặc tập trung vào file i18n nếu áp dụng.
- **Frontend**: `useChatAi.ts`, `ChatWidget.tsx`, `shopApi.ts` – đảm bảo luôn gửi `preferredLanguage: "vi"` (hoặc theo cài đặt người dùng).
- **Backend**: không thay đổi – đã hỗ trợ `preferredLanguage` và trả lời tiếng Việt.
