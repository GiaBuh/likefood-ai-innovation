## 1. Fix SePay Checkout URL

- [x] 1.1 Cập nhật `SEPAY_CHECKOUT_URL` trong `.env` từ `https://pay-sandbox.sepay.vn/v1/checkout/init` → `https://pgapi-sandbox.sepay.vn/v1/checkout/init`
- [x] 1.2 Cập nhật default value trong `backend/src/main/resources/application.yml` (dòng `checkout-url`)

## 2. Fix Thứ Tự Fields Trong Signature

- [x] 2.1 Sửa `SepayCheckoutService.buildCheckoutPayload()` — sắp xếp lại `LinkedHashMap` theo đúng SePay docs:
  1. `merchant`
  2. `operation`
  3. `payment_method`
  4. `order_amount`
  5. `currency`
  6. `order_invoice_number`
  7. `order_description`
  8. `customer_id`
  9. `success_url`
  10. `error_url`
  11. `cancel_url`
  12. `signature` (cuối cùng)

## 3. Cập Nhật Tests

- [x] 3.1 Cập nhật `SepayCheckoutServiceTest` để verify thứ tự fields đúng
- [ ] 3.2 Chạy `cd backend && ./gradlew test --tests "*SepayCheckoutServiceTest"` — Expected: PASS

## 4. Verification

- [ ] 4.1 Chạy `cd backend && ./gradlew compileJava` — Expected: BUILD SUCCESSFUL
- [ ] 4.2 Chạy `cd backend && ./gradlew test` — Expected: ALL PASS
- [ ] 4.3 Test thủ công: Đặt hàng với BANK_TRANSFER, xác nhận form submit đến đúng SePay sandbox URL
