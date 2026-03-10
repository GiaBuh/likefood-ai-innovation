## Context

Chatbot AI hiện hỗ trợ hai ngôn ngữ (vi/en) thông qua:
- `chatLanguage` state: lưu ngôn ngữ hiện tại
- `detectLanguage(text)`: phát hiện ngôn ngữ tin nhắn (vi/en) dựa trên ký tự đặc biệt và từ khóa
- `t(viText, enText)`: helper trả về vi hoặc en theo `activeLang`
- `askAiAssistant(..., preferredLanguage)`: gửi ngôn ngữ ưu tiên lên API
- Backend có thể trả về `aiResponse.language` để cập nhật `setChatLanguage`

Khách hàng mục tiêu chủ yếu là người Việt; không cần hỗ trợ tiếng Anh.

## Goals / Non-Goals

**Goals:**
- Chatbot chỉ phản hồi bằng tiếng Việt
- Xóa hoàn toàn logic chọn/chuyển ngôn ngữ (vi/en) trong UI và flow
- Giảm độ phức tạp code (bỏ t, detectLanguage cho response, chatLanguage state)
- Luôn gửi `preferredLanguage: "vi"` tới API

**Non-Goals:**
- Không thay đổi backend API (vẫn nhận `preferredLanguage`; có thể bỏ qua nếu luôn "vi")
- Không thay đổi cách AI xử lý nội dung tin nhắn (user vẫn có thể gõ tiếng Anh)
- Không thêm i18n framework mới

## Decisions

**1. Luôn dùng chuỗi tiếng Việt, bỏ helper `t()`**  
- Thay mọi `t(viText, enText)` bằng `viText` trực tiếp  
- Rationale: Đơn giản hóa, không cần điều kiện ngôn ngữ

**2. Bỏ `chatLanguage` state và `detectLanguage` khỏi flow phản hồi**  
- `sendAiMessage` luôn dùng `'vi'`; không gọi `detectLanguage` khi gửi  
- Xóa `chatLanguage`, `setChatLanguage` khỏi params và state của ChatWidget  
- Không cập nhật `setChatLanguage(aiResponse.language)` từ API  
- Rationale: Ngôn ngữ cố định là vi; phát hiện ngôn ngữ không còn tác dụng

**3. Giữ hoặc xóa `detectLanguage` trong chatUtils**  
- Có thể xóa nếu không dùng nơi khác; hoặc giữ lại (export) nếu có dependency khác  
- Kiểm tra: chỉ dùng trong ChatWidget/useChatAi → có thể xóa hoặc bỏ export nếu không cần

**4. API `askAiAssistant`**  
- Luôn truyền `preferredLanguage: 'vi'` (hoặc hardcode trong API call)  
- Không cần đổi chữ ký backend; backend có thể bỏ qua param nếu luôn vi

**5. Chat persistence (localStorage/sessionStorage)**  
- Nếu lưu `chatLanguage`, bỏ field hoặc luôn ghi "vi"  
- Kiểm tra hydrate logic trong ChatWidget

**6. `AiChatLanguage` type**  
- Có thể giữ để API vẫn nhận `'vi' | 'en'`  
- Hoặc đơn giản hóa: frontend không còn dùng type này cho state, chỉ dùng hằng `'vi'`

## Risks / Trade-offs

- **[Risk]** User gõ tiếng Anh 100% có thể mong đợi phản hồi tiếng Anh.  
  **Mitigation:** Chấp nhận trade-off; sản phẩm hướng khách Việt, phản hồi luôn tiếng Việt là yêu cầu rõ ràng.

- **[Risk]** Code cũ (localStorage chatLanguage) có thể còn tham chiếu.  
  **Mitigation:** Grep toàn bộ `chatLanguage`, `detectLanguage` trước khi xóa; cập nhật hydrate nếu cần.

## Migration Plan

1. Thực hiện thay đổi frontend: bỏ chatLanguage, t(), detectLanguage trong flow, luôn `preferredLanguage: 'vi'`
2. Replace toàn bộ `t(vi, en)` bằng vi
3. Kiểm tra build, test thủ công flow chat
4. Không cần migration DB hoặc API; deploy frontend như bình thường
5. Rollback: revert frontend nếu cần

## Open Questions

- `detectLanguage` có được dùng ở đâu ngoài ChatWidget/useChatAi không? Nếu không → xóa hoặc đánh dấu deprecated.
