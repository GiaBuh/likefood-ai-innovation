## ADDED Requirements

### Requirement: Mobile bottom tab navigation
The system SHALL display a fixed bottom navigation bar on mobile viewports (< 768px) with tab items for: Home, Shop, Cart, Orders, and Profile/Menu.

#### Scenario: Bottom nav visibility
- **WHEN** a user views the site on a mobile device
- **THEN** the system SHALL display a fixed bottom tab bar with 5 icons and labels, and the top header SHALL hide the duplicate navigation items

#### Scenario: Active tab indicator
- **WHEN** the user is on the Shop page
- **THEN** the Shop tab icon SHALL be highlighted with the primary brand color and a subtle indicator dot or underline

### Requirement: Auto-hide on scroll
The bottom navigation bar SHALL auto-hide when the user scrolls down and reappear when scrolling up to maximize content viewport.

#### Scenario: Scroll down hides nav
- **WHEN** a user scrolls down more than 50px on mobile
- **THEN** the bottom tab bar SHALL slide down out of view with a smooth transition

#### Scenario: Scroll up shows nav
- **WHEN** a user scrolls up on mobile
- **THEN** the bottom tab bar SHALL slide back into view

### Requirement: Cart badge on bottom nav
The Cart tab in the bottom navigation SHALL display a badge showing the number of items in the cart.

#### Scenario: Cart badge count
- **WHEN** the user has 3 items in their cart
- **THEN** the Cart tab icon SHALL display a red badge with the number "3"

#### Scenario: Empty cart no badge
- **WHEN** the user has an empty cart
- **THEN** the Cart tab icon SHALL NOT display any badge

### Requirement: Desktop navigation unaffected
The bottom tab navigation SHALL only appear on mobile viewports. Desktop navigation (top header) SHALL remain the primary navigation on larger screens.

#### Scenario: Desktop hides bottom nav
- **WHEN** a user views the site on a desktop viewport (>= 768px)
- **THEN** the bottom tab navigation SHALL NOT be visible

### Requirement: Mobile touch-friendly interactions
All interactive elements on mobile SHALL have minimum touch targets of 44x44px and appropriate spacing to prevent mis-taps.

#### Scenario: Button touch targets
- **WHEN** a user taps a button or link on mobile
- **THEN** the interactive element SHALL have at least 44px height and adequate padding for comfortable touch interaction
