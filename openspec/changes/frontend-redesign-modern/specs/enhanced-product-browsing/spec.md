## ADDED Requirements

### Requirement: Redesigned product card
The system SHALL display product cards with a modern design featuring: rounded image with subtle shadow, hover scale + overlay effect, product name, price range, category badge, location tag, and a "quick view" icon button.

#### Scenario: Product card hover effect
- **WHEN** a user hovers over a product card on desktop
- **THEN** the card SHALL scale up slightly (1.02-1.05x), the image SHALL zoom smoothly, and a semi-transparent overlay with a "quick view" icon SHALL appear

#### Scenario: Product card mobile layout
- **WHEN** a user views product cards on mobile
- **THEN** the cards SHALL display in a 2-column grid with optimized spacing and the quick-view icon SHALL show by default (no hover needed)

### Requirement: Quick view modal
The system SHALL provide a quick-view modal that displays product summary (image, name, description, variants, price) without navigating to the full product detail page.

#### Scenario: Quick view opens
- **WHEN** a user clicks the "quick view" icon on a product card
- **THEN** a modal overlay SHALL appear showing the product image, name, description excerpt, variant selector, and "Add to Cart" button

#### Scenario: Quick view close
- **WHEN** a user clicks outside the modal or the close button
- **THEN** the modal SHALL close with a smooth fade-out animation

### Requirement: Category navigation bar
The system SHALL provide a horizontal scrollable category navigation bar on the shop page with category icons and names.

#### Scenario: Category filter
- **WHEN** a user clicks on a category in the navigation bar
- **THEN** the product grid SHALL filter to show only products in the selected category with a smooth transition

#### Scenario: All categories option
- **WHEN** a user clicks "Tất cả" / "All" in the category bar
- **THEN** the product grid SHALL show all products

### Requirement: Enhanced product detail gallery
The product detail page SHALL display an image gallery with thumbnail navigation, zoom-on-hover functionality, and swipe support on mobile.

#### Scenario: Image gallery interaction
- **WHEN** a user views a product with multiple images
- **THEN** the system SHALL display a main image with thumbnail strip below, clicking a thumbnail SHALL update the main image with a crossfade transition

#### Scenario: Mobile swipe gallery
- **WHEN** a user views a product gallery on mobile
- **THEN** the user SHALL be able to swipe left/right to navigate between images, with dot indicators showing the current position

### Requirement: Product recommendations section
The product detail page SHALL display a "You may also like" section with related products at the bottom.

#### Scenario: Related products display
- **WHEN** a user views a product detail page
- **THEN** the system SHALL display up to 6 related products from the same category in a horizontally scrollable row
