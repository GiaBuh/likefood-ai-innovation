## MODIFIED Requirements

### Requirement: Welcome Bundle
The system SHALL assign welcome vouchers to users upon successful registration.

#### Scenario: Registration with active welcome bundle
- **WHEN** a new user successfully registers via the `/auth/register` endpoint
- **THEN** an event is triggered to fetch all vouchers tagged as "welcome" and save them to the new user's wallet
- **AND** the user receives these vouchers immediately for their first purchase
