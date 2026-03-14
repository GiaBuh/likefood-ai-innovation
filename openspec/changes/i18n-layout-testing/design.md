## Overview

Kiểm tra chuyển đổi ngôn ngữ VI ↔ EN tập trung vào typography, layout stability, và text overflow.

## Testing Approach

### 1. Side-by-Side Comparison
- Chụp screenshot mỗi trang ở VI
- Switch sang EN, chụp lại
- So sánh: button sizes, nav alignment, card heights, text wrapping

### 2. Typography Audit
- Kiểm tra dấu tiếng Việt (ă, ê, ơ, ư, ả, ã, ầ, ống...) không bị cắt bởi line-height
- Kiểm tra font rendering cho cả 2 ngôn ngữ (Manrope font)
- Kiểm tra descenders (g, y, p) và Vietnamese ascenders (ấ, ể, ở) có đủ space

### 3. Overflow Detection
- Inspect tất cả buttons: text có tràn ra ngoài không?
- Inspect nav links: có bị wrap xuống dòng không?
- Inspect cards: text có bị truncate sai không?
- Inspect modals: labels có bị overflow không?

### 4. Mobile Text Audit
- 320px viewport: text có gây horizontal scroll không?
- 375px viewport: buttons có bị text overflow không?

## Known Risk Areas
1. **Header nav links**: "Trang chủ" (9 chars) vs "Home" (4 chars), "Cửa hàng" (8) vs "Shop" (4)
2. **Buttons**: "Khám Phá Ngay" (13) vs "Explore Now" (11)
3. **Form labels**: "Địa chỉ giao hàng" (17) vs "Shipping Address" (16)
4. **Checkout stepper**: "Giỏ hàng" vs "Cart", "Thanh toán" vs "Payment"
5. **AuthModal**: "Đăng nhập bằng Google" vs "Sign in with Google"
