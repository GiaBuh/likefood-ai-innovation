## Why

Chatbot recommendations still drift outside the user's requested category (for example, asking for `hạt` but getting mixed categories), which breaks trust and causes wrong follow-up purchase flows. We need deterministic category-first intent routing now to reduce recommendation errors and keep the assistant predictable for older users.

## What Changes

- Prioritize category intent detection before product retrieval when user asks broad/natural-language requests.
- Enforce strict category filtering for top recommendations once a category is confidently detected.
- Add deterministic fallback order: category-first -> product search -> safe alternatives.
- Improve Vietnamese phrase handling for category intent (for example, "liên quan đến hạt", "đồ hạt", "món khô").
- Add debug context transition metadata (`from awaiting` -> `to awaiting`) gated by environment configuration for troubleshooting conversation state issues.

## Capabilities

### New Capabilities
- `category-first-recommendation-guardrails`: Determine and enforce category-first recommendation behavior with deterministic fallback.

### Modified Capabilities
- `fastapi-shopping-chat-orchestrator`: Update orchestration requirements to prioritize category intent detection before generic product retrieval.
- `ai-chat-intent-routing`: Extend intent routing to classify category-driven requests and apply strict category lock when detected.
- `ai-chat-related-product-retrieval`: Update retrieval behavior to prevent mixed-category leakage during category-scoped recommendation turns.
- `ai-chat-observability`: Add optional debug metadata for context-state transitions without exposing debug fields in production by default.

## Impact

- Affected backend files in `ai-chatbot-fastapi/app` including `chat_service.py`, `schemas.py`, and `config.py`.
- Frontend chat contract/types updates in `frontend/services/shopApi.ts` and chat UI message metadata handling.
- Environment and deployment config updates for debug toggle (`AI_DEBUG_CONTEXT_ENABLED`) in compose/env files.
