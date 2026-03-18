## Context

Tích hợp SePay checkout đã được implement đầy đủ (backend payload generation + frontend form submit + IPN webhook + retry), nhưng khi mở URL thanh toán bị lỗi vì 3 bugs trong `SepayCheckoutService` và config.

## Goals / Non-Goals

**Goals:**
- Fix URL sandbox SePay để form POST đến đúng endpoint
- Fix thứ tự fields trong signature theo đúng SePay docs
- Ensure unit test pass với thay đổi mới

**Non-Goals:**
- Không thay đổi flow checkout (giữ nguyên 4 bước)
- Không thay đổi frontend
- Không thay đổi IPN webhook logic

## Decisions

### 1. Fix field order theo SePay docs
**Quyết định**: Sắp xếp fields trong `LinkedHashMap` theo đúng SePay docs: `merchant` → `operation` → `payment_method` → `order_amount` → `currency` → `order_invoice_number` → `order_description` → `customer_id` → `success_url` → `error_url` → `cancel_url` → `signature`
**Lý do**: SePay docs chỉ rõ signing string phải theo thứ tự này, nếu sai sẽ tạo signature không khớp

### 2. Fix URL trong cả `.env` và `application.yml` default
**Quyết định**: Đổi `pay-sandbox.sepay.vn` → `pgapi-sandbox.sepay.vn` ở cả 2 chỗ
**Lý do**: Đảm bảo đúng dù user dùng default hay override qua env var

## Risks / Trade-offs

- **[Risk]** Nếu SePay đã thay đổi API endpoint → **Mitigation**: Đã verify qua SePay docs mới nhất
- **[Risk]** Thay đổi signature order có thể ảnh hưởng các thanh toán đang xử lý → **Mitigation**: Hiện tại tất cả đều fail rồi, nên không có risk
