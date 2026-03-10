## 1. Backend performance and routing optimization

- [x] 1.1 Toi uu `AiChatIntentRouter` de giam branch conflict va nang accuracy route high-frequency intents.
- [x] 1.2 Toi uu `GeminiAiChatServiceImpl` theo fast-path truoc, LLM sau, va giam logic duplicate.
- [x] 1.3 Dieu chinh cache key/cache TTL theo context de giam latency ma khong sai ngu canh.
- [x] 1.4 Toi uu fallback governance theo cap (`EXACT/RELATED/CATEGORY_BUDGET/SAFE`) va thong diep tuong ung.

## 2. Retrieval and response quality optimization

- [x] 2.1 Tune retrieval scoring cho keyword/category/budget de tang relevance.
- [x] 2.2 Dam bao action contract consistency voi matched products trong moi response.
- [x] 2.3 Toi uu detail response generation de gon, ro, va co CTA khong lap.
- [x] 2.4 Bo sung regression tests cho retrieval/action consistency/detail follow-up.

## 3. Frontend state sync and rendering optimization

- [x] 3.1 Toi uu state synchronization trong `useChatAi.ts` de tranh drift context.
- [x] 3.2 Toi uu renderer chat card (`ChatMessageList.tsx`) cho readability tren mobile.
- [x] 3.3 Toi uu chip ordering/capping/"xem them" de tang clarity va clickability.
- [x] 3.4 Bo sung fallback render cho legacy response khong co metadata day du.

## 4. Observability, verification, and rollout

- [x] 4.1 Bo sung/hoan thien metrics: latency, fallback level, action mismatch, chip CTR, conversion.
- [x] 4.2 Chay test/build backend + frontend va ghi nhan ket qua.
- [ ] 4.3 Thu nghiem toi thieu 10 scenario chat full flow (search -> detail -> add-to-cart -> checkout).
- [x] 4.4 Chuan bi rollout + rollback checklist dua tren KPI sau deploy.

## Verification Notes

- 2026-03-10: `frontend npm run build` -> PASS.
- 2026-03-10: `backend ./gradlew test` (targeted AI chat tests) -> FAIL due to Gradle environment issue: `Failed to create Jar file ... spring-core-7.0.3.jar`.
