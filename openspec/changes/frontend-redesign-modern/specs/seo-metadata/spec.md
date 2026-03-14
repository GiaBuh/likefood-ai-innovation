## ADDED Requirements

### Requirement: Dynamic page title
The system SHALL render a unique `<title>` tag for each route using `react-helmet-async`.

#### Scenario: Home page title
- **WHEN** a user visits the landing page at `/`
- **THEN** the document title SHALL be "LIKEFOOD - Đặc Sản Việt Nam Chính Gốc" (VI) or "LIKEFOOD - Authentic Vietnamese Specialties" (EN)

#### Scenario: Product detail title
- **WHEN** a user visits `/product/:id`
- **THEN** the document title SHALL include the product name, e.g. "Tôm Khô Cà Mau | LIKEFOOD"

#### Scenario: Blog article title
- **WHEN** a user visits `/blog/:slug`
- **THEN** the document title SHALL include the article title

### Requirement: Meta description per route
Each customer-facing route SHALL include a `<meta name="description">` tag with a relevant description (max 160 characters).

#### Scenario: Shop page meta description
- **WHEN** a user visits `/shop`
- **THEN** the meta description SHALL describe the product catalog, e.g. "Khám phá đặc sản Việt Nam chính gốc: hải sản khô, trái cây, trà truyền thống. Giao hàng tận nơi tại Mỹ."

### Requirement: Open Graph tags
Each page SHALL include Open Graph meta tags (`og:title`, `og:description`, `og:image`, `og:url`) for social media sharing.

#### Scenario: Product shared on Facebook
- **WHEN** a user shares a product detail link on Facebook
- **THEN** the shared preview SHALL display the product name, description excerpt, and product image

#### Scenario: Landing page shared
- **WHEN** a user shares the landing page URL
- **THEN** the shared preview SHALL display the brand name, tagline, and brand hero image

### Requirement: HelmetProvider wrapper
The app SHALL wrap `<App>` in `<HelmetProvider>` from `react-helmet-async` to enable metadata management across all routes.

#### Scenario: Provider initialization
- **WHEN** the app boots
- **THEN** `<HelmetProvider>` SHALL be present as a top-level wrapper in `index.tsx`
