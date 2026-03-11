## Context

The FastAPI chatbot currently blends category and product-token scoring in the same retrieval pass, so broad user messages like "liên quan đến hạt" can leak products from other categories. The business expectation is category-first guidance: if category intent is present, recommendations must stay in that category. The frontend also needs reliable debug traces for state transitions while we stabilize multi-turn behavior.

## Goals / Non-Goals

**Goals:**
- Enforce category-first routing before product scoring for natural-language shopping requests.
- Keep strict category lock in recommendations when category intent is confidently detected.
- Apply deterministic fallback order: category -> product -> random-safe.
- Preserve current action contract and chat UX (no breaking API changes).
- Provide optional observability metadata for state transitions with production-safe toggle.

**Non-Goals:**
- Redesign ranking/relevance model with embeddings or new vector database.
- Introduce persistent user memory or personalization.
- Change cart/checkout API contract.
- Add new frontend chat widgets or major UI redesign.

## Decisions

- **Decision 1: Category intent pre-check at orchestration entry**
  - Implement `_detect_requested_category()` before broad query and search routing.
  - If category is detected and has active products, route directly to category-scoped recommendation.
  - **Alternative considered:** keep unified retrieval scoring.
  - **Why rejected:** still allows category leakage in top results and is hard to reason about.

- **Decision 2: Strict category lock once detected**
  - When category intent is detected, top recommendation list MUST only include products in that category.
  - If category has no eligible products, fallback to random-safe suggestions (user-selected option B).
  - **Alternative considered:** mixed fallback from related categories.
  - **Why rejected:** violates explicit user intent and produced confusing recommendations.

- **Decision 3: Category-aware "switch product" behavior**
  - For `đổi món khác`, prefer alternatives in current selected product category.
  - If that category has <= 1 product, fallback to random-safe suggestions across catalog.
  - **Alternative considered:** always random suggestions.
  - **Why rejected:** lower relevance and weaker conversion.

- **Decision 4: Dev-only debug transition metadata**
  - Add `debugContextId`, `debugFromAwaiting`, `debugToAwaiting` under `recommendationMeta`.
  - Gate by `AI_DEBUG_CONTEXT_ENABLED`; default false in production.
  - **Alternative considered:** always include debug fields.
  - **Why rejected:** unnecessary payload noise and potential production exposure.

## Risks / Trade-offs

- **[Risk] False positive category detection** -> **Mitigation:** alias map stays minimal, normalize input with accent-insensitive matching, and fallback to product search if category has no matches.
- **[Risk] Overly strict category lock reduces discovery** -> **Mitigation:** allow explicit fallback to random-safe when category has insufficient options.
- **[Risk] Debug fields leak to end users in production** -> **Mitigation:** production env default `AI_DEBUG_CONTEXT_ENABLED=false`; enable temporarily only for incident debugging.
- **[Risk] Drift between backend and frontend type contracts** -> **Mitigation:** update both FastAPI schema and frontend `shopApi`/message types in same change and verify with build.
