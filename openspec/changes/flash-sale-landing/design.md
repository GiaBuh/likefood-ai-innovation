## Context

Trang chủ LandingPage sử dụng React + TypeScript + TailwindCSS v4 + react-i18next. Dữ liệu sản phẩm lấy từ `ShopContext` (fetch từ backend API `/products`). Sản phẩm có `compareAtPrice` khi đang giảm giá. Hiện trang chủ có: Hero → CategoryGrid → Brand Values → Featured Products → Testimonials → CTA.

## Goals / Non-Goals

**Goals:**
- Thêm Flash Sale section ngay dưới CategoryGrid trên LandingPage
- Countdown timer đếm ngược real-time (end time tính từ cuối ngày hiện tại)
- Hiển thị sản phẩm có `compareAtPrice > price` dưới dạng horizontal scroll carousel
- Mỗi product card: hình ảnh, badge % giảm, giá gốc gạch ngang, giá sale, sold progress bar
- Responsive (mobile → desktop), dark mode, i18n (VI/EN)

**Non-Goals:**
- Không tạo backend API riêng cho Flash Sale (dùng sản phẩm hiện có)
- Không tạo admin panel quản lý Flash Sale schedule riêng
- Không thêm real-time stock tracking

## Decisions

### 1. Dữ liệu sản phẩm Flash Sale
**Quyết định**: Filter sản phẩm từ `ShopContext` có `compareAtPrice > price`
**Lý do**: Tận dụng dữ liệu hiện có, không cần thêm API endpoint. Admin chỉ cần set `compareAtPrice` cho sản phẩm là tự hiện Flash Sale.
**Alternative**: Tạo API `/flash-sale` riêng — không cần thiết ở giai đoạn này.

### 2. Countdown Timer
**Quyết định**: Đếm ngược tới 23:59:59 của ngày hiện tại, reset mỗi ngày
**Lý do**: Đơn giản, tạo urgency mà không cần backend quản lý thời gian Flash Sale.

### 3. Sold Progress Bar
**Quyết định**: Dùng `Math.random()` seed từ product ID để tạo progress ổn định
**Lý do**: Backend chưa có dữ liệu sold count. Random seed đảm bảo cùng sản phẩm luôn hiện cùng progress.

### 4. Layout
**Quyết định**: Horizontal scroll carousel với nút prev/next, giống BannerCarousel pattern
**Lý do**: Phù hợp với Shopee reference, hiển thị nhiều sản phẩm mà không chiếm quá nhiều vertical space.

## Risks / Trade-offs

- **[Data giả cho sold bar]** → Khi backend có sold count API, cần cập nhật component
- **[Countdown reset mỗi ngày]** → Nếu cần schedule Flash Sale cụ thể, phải thêm config backend
- **[Ẩn section nếu không có sản phẩm giảm giá]** → Admin cần set compareAtPrice để Flash Sale hiện
