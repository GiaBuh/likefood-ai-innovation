## ADDED Requirements

### Requirement: Route-level Error Boundary
The system SHALL wrap each customer-facing route in a React Error Boundary component that catches rendering errors and displays a user-friendly fallback UI.

#### Scenario: Component crash recovery
- **WHEN** a component inside a route throws an unhandled error
- **THEN** the Error Boundary SHALL catch the error, display a friendly message ("Đã xảy ra lỗi / Something went wrong") with a "Thử lại / Retry" button, and log the error to console

#### Scenario: Error isolation
- **WHEN** the ProductDetail page crashes
- **THEN** only the product detail area SHALL show the error fallback; the header, footer, and chat widget SHALL remain functional

### Requirement: Image lazy loading
All `<img>` tags in customer-facing components SHALL include `loading="lazy"` attribute to defer offscreen image loading.

#### Scenario: Image deferred loading
- **WHEN** a user loads the shop page with 50 product cards
- **THEN** only images in the viewport and near-viewport SHALL load immediately; offscreen images SHALL load as the user scrolls

#### Scenario: Above-fold exception
- **WHEN** the hero section or first visible product images render
- **THEN** those images SHALL NOT have `loading="lazy"` to ensure they load immediately (LCP optimization)

### Requirement: Import map cleanup
The redundant `<script type="importmap">` block in `index.html` referencing `esm.sh` SHALL be removed entirely.

#### Scenario: Import map removed
- **WHEN** a developer views the `index.html` source
- **THEN** there SHALL be no `<script type="importmap">` block; all module resolution SHALL be handled by Vite bundler

#### Scenario: App still works after removal
- **WHEN** `npm run dev` and `npm run build` are executed after removing the import map
- **THEN** the app SHALL build and run correctly without any module resolution errors

### Requirement: Image error fallback
Product images SHALL display a placeholder/fallback image if the original image URL fails to load.

#### Scenario: Broken image URL
- **WHEN** a product image URL returns a 404 or network error
- **THEN** the `<img>` element SHALL display a branded placeholder image instead of the browser's broken image icon
