## Why

Khách hàng LikeFood chủ yếu là người Việt Nam và ngôn ngữ chính của sản phẩm là tiếng Việt. Hiện tại chatbot AI vẫn hỗ trợ phản hồi tiếng Anh thông qua phát hiện ngôn ngữ tin nhắn và chuyển đổi ngôn ngữ. Điều này gây phức tạp không cần thiết và đôi khi phản hồi tiếng Anh khi khách dùng một vài từ tiếng Anh. Cần đơn giản hóa: chỉ phản hồi tiếng Việt, tiếng Việt là ngôn ngữ duy nhất và chính thức của chatbot.

## What Changes

- Bỏ hoàn toàn hỗ trợ tiếng Anh trong chatbot AI.
- Luôn gửi `preferredLanguage: "vi"` tới API AI; không còn gửi `"en"`.
- Bỏ logic `detectLanguage` ảnh hưởng tới phản hồi; không còn chuyển đổi ngôn ngữ theo nội dung tin nhắn.
- Loại bỏ helper `t(viText, enText)`; luôn dùng chuỗi tiếng Việt.
- Xóa state `chatLanguage` và mọi UI/logic liên quan (nếu có) cho chọn ngôn ngữ.
- **BREAKING**: Người dùng gõ tiếng Anh sẽ không còn nhận phản hồi tiếng Anh; mọi phản hồi đều bằng tiếng Việt.

## Capabilities

### New Capabilities

- `ai-chat-vietnamese-only`: Định nghĩa yêu cầu chatbot AI chỉ phản hồi bằng tiếng Việt, không hỗ trợ tiếng Anh.

### Modified Capabilities

- (Không sửa spec hiện có; các spec ai-chat-* khác tập trung vào intent, upsell, retrieval, không mô tả ngôn ngữ phản hồi.)

## Impact

- **Frontend**: `useChatAi.ts`, `ChatWidget.tsx`, `chatUtils.ts` (có thể loại bỏ/đơn giản hóa `detectLanguage` nếu không dùng chỗ khác)
- **API**: `askAiAssistant` vẫn nhận `preferredLanguage` nhưng frontend luôn gửi `"vi"`; backend có thể giữ hỗ trợ tham số cho tương lai
- **Storage**: Chat persistence (nếu lưu `chatLanguage`) có thể bỏ field này
- **Types**: `AiChatLanguage`, `chatLanguage` trong state/types có thể đơn giản hóa hoặc xóa
