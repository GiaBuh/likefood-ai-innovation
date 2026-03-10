## Why

Chatbot AI hien tai da co luong hoi thoai co ban, nhung chat luong xu ly nhu cau mua hang van khong on dinh khi khach mo ta mon an theo nhieu cach khac nhau, hoac khi mon exact match khong ton tai trong shop.  
Can mot dot nang cap co he thong de tang ty le tim duoc mon, tang kha nang goi y mon lien quan, va tang conversion them vao gio trong khi van giu chi phi va do tre trong muc chap nhan duoc.

## What Changes

- Xay dung pipeline chatbot theo huong `intent-router -> product search/ranking -> response planner`, uu tien rule/retrieval truoc khi goi LLM.
- Bo sung logic de xu ly cac tinh huong co ban cua khach hang: tim mon, xin goi y mon lien quan, doi bien the, cap nhat so luong, va xac nhan checkout.
- Nang cap fallback khi khong co exact match: goi y mon lien quan theo keyword/category/budget thay vi tra loi chung chung.
- Them guardrail upsell/cross-sell de goi y toi da 1-2 mon bo sung phu hop, tranh spam.
- Chuan hoa response contract backend/frontend de hien thi ly do goi y (related/category/budget) va action button nhat quan.
- Them bo KPI/telemetry cho chatbot de do chat luong (latency, fallback rate, no-match rate, click/add-to-cart rate).
- Cung co session/context handling de giam loi sai ngu canh khi hoi thoai nhieu luot.

## Capabilities

### New Capabilities
- `ai-chat-intent-routing`: Dinh nghia bo intent co ban va luong xu ly rule-first cho cac tinh huong mua hang pho bien.
- `ai-chat-related-product-retrieval`: Dinh nghia cach tim mon exact va mon lien quan theo keyword/category/budget, kem fallback chain ro rang.
- `ai-chat-upsell-optimization`: Dinh nghia chien luoc upsell/cross-sell co gioi han va dieu kien de de xuat mon bo sung.
- `ai-chat-observability`: Dinh nghia metric va logging can co de theo doi chat luong hoi thoai va hieu qua de xuat.

### Modified Capabilities
- None.

## Impact

- Backend AI chat stack:
  - `backend/src/main/java/com/ecommerce/likefood/ai/controller/AiChatController.java`
  - `backend/src/main/java/com/ecommerce/likefood/ai/service/impl/GeminiAiChatServiceImpl.java`
  - `backend/src/main/java/com/ecommerce/likefood/ai/service/impl/AiChatProductSupport.java`
  - Co the them service/lop ranking, intent routing, va telemetry rieng.
- Frontend chat stack:
  - `frontend/components/chat/useChatAi.ts`
  - `frontend/components/chat/chatUtils.ts`
  - `frontend/services/shopApi.ts`
  - Co the cap nhat contract xu ly action va fallback UI.
- API contract:
  - Co the bo sung truong metadata cho recommendation reason, offer type, va confidence/fallback marker trong response AI chat.
- Van hanh:
  - Can bo sung dashboard/bao cao KPI chatbot va test scenario regression cho it nhat 10 tinh huong khach hang co ban.
