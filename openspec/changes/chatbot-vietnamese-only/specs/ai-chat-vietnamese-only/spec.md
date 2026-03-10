## ADDED Requirements

### Requirement: AI chatbot responds only in Vietnamese
The AI chatbot SHALL respond to all customer messages in Vietnamese only. English responses SHALL NOT be supported. Vietnamese is the single, official language of the chatbot.

#### Scenario: API request always requests Vietnamese
- **WHEN** the user sends a message to the AI chatbot
- **THEN** the request to the AI chat API includes `preferredLanguage: "vi"`

#### Scenario: No language detection affects response language
- **WHEN** the user sends a message (in any language, including English)
- **THEN** the chatbot response is displayed in Vietnamese
- **AND** the system does not switch to English based on message content

#### Scenario: Static UI and fallback messages in Vietnamese
- **WHEN** the chatbot displays static text (buttons, labels, placeholders) or fallback/local messages
- **THEN** all such text is displayed in Vietnamese
- **AND** no English equivalents are shown based on user language preference
