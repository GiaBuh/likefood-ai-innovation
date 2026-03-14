## ADDED Requirements

### Requirement: Landing page hero section
The system SHALL display an animated hero section with a full-width background image/video, brand tagline, and a primary CTA button linking to the shop page.

#### Scenario: Hero section renders
- **WHEN** a user visits the landing page at route `/`
- **THEN** the system SHALL display a hero section with animated entrance (fade-in + slide-up), brand name "LIKEFOOD", tagline, and a "Khám phá đặc sản" / "Explore Specialties" CTA button

### Requirement: Featured products carousel
The system SHALL display a horizontally-scrollable carousel of featured/trending products on the landing page.

#### Scenario: Featured products display
- **WHEN** the landing page loads
- **THEN** the system SHALL fetch and display up to 8 featured products in a swipeable carousel with product image, name, and price

#### Scenario: Product click navigation
- **WHEN** a user clicks on a featured product in the carousel
- **THEN** the system SHALL navigate to the product detail page (`/product/:id`)

### Requirement: Brand values section
The system SHALL display a brand values section highlighting LikeFood's key selling points (authentic Vietnamese food, quality assurance, fast US shipping).

#### Scenario: Brand values render
- **WHEN** a user scrolls past the hero section
- **THEN** the system SHALL display 3-4 brand value cards with icons, titles, and descriptions arranged in a responsive grid

### Requirement: Customer testimonials section
The system SHALL display a customer testimonials section with review cards.

#### Scenario: Testimonials display
- **WHEN** a user scrolls to the testimonials section
- **THEN** the system SHALL display at least 3 customer testimonial cards with avatar, name, rating, and review text

### Requirement: Shop page route change
The current home page (product listing) SHALL be moved to route `/shop`, and the new landing page SHALL take over the `/` route.

#### Scenario: Route navigation
- **WHEN** a user visits `/`
- **THEN** the system SHALL display the landing page, and the shop (product listing) SHALL be accessible at `/shop`
