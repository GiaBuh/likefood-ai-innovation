## Context

The platform currently lacks promotional capabilities, which is crucial for maximizing conversion rates and user retention. Specifically, there is an immediate need to reward new users upon registration (Welcome Bundle) to incentivize their first purchase. The goal is to build a "Shopee-style" system where vouchers can be claimed/saved into a personal wallet (User Vouchers), categorized by type (Shop Discount vs. Shipping Discount), and stacked together at checkout.

## Goals / Non-Goals

**Goals:**
- Implement a voucher management system (Create, read, update voucher rules).
- Implement a User Voucher Wallet (Claiming and storing vouchers).
- Support at least two distinct voucher types: `SHOP_DISCOUNT` and `SHIPPING_DISCOUNT`.
- Allow stacking of one Shop voucher and one Shipping voucher per order.
- Automate granting a "Welcome Bundle" to newly registered users.
- Redesign the Checkout flow to calculate and display voucher discounts.

**Non-Goals:**
- Complex conditional vouchers (e.g., "Buy 2 Get 1 Free" or category-specific discounts) are out of scope for the MVP.
- A fully-featured Admin UI for creating vouchers is out of scope for this change (we will use API endpoints/DB seeding for now).

## Decisions

1. **Explicit Storage of User Vouchers (The Wallet Model)**: 
   - *Alternative*: Checking global promo codes against user history. 
   - *Rationale*: We chose the wallet model (`user_vouchers` table) because it matches the Shopee experience. It allows users to browse their collected vouchers in their profile and gives a psychological sense of ownership. It also easily supports the Welcome Bundle requirement by just batch-inserting records upon registration.

2. **Database Separation of Voucher Rules and User Vouchers**:
   - *Rationale*: A `vouchers` table will hold the master rules (code, discount value, min order value, valid dates, type). A `user_vouchers` table will map users to vouchers and track the `is_used` status. This prevents bloating the master table and handles many-to-many relationships safely.

3. **Optimistic Locking / Transaction at Checkout**:
   - *Risk*: A user might attempt to use the same voucher in two simultaneous checkout requests.
   - *Rationale*: We will handle voucher consumption within the primary database transaction when creating the Order. If the order fails to save, the voucher status is rolled back.

4. **Applying Vouchers via `voucher_id` instead of `code`**:
   - *Rationale*: Because the user "saves" the voucher to their wallet, the frontend will pass the specific `UserVoucher` ID to the checkout API, rather than a raw string code.

## Risks / Trade-offs

- **[Risk] Heavy DB writes at registration**: If welcoming users with 5 vouchers, we must do 5 inserts into `user_vouchers` per new user.
  - *Mitigation*: Batch insert queries or asynchronous processing if registration volume becomes extremely high (unlikely for MVP).

- **[Risk] Complex discount calculation logic**: Calculating shop discounts and shipping discounts accurately without negative totals.
  - *Mitigation*: Ensure the calculation logic strictly caps the discount at the subtotal/shipping fee, and has thorough unit testing before finalizing the checkout API hookup.

## Migration Plan

1. Create `vouchers` and `user_vouchers` tables.
2. Add voucher columns to the `orders` table (`shop_voucher_id`, `shipping_voucher_id`, `shop_discount_amount`, `shipping_discount_amount`).
3. Deploy DB migrations.
4. Deploy updated Backend (Voucher Controller, modified Auth & Order services).
5. Deploy updated Frontend (Profile Wallet UI, Checkout UI).
