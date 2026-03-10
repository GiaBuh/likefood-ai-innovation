## Why

Phan tra loi cua AI trong khung chat hien tai con roi va kho doc: doan van dai, xuong dong khong nhat quan, va chips hanh dong/mon goi y khong duoc trinh bay dep mat.  
Can mot dot cai tien format hien thi de nguoi dung doc nhanh hon, hieu dung hon, va de dang bam hanh dong mua hang.

## What Changes

- Chuan hoa format noi dung bot message theo template de doc de hon (mo dau gon, thong tin chinh, CTA ro rang).
- Dat quy tac format cho danh sach mon/so lieu (xuong dong, bullet, khong lap cau, gioi han do dai).
- Chuan hoa trinh bay action chips ben duoi theo nhom (xem chi tiet, mua, hanh dong tiep theo) va gioi han so chip cho moi message.
- Dong bo contract metadata de frontend biet cach render cac block thong tin (detail, recommendation, budget, CTA).
- Bo sung quy tac fallback format khi response dai hoac khong co du lieu goi y.
- Bo sung checklist test UX de dam bao thong diep sau khi format de nhin tren man hinh nho.

## Capabilities

### New Capabilities
- `ai-chat-response-formatting`: Dinh nghia chuan output text cua chatbot de de doc, ngan gon, co cau truc va co CTA ro rang.
- `ai-chat-action-chip-presentation`: Dinh nghia quy tac sap xep/hien thi action chips cho de bam va it roi.

### Modified Capabilities
- `ai-chat-action-render-contract`: Bo sung requirement metadata render de frontend phan loai format block va chips theo ngu canh.
- `ai-chat-product-detail-persuasion`: Chinh sua requirement de detail message phai theo format de doc (khong nhieu cau lap, khong chen thong tin tho).

## Impact

- Backend:
  - `backend/src/main/java/com/ecommerce/likefood/ai/service/impl/GeminiAiChatServiceImpl.java`
  - `backend/src/main/java/com/ecommerce/likefood/ai/dto/res/` (metadata format)
- Frontend:
  - `frontend/components/chat/useChatAi.ts`
  - `frontend/components/chat/ChatMessageList.tsx`
  - `frontend/components/chat/chatTypes.ts`
  - `frontend/services/shopApi.ts`
- UX/Test:
  - cap nhat checklist test tay cho chat card, text wrap, chips layout, readability.
