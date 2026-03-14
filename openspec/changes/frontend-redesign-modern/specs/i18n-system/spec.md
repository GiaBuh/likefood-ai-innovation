## ADDED Requirements

### Requirement: Language context provider
The system SHALL provide a React context (`LanguageContext`) that manages the current locale state and exposes a `switchLanguage(locale)` function to all components.

#### Scenario: Default language detection
- **WHEN** a user visits the site for the first time
- **THEN** the system SHALL detect the browser's preferred language and set the locale to Vietnamese (`vi`) or English (`en`), defaulting to Vietnamese if unsupported

#### Scenario: Language persistence
- **WHEN** a user switches language to English
- **THEN** the system SHALL persist the preference in localStorage and restore it on subsequent visits

### Requirement: Translation files structure
The system SHALL maintain translation files in JSON format at `frontend/locales/vi.json` and `frontend/locales/en.json`, organized by namespace (e.g., `common`, `home`, `product`, `checkout`).

#### Scenario: All UI text translated
- **WHEN** the app renders any customer-facing page
- **THEN** all visible text (labels, buttons, placeholders, error messages, tooltips) SHALL use translated strings from the active locale file

### Requirement: Language switcher component
The system SHALL provide a `LanguageSwitcher` component in the header that allows users to toggle between Vietnamese and English.

#### Scenario: Language switch interaction
- **WHEN** a user clicks the language switcher
- **THEN** the entire UI SHALL re-render with translated text in the selected language without a page reload

#### Scenario: Language switcher displays current language
- **WHEN** the current language is Vietnamese
- **THEN** the switcher SHALL display a flag icon or "VI/EN" toggle indicating the active language

### Requirement: Admin panel excluded from i18n
The admin panel components SHALL NOT be modified for i18n. Admin UI remains Vietnamese-only.

#### Scenario: Admin page language
- **WHEN** a user navigates to the admin panel
- **THEN** the admin interface SHALL remain in Vietnamese regardless of the selected language
