## ADDED Requirements

### Requirement: Admin creates vouchers
The system SHALL allow admins to create new voucher master records.

#### Scenario: Creating a shop discount
- **WHEN** admin provides code "SHOP10", type "SHOP_DISCOUNT", 10% off
- **THEN** the voucher is saved and available for users to claim

#### Scenario: Creating a shipping discount
- **WHEN** admin provides type "SHIPPING_DISCOUNT" with fixed 20000 discount
- **THEN** the voucher is saved specifically for shipping deductions

### Requirement: Voucher limits
The system SHALL respect start/end times and maximum usage limits.

#### Scenario: Expired voucher
- **WHEN** a voucher's end time is in the past
- **THEN** it cannot be claimed or applied by any user
