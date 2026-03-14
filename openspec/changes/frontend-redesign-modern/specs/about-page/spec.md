## ADDED Requirements

### Requirement: About page structure
The system SHALL provide an About Us page at route `/about` with company story, mission/vision, and brand heritage sections.

#### Scenario: About page renders
- **WHEN** a user navigates to `/about`
- **THEN** the system SHALL display the About Us page with a hero banner, company story section, mission/vision cards, and a brand heritage timeline

### Requirement: Company story section
The system SHALL display a narrative section about LikeFood's founding story and commitment to authentic Vietnamese food.

#### Scenario: Story section layout
- **WHEN** the About page loads
- **THEN** the system SHALL display a two-column layout with brand imagery on one side and story text on the other, stacking vertically on mobile

### Requirement: Team or founder section
The system SHALL display a section showcasing the founder or team behind LikeFood.

#### Scenario: Team section display
- **WHEN** a user scrolls to the team section
- **THEN** the system SHALL display team member cards with photo, name, role, and a brief bio

### Requirement: Contact and location info
The system SHALL display contact information and location details on the About page.

#### Scenario: Contact info display
- **WHEN** a user scrolls to the bottom of the About page
- **THEN** the system SHALL display email, phone, social media links, and business address
