## 1. FastAPI chatbot service bootstrap

- [x] 1.1 Create FastAPI service skeleton for chatbot endpoint, request/response schemas, and health check
- [x] 1.2 Add Gemini client configuration (API key, model, timeout, retry, fallback toggles)
- [x] 1.3 Add shared chat context/state model for multi-turn conversation without persistent user memory

## 2. Product and cart integration adapters

- [x] 2.1 Implement product/variant data adapter to load active catalog data from existing backend source
- [x] 2.2 Implement cart adapter for add-item action using existing `variantId` and `quantity` contract
- [x] 2.3 Implement checkout handoff action payload compatible with current frontend navigation flow

## 3. Intent routing and orchestration

- [x] 3.1 Implement intent router for product search, budget recommendation, product explanation, and add-to-cart intents
- [x] 3.2 Implement category clarification turn before recommendation when user intent is broad
- [x] 3.3 Implement rejection handling that returns exactly three alternative options
- [x] 3.4 Implement mandatory purchase-detail flow after product confirmation: choose variant first (if multiple), then ask quantity

## 4. Budget-aware variant recommendation engine

- [x] 4.1 Implement budget parser and normalization for full-order budget input
- [x] 4.2 Implement variant-first recommendation planner to generate feasible combinations under budget
- [x] 4.3 Implement automatic 30 percent budget ceiling expansion when no strict-budget solution exists

## 5. Response generation and action contract

- [x] 5.1 Implement persuasive Vietnamese response composer grounded in product description
- [x] 5.2 Implement deterministic action envelope (`open-product`, `add-to-cart`, `go-checkout`, `show-more-options`)
- [x] 5.3 Add rules-first fallback when Gemini is slow/fails to preserve low-latency responses

## 6. Frontend cutover and verification

- [x] 6.1 Switch frontend chat API target to FastAPI behind runtime feature flag
- [x] 6.2 Verify compatibility with existing chat UI/UX components and interaction behavior
- [x] 6.3 Execute end-to-end tests for core journeys (search, budget fit, explain, variant selection, quantity capture, add-to-cart, checkout) and rollback toggle
