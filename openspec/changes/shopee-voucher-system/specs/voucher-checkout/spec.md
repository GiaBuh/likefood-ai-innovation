## ADDED Requirements

### Requirement: Stacking vouchers at checkout
The system SHALL allow users to apply up to one SHOP_DISCOUNT and up to one SHIPPING_DISCOUNT together.

#### Scenario: Shop and shipping combined
- **WHEN** user selects a valid 10% shop voucher and a $5 shipping voucher
- **THEN** both discounts are applied to the subtotal and shipping fee respectively

#### Scenario: Two shop vouchers selected
- **WHEN** user tries to select a second SHOP_DISCOUNT
- **THEN** the system deselects the first one and applies the new one

### Requirement: Discount calculation and capping
The system SHALL calculate discounts based on cart subtotal, restricted by min_order_value and max_discount_amount.

#### Scenario: Discount exceeds cap
- **WHEN** 20% discount on $100 cart is calculated ($20), but voucher cap is $10
- **THEN** the discount applied is $10

#### Scenario: Order value too low
- **WHEN** applying a voucher requiring $50 minimum on a $30 cart
- **THEN** the system rejects the voucher application
