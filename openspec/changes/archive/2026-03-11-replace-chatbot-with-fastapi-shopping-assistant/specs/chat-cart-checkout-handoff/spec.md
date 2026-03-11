## ADDED Requirements

### Requirement: Chatbot SHALL add items to cart via existing cart API contract
The system SHALL execute cart add flow using the existing API contract with `variantId` and `quantity` so order/cart consistency remains under current backend domain rules.

#### Scenario: User confirms purchase quantity and variant
- **WHEN** user confirms a recommended variant and quantity
- **THEN** chatbot issues add-to-cart action compatible with existing cart API and reports successful add result to the user

### Requirement: Chatbot SHALL collect variant and quantity before cart insertion
After user confirms product intent, the system SHALL ask for missing purchase details in this order: variant first (for multi-variant product), then quantity, and only then create add-to-cart action.

#### Scenario: Product has multiple variants
- **WHEN** user confirms they want to buy a product that has variants such as 300g and 500g
- **THEN** chatbot asks user to choose one variant before asking quantity

#### Scenario: Product has one variant
- **WHEN** user confirms they want to buy a product that has only one available variant
- **THEN** chatbot auto-selects that variant and asks user for quantity

#### Scenario: Missing quantity after variant selection
- **WHEN** user has chosen variant but has not provided quantity
- **THEN** chatbot asks for quantity and SHALL NOT send add-to-cart action yet

### Requirement: Chatbot SHALL support checkout handoff after successful add-to-cart
After cart add success, the system SHALL provide checkout action so users can move directly from chat to checkout.

#### Scenario: User wants immediate checkout
- **WHEN** an item is added to cart and user chooses to continue payment
- **THEN** chatbot returns checkout navigation action for frontend to redirect user to checkout page

### Requirement: Product explanation SHALL use product description with persuasive friendly tone
The system SHALL generate concise persuasive explanations from product description data and add appealing but factual wording in a friendly youthful Vietnamese style.

#### Scenario: User asks for product detail before buying
- **WHEN** user asks "mon nay co gi hay" or equivalent product-detail question
- **THEN** chatbot responds using product description context and ends with a gentle call-to-action to buy

### Requirement: Chatbot SHALL keep deterministic actions separate from natural language text
The system SHALL return machine-readable actions independently from display text to avoid ambiguous client-side parsing and ensure reliable add-to-cart and navigation behavior.

#### Scenario: Frontend processes chatbot action payload
- **WHEN** frontend receives chatbot response containing text and actions
- **THEN** frontend can execute add-to-cart and checkout actions without extracting commands from free-form text
