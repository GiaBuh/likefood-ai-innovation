## Why

Chatbot AI da hoat dong duoc nhung van con bi cham, response khong dong deu giua backend/frontend, va co luc UX chat bi roi trong cac flow dai.  
Can mot dot toi uu tong the fullstack de tang toc do, do on dinh, va chat luong trai nghiem mua hang.

## What Changes

- Toi uu pipeline backend AI chat de giam latency va giam fallback khong can thiet.
- Chuan hoa dong bo state va contract giua backend/frontend de tranh lech context.
- Toi uu luong recommendation + action chips theo intent de tang conversion.
- Tang observability (metrics + logs) cho chat quality, mismatches, va hieu nang.
- Cai thien UX rendering chat card, grouping actions, va fallback format de de doc tren mobile.
- Bo sung test regression cho cac flow quan trong: detail follow-up, recommendation, add-to-cart, checkout intent.

## Capabilities

### New Capabilities
- `ai-chat-latency-optimization`: Toi uu thoi gian dap ung chatbot qua cache strategy, lightweight formatting, va profile routing.
- `ai-chat-state-synchronization`: Dinh nghia co che dong bo context backend/frontend de xu ly flow da luot on dinh.
- `ai-chat-fallback-governance`: Dinh nghia chinh sach fallback co muc uu tien ro rang, khong de UX nhay lung tung.

### Modified Capabilities
- `ai-chat-intent-routing`: Nang do chinh xac route intent va uu tien context-aware handoff.
- `ai-chat-related-product-retrieval`: Toi uu retrieval scoring + action consistency + budget/category behavior.
- `ai-chat-action-render-contract`: Mo rong contract cho metadata profile, chip ordering/capping, va fallback renderer.
- `ai-chat-product-detail-persuasion`: Chuan hoa detail response gon, de doc, co CTA va khong lap thong tin.
- `ai-chat-observability`: Bo sung KPI do hieu nang va do on dinh cua chatbot fullstack.

## Impact

- Backend:
  - `backend/src/main/java/com/ecommerce/likefood/ai/service/impl/GeminiAiChatServiceImpl.java`
  - `backend/src/main/java/com/ecommerce/likefood/ai/service/impl/AiChatIntentRouter.java`
  - `backend/src/main/java/com/ecommerce/likefood/ai/service/impl/AiChatRetrievalService.java`
  - `backend/src/main/java/com/ecommerce/likefood/ai/service/impl/AiChatResponseFormattingSupport.java`
  - `backend/src/main/java/com/ecommerce/likefood/ai/dto/res/*`
- Frontend:
  - `frontend/components/chat/useChatAi.ts`
  - `frontend/components/chat/ChatMessageList.tsx`
  - `frontend/components/chat/chatTypes.ts`
  - `frontend/services/shopApi.ts`
- QA/Monitoring:
  - test backend/frontend cho chat flow
  - docs KPI/rollout/rollback cho chatbot.
