## MODIFIED Requirements

### Requirement: Display Product Information
The system SHALL display detailed information about a selected product, **including its aggregated review rating and total review count**.

#### Scenario: User views product with reviews
- **WHEN** a user navigates to the product detail page for a product that has reviews
- **THEN** the system displays the average star rating (e.g., "4.9 trên 5") and the total number of reviews alongside the product's basic information (name, price, images).

#### Scenario: User views product without reviews
- **WHEN** a user navigates to the product detail page for a product with no reviews
- **THEN** the system displays a state indicating "Chưa có đánh giá" (No reviews yet).

## ADDED Requirements

### Requirement: Display Product Reviews Section
The system SHALL display a dedicated section on the product details page listing individual customer reviews.

#### Scenario: User views reviews section
- **WHEN** a user scrolls to the reviews section of the product detail page
- **THEN** they see the list of reviews, including reviewer name, rating, date, text comment, uploaded media, and shop replies.
