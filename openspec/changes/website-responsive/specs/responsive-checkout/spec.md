## ADDED Requirements

### Requirement: Checkout flow responsive
Checkout flow (Cart → Shipping → Success) SHALL responsive trên mobile.

#### Scenario: CartReview mobile
- **WHEN** viewport < 640px
- **THEN** cart items MUST stack vertical, quantities controls phải touch-friendly (44px min)

#### Scenario: ShippingForm mobile
- **WHEN** viewport < 640px
- **THEN** form fields MUST full-width, submit button full-width, spacing thoải mái

#### Scenario: CheckoutStepper mobile
- **WHEN** viewport < 640px
- **THEN** stepper MUST hiển thị compact (numbers only, không text dài)

### Requirement: OrderHistory responsive
OrderHistory SHALL hiển thị order list phù hợp trên mobile.

#### Scenario: Order list mobile
- **WHEN** viewport < 640px
- **THEN** order cards MUST full-width, key info visible, details expandable
