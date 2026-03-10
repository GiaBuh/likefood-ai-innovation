## Why

Chatbot hien tai bi vach luong hoi thoai o tinh huong nguoi dung hoi tiep ve mon vua duoc nhac den (anh 1-2): thay vi tra loi chi tiet thuyet phuc theo mo ta san pham, bot lai quay ve cau hoi xac nhan mua.  
Ngoai ra phan action chips goi y ben duoi dang sai ngu canh (anh 3-4), gay roi va co the dan nguoi dung den mon khong lien quan.

## What Changes

- Dieu chinh luong hoi thoai de bot hieu dung intent "hoi chi tiet mon dang noi" va sinh cau tra loi ban hang dua tren mo ta san pham (co gia vi ngon, loi ich, goi mo mua hang).
- Chuan hoa data flow: `tin nhan nguoi dung -> backend AI xu ly intent + context -> tra ve next action contract -> frontend chi render dung actions`.
- Sua logic sinh action de dam bao danh sach goi y ben duoi khop voi san pham/noi dung bot vua tra loi.
- Bo sung rang buoc de khong hien thi action "xem/mua" cho mon khong nam trong ket qua retrieval cua luot chat hien tai.
- Bo sung test scenario cho 2 bug chinh: (1) follow-up hoi chi tiet bi lac luong; (2) action chips sai ngu canh.

## Capabilities

### New Capabilities
- `ai-chat-product-detail-persuasion`: Dinh nghia hanh vi tra loi chi tiet + thuyet phuc mua hang khi user hoi sau ve mon dang duoc de cap.
- `ai-chat-action-render-contract`: Dinh nghia hop dong response action giua backend/frontend de frontend render dung nhiem vu tiep theo, khong lech danh sach.

### Modified Capabilities
- `ai-chat-intent-routing`: Mo rong rule/context de uu tien xu ly follow-up hoi chi tiet trong cung luong hoi thoai.
- `ai-chat-related-product-retrieval`: Rang buoc action suggestion phai cung tap ket qua retrieval va khong chen mon khong lien quan.

## Impact

- Backend:
  - `backend/src/main/java/com/ecommerce/likefood/ai/service/impl/GeminiAiChatServiceImpl.java`
  - `backend/src/main/java/com/ecommerce/likefood/ai/service/impl/AiChatIntentRouter.java`
  - `backend/src/main/java/com/ecommerce/likefood/ai/service/impl/AiChatRetrievalService.java`
  - DTO response actions trong `backend/src/main/java/com/ecommerce/likefood/ai/dto/res/`
- Frontend:
  - `frontend/components/chat/useChatAi.ts`
  - `frontend/components/chat/chatTypes.ts`
  - `frontend/services/shopApi.ts`
- Testing:
  - Them test/backend scenario va checklist frontend cho 2 loi da bao cao tu anh minh hoa.
