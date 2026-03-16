## 1. Database & Entities

- [x] 1.1 Create `Voucher` entity and DB migration (code, type, value, min_order, max_discount, usage_limit, times).
- [x] 1.2 Create `UserVoucher` entity and DB migration (user_id, voucher_id, status, collected_at, used_at).
- [x] 1.3 Update `Order` entity to include `shop_voucher_id`, `shipping_voucher_id`, and discount amounts.

## 2. Backend Repositories & Services

- [x] 2.1 Implement `VoucherRepository` and `UserVoucherRepository` with query methods (find active, find by user).
- [x] 2.2 Implement `VoucherService` (create voucher, claim voucher logic with validation).
- [x] 2.3 Modify `AuthService` registration logic to automatically claim "welcome" tagged vouchers for new users.

## 3. Backend Checkout Integration

- [x] 3.1 Update `OrderService.createOrder` to accept and validate `shop_user_voucher_id` and `shipping_user_voucher_id`.
- [x] 3.2 Implement discount calculation logic within `OrderService` (respecting min targets and capping at max limits).
- [x] 3.3 Ensure transactional integrity when marking `user_vouchers` as `USED`.

## 4. REST API Controllers

- [x] 4.1 Create `VoucherController` with Admin endpoints (Create Voucher).
- [x] 4.2 Create User endpoints (Get My Vouchers, Claim Voucher).

## 5. Frontend API Integration

- [x] 5.1 Update `types.ts` with `Voucher` and `UserVoucher` interfaces.
- [x] 5.2 Create `services/voucherApi.ts` for fetching/claiming vouchers.
- [x] 5.3 Modify `services/shopApi.ts` (createOrder) to support voucher IDs in the payload.

## 6. Frontend UI Components

- [ ] 6.1 Profile Modal: Implement "Ví Voucher" tab to display user's saved vouchers.
- [ ] 6.2 Checkout Page: Implement Voucher Selection UI (auto-select logic or manual selection modal).
- [ ] 6.3 Checkout Page: Update the Order Summary section to display Shop Discount and Shipping Discount lines.

## 7. Next Steps & Polish

- [ ] 7.1 Add i18n translation keys for all new voucher UI elements (`en.json`, `vi.json`).
- [ ] 7.2 Manual end-to-end testing of Welcome Bundle -> Add to Cart -> Apply Vouchers -> Checkout success.
