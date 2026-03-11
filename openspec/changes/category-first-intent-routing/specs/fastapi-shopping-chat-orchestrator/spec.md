## MODIFIED Requirements

### Requirement: Chat orchestration SHALL support four core shopping intents
The system SHALL detect and handle product search, budget-based recommendation, persuasive product explanation, and add-to-cart guidance as first-class intents in one conversation flow, and SHALL prioritize category intent routing before generic product retrieval when category cues are present.

#### Scenario: Detect and route shopping intent
- **WHEN** the user asks for product suggestions with or without explicit budget
- **THEN** the orchestrator routes the request to the appropriate intent branch and returns relevant recommendation actions

#### Scenario: Detect category-first request
- **WHEN** user sends a broad request that includes category cues (for example "món liên quan đến hạt")
- **THEN** the orchestrator performs category-scoped retrieval first and keeps recommendation results inside the detected category
