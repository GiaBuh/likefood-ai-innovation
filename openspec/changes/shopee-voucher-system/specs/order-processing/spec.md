## MODIFIED Requirements

### Requirement: Place an order
The system SHALL create an order from the user's cart, process payment, and record applied vouchers.

#### Scenario: Checkout with saved vouchers
- **WHEN** user submits order with `shop_user_voucher_id` and `shipping_user_voucher_id`
- **THEN** the order is created, the discount amounts are saved in the order, and the `user_vouchers` are marked as `USED` with the current timestamp.

#### Scenario: Order failure rolls back voucher
- **WHEN** an order fails during payment processing or stock validation
- **THEN** the vouchers remain in `SAVED` status instead of being consumed
