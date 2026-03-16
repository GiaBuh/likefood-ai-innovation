## Why

User needs a robust, scalable voucher system modeled after Shopee's architecture. The current system lacks any promotional or discount code capabilities. A Shopee-style system—featuring voucher wallets, distinct voucher types (shop vs. shipping), claiming/saving mechanics, and auto-application at checkout—is required to drive sales, improve user retention (especially via new user welcome bundles), and support future marketing campaigns.

## What Changes

- Add complete Voucher Management capabilities (Create, read, update voucher rules).
- Add User Voucher Wallet (Claiming and storing vouchers).
- Modify Checkout flow to support applying multiple vouchers (one Shop, one Shipping).
- Add Welcome Bundle logic (Auto-claim vouchers upon registration).
- Add UI for Voucher Wallet in User Profile.
- Add UI for Voucher Selection at Checkout.

## Capabilities

### New Capabilities
- `voucher-management`: Admin capabilities to create and manage voucher rules (codes, types, limits, validity).
- `voucher-wallet`: User capabilities to claim, view, and store vouchers in their personal wallet.
- `voucher-checkout`: Logic to calculate discounts and apply vouchers (with stacking rules) during order placement.

### Modified Capabilities
- `order-processing`: Modify order creation to accept voucher IDs, validate them, deduct amounts, and mark them as used.
- `user-onboarding`: Modify registration flow to automatically grant welcome vouchers to new users.

## Impact

- **Database**: Adds `vouchers` and `user_vouchers` tables. Modifies `orders` table to track applied vouchers and discount amounts.
- **Backend API**: Adds Voucher Controller endpoints. Modifies Auth Service (registration) and Order Service (checkout).
- **Frontend**: Modifies Profile Modal, Cart/Checkout Pages, and API services.
