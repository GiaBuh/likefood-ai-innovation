## ADDED Requirements

### Requirement: Verified Purchase Validation
The system SHALL only allow users to submit a review for a product if they have an order for that product with the status `COMPLETED`.

#### Scenario: User with completed order submits review
- **WHEN** user with a `COMPLETED` order for Product A submits a review for Product A
- **THEN** the review is successfully created and saved

#### Scenario: User without completed order attempts to review
- **WHEN** user who has never purchased Product A (or order is not `COMPLETED`) attempts to submit a review
- **THEN** they are denied access and shown an error message

### Requirement: Review Submission with Media
The system SHALL allow users to submit a review containing a star rating (1-5), optional text comment, and up to 3 optional images.

#### Scenario: Submission with all fields
- **WHEN** a qualified user submits a 5-star rating, a text comment, and 2 images
- **THEN** the review and its associated images are saved to the database

#### Scenario: Submission with rating only
- **WHEN** a qualified user submits only a 3-star rating without text or media
- **THEN** the review is still accepted and saved

### Requirement: Review Filtering and Display
The system SHALL filter reviews on the product detail page based on star rating and presence of media.

#### Scenario: Filter by 5-star rating
- **WHEN** a user selects the "5 Sao" filter
- **THEN** only reviews with a 5-star rating are displayed

#### Scenario: Filter by presence of media
- **WHEN** a user selects the "Có Hình Ảnh / Video" filter
- **THEN** only reviews containing uploaded images are displayed
