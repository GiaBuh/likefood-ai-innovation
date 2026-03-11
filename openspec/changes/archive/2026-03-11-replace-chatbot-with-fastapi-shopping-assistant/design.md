## Context

The project currently has a Java backend chatbot endpoint, product catalog with variant-based pricing, and existing cart APIs that already support adding variants to cart. The business goal is to replace the current chatbot flow with a more reliable shopping assistant that better understands intent, stays within user budget at order level, and guides users to checkout with minimal friction while keeping the current chat UI/UX in React.

Constraints:
- Fast response is required for live shopping support.
- Vietnamese is primary language.
- Product recommendations must operate at variant level (same product, different prices per variant).
- Existing cart API contract should be reused instead of reworking cart domain.

Stakeholders:
- End users (with focus on older users needing guided buying support)
- Business owner (conversion and drop-off reduction)
- Frontend team (preserve current chat UX)
- Backend team (stable integration with product/cart systems)

## Goals / Non-Goals

**Goals:**
- Replace existing chatbot runtime with FastAPI + Gemini while preserving current frontend chat interface.
- Support four core flows: product search, budget-based recommendation, persuasive product explanation, add-to-cart + checkout handoff.
- Ensure recommendations use product variants and full-order budget constraints, with automatic +30% fallback when strict budget has no feasible result.
- Return deterministic action payloads that frontend can execute safely (add cart, open product, go checkout).

**Non-Goals:**
- Persistent long-term memory per user account.
- Promotions/discount-aware optimization (reserved for future changes).
- Shipping-cost-aware budget optimization in this iteration.
- Full redesign of chat UI components.

## Decisions

### 1) Deploy chatbot as a dedicated FastAPI service
- Decision: Build a separate FastAPI chatbot service and route frontend chat requests to this service.
- Rationale: Isolates iteration speed for conversational logic and Gemini orchestration from the existing Java backend lifecycle.
- Alternatives considered:
  - Keep extending Java chatbot: lower integration effort but slower experimentation and harder separation for AI-specific tuning.
  - Move all chat logic to frontend: lower backend complexity but leaks business logic and weakens control/observability.

### 2) Keep product/cart as source-of-truth in existing backend APIs
- Decision: FastAPI reads product/variant data via existing backend access and executes add-to-cart through existing cart API contract (`variantId`, `quantity`).
- Rationale: Avoids data duplication and preserves consistency with checkout/order pipeline.
- Alternatives considered:
  - Mirror product data into FastAPI DB: faster reads but introduces sync complexity and stale data risk.
  - Direct DB writes to cart from FastAPI: bypasses domain validation and increases consistency/security risks.

### 3) Hybrid recommendation pipeline (rules first, Gemini second)
- Decision: Use deterministic parsing and ranking for budget/category feasibility first; use Gemini for intent extraction and persuasive phrasing.
- Rationale: Minimizes incorrect pricing recommendations and keeps latency predictable while retaining natural conversation.
- Alternatives considered:
  - Gemini-only recommendation: more flexible language understanding but higher risk of price hallucination.
  - Rule-only chatbot: accurate pricing but weaker conversational quality and intent flexibility.

### 4) Variant-first budget planner for full-order total
- Decision: Build recommendation around product variants (not product base) and compute combinations to fit user budget for the whole cart.
- Rationale: Variant prices are the real purchasable units and align with the existing cart contract.
- Alternatives considered:
  - Product-level recommendation then variant mapping later: can mislead users on affordability.
  - Single-item budget fit only: simpler but does not satisfy user requirement for full-order planning.

### 5) Keep frontend UX contract stable with action-driven responses
- Decision: FastAPI response includes display text + normalized actions (`open-product`, `add-to-cart`, `go-checkout`, `show-more-options`) to preserve current UX.
- Rationale: Enables 100% chatbot replacement with minimal UI disruption.
- Alternatives considered:
  - Free-form text only: lower implementation effort but weaker user guidance and no deterministic cart action.
  - Frontend-specific branching logic: duplicates orchestration logic and increases UI complexity.

### 6) Stateless sessions with short-turn context
- Decision: Keep memory non-persistent per user account; maintain short conversation context only within active chat session.
- Rationale: Matches current requirement (no long-term memory) and reduces privacy/storage complexity.
- Alternatives considered:
  - Persistent profile memory: better personalization but out of current scope.

## Risks / Trade-offs

- [Currency ambiguity between user input and system prices] -> Mitigation: normalize budget input into configured store currency and reject unclear currency with clarification prompt.
- [Combination search may be slow with many variants] -> Mitigation: cap candidate pool per category and use bounded heuristic selection before exact refinement.
- [Gemini latency or transient failure] -> Mitigation: timeout + retry with fallback to rules-only responses.
- [Mismatched action contract between FastAPI and React] -> Mitigation: define explicit response schema and contract tests for action payloads.
- [Unexpected replacement impact after 100% cutover] -> Mitigation: add feature flag for emergency rollback to previous chatbot endpoint.

## Migration Plan

1. Implement FastAPI chatbot endpoint and internal orchestration modules.
2. Integrate product retrieval and cart action execution against existing backend contracts.
3. Add compatibility response schema matching current frontend chat renderer.
4. Update frontend API target to FastAPI endpoint behind a runtime flag.
5. Validate core scenarios (intent, budget fit, add-to-cart, checkout handoff, fallback paths).
6. Enable full replacement in production with rollback flag retained for initial period.

## Open Questions

- Should checkout action immediately navigate user to checkout page or always ask for one final confirmation click?
- What is the final store currency handling policy when user enters USD-like budget text but backend prices are stored in VND?
- What latency SLO should be enforced for p95 chatbot responses in production?
