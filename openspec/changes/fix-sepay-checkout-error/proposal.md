## Why

Khi user chọn thanh toán qua SePay (BANK_TRANSFER) và nhấn "Xác nhận & thanh toán", trang checkout bị lỗi — SePay không chấp nhận request. Nguyên nhân gốc rễ gồm 3 vấn đề:

1. **Sai URL sandbox**: `.env` và `application.yml` sử dụng `https://pay-sandbox.sepay.vn/v1/checkout/init` — URL đúng theo SePay docs phải là `https://pgapi-sandbox.sepay.vn/v1/checkout/init`
2. **Sai thứ tự fields trong signature**: SePay yêu cầu signing string theo thứ tự: `merchant, operation, payment_method, order_amount, currency, order_invoice_number, order_description, customer_id, success_url, error_url, cancel_url`. Code hiện tại đặt `merchant` cuối cùng và swap `order_invoice_number` với `order_amount`
3. **Thứ tự form fields gửi đi cũng sai**: Vì dùng `LinkedHashMap` nên thứ tự fields trong form POST cũng tương ứng sai

## What Changes

- **Fix URL checkout**: Cập nhật `.env` và default value trong `application.yml` sang đúng endpoint `pgapi-sandbox.sepay.vn`
- **Fix thứ tự signing fields**: Sắp xếp lại `LinkedHashMap` trong `SepayCheckoutService.buildCheckoutPayload()` theo đúng SePay docs
- **Cập nhật test**: Đảm bảo unit test verify đúng thứ tự fields

## Capabilities

### Modified Capabilities
- `sepay-checkout`: Fix lỗi signature và URL khiến thanh toán SePay không hoạt động

## Impact

- **Backend**: `SepayCheckoutService.java`, `application.yml`
- **Config**: `.env`
- **Tests**: `SepayCheckoutServiceTest.java`
- **No frontend changes**: Frontend code đã đúng — chỉ backend trả payload sai
