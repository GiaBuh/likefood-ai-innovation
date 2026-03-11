## Purpose
Define variant-level recommendation behavior and budget handling for shopping chat recommendations.

## Requirements

### Requirement: Recommendation engine SHALL use product variants as purchasable units
The system SHALL generate recommendations using `ProductVariant` entries, including variant-level price and availability, instead of relying only on base product records.

#### Scenario: Product has multiple variant prices
- **WHEN** a user asks for affordable options for a product category
- **THEN** the engine evaluates and recommends concrete variants with valid price points

### Requirement: Budget recommendation SHALL target full-order total
The system SHALL plan recommendations so the combined estimated total of proposed items fits the user-declared order budget whenever feasible.

#### Scenario: User requests full-order plan
- **WHEN** a user states a budget for the whole order (for example "toi co 100$")
- **THEN** the system returns a cart proposal whose estimated total is within budget if a feasible combination exists

### Requirement: Budget fallback SHALL expand ceiling by 30 percent when no strict match exists
If no purchasable variant or variant combination exists under the strict user budget, the system SHALL retry recommendation with a maximum budget ceiling expanded to 130 percent of the original value.

#### Scenario: No variant under strict budget
- **WHEN** user budget has no feasible recommendation under original limit
- **THEN** the engine retries with a 30 percent higher ceiling and returns alternatives under that expanded limit

### Requirement: Chatbot SHALL offer three alternatives when user rejects current recommendation
The system SHALL provide three new recommendation options after user rejection to keep the conversation moving without dead-ends.

#### Scenario: User rejects first recommendation
- **WHEN** the user indicates the proposed option is not suitable
- **THEN** the chatbot returns exactly three alternative options based on current category and budget context
