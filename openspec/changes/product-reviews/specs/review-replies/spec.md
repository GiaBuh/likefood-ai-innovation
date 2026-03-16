## ADDED Requirements

### Requirement: Shop Administrators Can Reply
The system SHALL allow users with admin privileges to reply to customer reviews.

#### Scenario: Admin submits reply
- **WHEN** an admin views a product review and submits a reply text
- **THEN** the reply is saved and linked to the original review

#### Scenario: Only one reply per review
- **WHEN** an admin attempts to reply to a review that already has a shop reply
- **THEN** the system updates the existing reply instead of creating a second one

### Requirement: Display Shop Replies
The system SHALL display the shop's reply directly beneath the corresponding customer review.

#### Scenario: Review has shop reply
- **WHEN** a customer views a review that has been replied to
- **THEN** the "Phản Hồi Của Người Bán" section is visible with the admin's reply text
