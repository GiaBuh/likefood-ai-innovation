## Why

The current chatbot still misses user intent and often suggests products outside budget, which increases drop-off and reduces cart conversion, especially for older users. We need a dedicated shopping assistant that can quickly guide users from discovery to cart and checkout using reliable budget-aware logic.

## What Changes

- Replace the existing chatbot backend flow with a new Python FastAPI chatbot service powered by Gemini while preserving the current website chat UI/UX.
- Add deterministic recommendation logic for full-order budget targeting, including auto-expansion to +30% when no option exists within strict budget.
- Add guided conversation flow: clarify category intent, present up to 3 candidate options, explain products with persuasive and friendly Vietnamese copy based on product description, then drive add-to-cart and checkout handoff.
- Integrate with existing cart APIs (`/carts/me/items`) so chatbot actions can add selected product variants and quantities to cart.
- Optimize for Vietnamese-first and low-latency responses suitable for real shopping sessions.

## Capabilities

### New Capabilities
- `fastapi-shopping-chat-orchestrator`: FastAPI chatbot orchestration for intent detection, multi-turn state handling, and Gemini response generation.
- `budget-aware-variant-recommendation`: Variant-level recommendation engine that builds cart proposals under full-order budget with 30% fallback expansion.
- `chat-cart-checkout-handoff`: Action contract and execution flow for add-to-cart and checkout navigation while keeping existing frontend chat UX.

### Modified Capabilities
- None.

## Impact

- New backend service in Python FastAPI for chatbot runtime and orchestration.
- Frontend chat integration layer updated to call FastAPI chatbot endpoint but retain current UI components and interaction style.
- Existing product and cart APIs remain source of truth; chatbot consumes product data and triggers existing cart add-item flow.
- Gemini API usage increases and must be managed for latency and reliability.
