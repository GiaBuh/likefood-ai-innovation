## ADDED Requirements

### Requirement: Category-first retrieval guardrail
The chatbot SHALL detect category intent from natural-language user input before generic product retrieval, and SHALL prioritize category-scoped recommendations when a valid category is detected.

#### Scenario: Category detected in broad request
- **WHEN** user asks for suggestions with a phrase containing a known category intent (for example "liên quan đến hạt")
- **THEN** the chatbot returns recommendations only from that detected category

#### Scenario: Category not detected
- **WHEN** user message does not contain a detectable category intent
- **THEN** the chatbot continues with normal product-intent retrieval flow

### Requirement: Deterministic fallback for weak category pools
When category intent is detected but the category has insufficient eligible products, the chatbot MUST fallback deterministically to safe random alternatives.

#### Scenario: Category pool has one or zero eligible items
- **WHEN** detected category contains less than two active in-stock products
- **THEN** the chatbot falls back to random safe suggestions across catalog

#### Scenario: Category pool has sufficient products
- **WHEN** detected category contains at least two active in-stock products
- **THEN** the chatbot keeps recommendations strictly inside that category
