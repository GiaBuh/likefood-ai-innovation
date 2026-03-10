## 1. Backend intent and retrieval foundation

- [x] 1.1 Tach hoac tao service intent routing cho cac intent co ban (search, related, add-to-cart, variant, quantity, checkout, unknown).
- [x] 1.2 Chuan hoa retrieval/ranking service theo fallback chain: exact -> related -> category/budget -> safe response.
- [x] 1.3 Bo sung inventory-aware va budget-aware filter vao ket qua de xuat.
- [x] 1.4 Refactor `GeminiAiChatServiceImpl` de su dung pipeline moi va giam logic dan trai trong mot class.

## 2. Upsell optimization and response contract

- [x] 2.1 Them rule upsell guardrail (toi da 2 mon, chong lap de xuat, chi kich hoat khi intent mua ro rang).
- [x] 2.2 Mo rong `AiChatResponse`/DTO voi metadata recommendation (`reason`, `offerType`, `fallbackLevel`, `confidenceBand`) theo huong backward compatible.
- [x] 2.3 Cap nhat backend action planner de uu tien de xuat bo tro theo category/complementary relation.
- [x] 2.4 Bo sung test cho cac scenario: khong co exact match, out-of-stock, budget limit, upsell spam prevention.

## 3. Frontend chatbot alignment

- [x] 3.1 Cap nhat `shopApi.ts` va type lien quan de nhan metadata moi tu backend.
- [x] 3.2 Cap nhat `useChatAi.ts` de render ro ly do de xuat va xu ly action nhat quan theo fallback level.
- [x] 3.3 Dong bo local fallback trong `chatUtils.ts` voi logic retrieval moi de tranh mau thuan ket qua.
- [x] 3.4 Bo sung test/manual checklist cho luong hoi thoai 10+ tinh huong khach hang co ban.

## 4. Observability and rollout

- [x] 4.1 Them metric/log co cau truc cho latency, intent, fallback, no-match, recommendation exposure, conversion.
- [x] 4.2 Thiet lap dashboard va nguong canh bao toi thieu cho chatbot quality KPI.
- [x] 4.3 Trien khai feature flag cho pipeline moi va ke hoach rollout theo nhip 10% -> 50% -> 100%.
- [x] 4.4 Chuan bi rollback procedure va post-release review theo KPI da dinh nghia.
