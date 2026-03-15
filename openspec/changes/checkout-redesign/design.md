## Context

Trang checkout hiện tại gồm 5 components: `Checkout.tsx` (container, 3-step flow), `CartReview.tsx` (danh sách sản phẩm + AI recommendations modal), `ShippingForm.tsx` (form thông tin + order summary), `CheckoutStepper.tsx` (thanh tiến trình), `OrderSuccess.tsx` (xác nhận thành công).

Giao diện hiện tại functional nhưng basic — thiếu tính premium so với phần Landing Page, Shop, và product cards đã được thiết kế rất đẹp. Cần nâng cấp visual quality mà giữ nguyên logic & API.

## Goals / Non-Goals

**Goals:**
- Redesign toàn bộ checkout UI sang phong cách premium, hiện đại
- Layout 2 cột trên desktop (content trái + sticky summary phải)
- Micro-animations mượt mà giữa các step
- Consistent dark mode support
- Mobile-first responsive design
- Giữ nguyên toàn bộ business logic và API calls

**Non-Goals:**
- Không thay đổi checkout flow (vẫn 3 bước)
- Không thay đổi backend API
- Không thêm payment gateway mới
- Không thêm chức năng checkout mới (chỉ redesign UI)

## Decisions

### 1. Giữ nguyên component structure
**Quyết định**: Chỉ redesign UI trong các component hiện tại, không tạo component mới hay tách/gộp.
**Lý do**: Giảm risk breaking changes, mọi props/interfaces giữ nguyên.
**Alternative**: Viết lại từ đầu → rủi ro cao hơn, thời gian nhiều hơn.

### 2. CSS enhancements trực tiếp — không thêm library mới
**Quyết định**: Dùng Tailwind classes + custom CSS, không thêm Framer Motion hay animation libs.
**Lý do**: Bundle size nhẹ, consistent với codebase hiện tại đang dùng Tailwind animate utilities.

### 3. Mobile-first approach
**Quyết định**: Thiết kế mobile trước, progressive enhancement cho desktop.
**Lý do**: Conversion rate checkout trên mobile thường thấp hơn → cải thiện mobile UX là ưu tiên.

## Risks / Trade-offs

- **[Risk]** Redesign có thể break existing test/visual regression → **Mitigation**: Kiểm tra browser sau mỗi component
- **[Risk]** Animation quá nhiều gây chậm trên thiết bị yếu → **Mitigation**: Dùng CSS animations thay JS, prefers-reduced-motion
- **[Risk]** Dark mode inconsistency → **Mitigation**: Test cả 2 mode trên mỗi component
