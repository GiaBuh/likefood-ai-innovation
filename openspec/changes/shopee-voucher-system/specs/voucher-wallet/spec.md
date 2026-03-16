## ADDED Requirements

### Requirement: User claims a voucher
The system SHALL allow users to claim a voucher into their wallet, mapping the voucher ID to their user ID.

#### Scenario: Claiming a valid voucher
- **WHEN** the user clicked "Save" on an active voucher
- **THEN** a record is created in `user_vouchers` with status "SAVED"

#### Scenario: Claiming a voucher they already own
- **WHEN** the user tries to claim a voucher already in their wallet
- **THEN** the system ignores the request or returns a "Already saved" message

### Requirement: Viewing wallet
The system SHALL return a list of a user's saved vouchers.

#### Scenario: Opening the wallet tab
- **WHEN** the user views their profile vouchers tab
- **THEN** all non-expired, SAVED vouchers are displayed
