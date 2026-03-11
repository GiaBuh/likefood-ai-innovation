## 1. Category-First Routing

- [x] 1.1 Implement category-intent detector that normalizes Vietnamese input and maps aliases to catalog categories.
- [x] 1.2 Update orchestration entry flow to run category detection before broad-query/product retrieval.
- [x] 1.3 Enforce strict category lock for matched recommendations when category intent is detected.
- [x] 1.4 Add deterministic fallback from category lock to product retrieval only when category is not found or has no eligible products.

## 2. Retrieval Guardrails

- [x] 2.1 Update retrieval fallback chain to `category -> exact product -> related -> safe random`.
- [x] 2.2 Prevent mixed-category leakage in `matchedProductIds` and recommendation action product IDs during category-locked turns.
- [x] 2.3 Implement "single-item category" rule: if category has <= 1 eligible product, fallback to random-safe recommendations.

## 3. Conversation and Switching Behavior

- [x] 3.1 Update `doi mon khac` flow to prefer alternatives in currently selected product category.
- [x] 3.2 Preserve context fallback behavior: if category preference cannot be satisfied, reset safely and suggest random alternatives.
- [x] 3.3 Add regression checks for natural-language prompts such as "liên quan đến hạt" and "đồ hạt".

## 4. Observability and Debug Controls

- [x] 4.1 Extend response metadata with `debugContextId`, `debugFromAwaiting`, and `debugToAwaiting`.
- [x] 4.2 Gate debug metadata with `AI_DEBUG_CONTEXT_ENABLED` and set production default to disabled.
- [x] 4.3 Update frontend chat response contract/types to consume optional debug metadata without breaking existing rendering.

## 5. Validation and Rollout

- [x] 5.1 Add/refresh end-to-end checks for category-first queries, no-exact fallback, and switch-product flows.
- [x] 5.2 Verify `Hạt` category query returns only `Hạt` products when category lock is active.
- [x] 5.3 Rebuild and smoke test `fastapi-chatbot` + `frontend` containers after changes.
