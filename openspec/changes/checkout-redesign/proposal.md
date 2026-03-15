## Why

Trang checkout hiện tại có giao diện cơ bản, thiếu tính premium và hiện đại so với phần còn lại của website. Cần redesign để tạo trải nghiệm thanh toán mượt mà, đẹp mắt hơn — tăng tỷ lệ chuyển đổi và giảm bỏ giỏ hàng.

## What Changes

- **Redesign CartReview**: Cải thiện layout cart items với ảnh lớn hơn, hiệu ứng hover, swipe-to-delete trên mobile
- **Redesign ShippingForm**: Form hiện đại hơn với floating labels, auto-format phone, address suggestion
- **Redesign CheckoutStepper**: Stepper mới với animations mượt, icons thay số, responsive tốt hơn
- **Redesign OrderSuccess**: Animation confetti/celebration, order summary, share button
- **Thêm Order Summary sidebar**: Sticky sidebar luôn hiển thị tổng tiền, coupon input, shipping estimate
- **Thêm Checkout Layout**: 2-column layout (desktop) — form bên trái, summary bên phải; stacked trên mobile
- **Cải thiện Dark Mode**: Đảm bảo tất cả components checkout render đẹp trong dark mode
- **Micro-animations**: Thêm page transitions, item removal animations, loading states

## Capabilities

### New Capabilities
- `checkout-ui-redesign`: Thiết kế lại toàn bộ giao diện checkout flow với layout 2 cột, animations, premium styling

### Modified Capabilities
_(Không có specs hiện tại cần thay đổi — đây thuần là UI redesign)_

## Impact

- **Frontend components**: `Checkout.tsx`, `CartReview.tsx`, `ShippingForm.tsx`, `CheckoutStepper.tsx`, `OrderSuccess.tsx`
- **No backend changes**: Logic đặt hàng giữ nguyên
- **No API changes**: Endpoints giữ nguyên
- **CSS/Tailwind**: Thêm custom animations và design tokens nếu cần
