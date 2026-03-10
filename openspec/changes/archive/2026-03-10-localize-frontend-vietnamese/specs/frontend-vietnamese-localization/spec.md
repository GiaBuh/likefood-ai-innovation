## ADDED Requirements

### Requirement: UI strings displayed in Vietnamese
All user-facing strings on the frontend (labels, buttons, placeholders, titles, error messages, validation messages) SHALL be displayed in Vietnamese.

#### Scenario: Login/Register modal
- **WHEN** user opens the auth modal (login or register)
- **THEN** all labels, buttons, and placeholders (e.g., "Welcome Back", "Create Account", "Login with Email", "Don't have an account?", "Register") are displayed in Vietnamese

#### Scenario: Checkout flow
- **WHEN** user navigates to checkout
- **THEN** stepper labels (e.g., "Cart", "Shipping", "Payment"), form labels, and button text are displayed in Vietnamese

#### Scenario: Admin panel
- **WHEN** admin opens the admin panel
- **THEN** menu items, table headers, section titles (e.g., "Dashboard", "Orders", "Product Inventory"), and action buttons are displayed in Vietnamese

#### Scenario: Chat widget
- **WHEN** user opens the chat widget (menu, input placeholder, action chip labels)
- **THEN** all static UI text is displayed in Vietnamese

#### Scenario: Validation errors
- **WHEN** user submits invalid form data (auth, checkout, profile)
- **THEN** validation error messages are displayed in Vietnamese

### Requirement: AI chatbot responds in Vietnamese by default
The system SHALL send `preferredLanguage: "vi"` to the AI chat API when the user has not explicitly chosen another language, so that AI responses are in Vietnamese.

#### Scenario: Default language for AI chat
- **WHEN** user sends a message to the AI chatbot and `chatLanguage` is null or "vi"
- **THEN** the request to `/ai-chat/respond` includes `preferredLanguage: "vi"`

#### Scenario: Local fallback messages in Vietnamese
- **WHEN** the AI chat uses local/fallback responses (e.g., before API call, or when API fails)
- **THEN** those messages are displayed in Vietnamese
