## Why

Trang chủ (Landing Page) hiện thiếu phần Flash Sale — một tính năng quan trọng giúp tạo cảm giác khẩn cấp (urgency) và thúc đẩy mua hàng. Shopee và các sàn TMĐT lớn đều sử dụng Flash Sale ở đầu trang. Thêm Flash Sale vào dưới phần Danh Mục trên trang chủ sẽ tăng tỷ lệ chuyển đổi và tạo trải nghiệm mua sắm hấp dẫn hơn.

## What Changes

- Thêm component **FlashSale** hiển thị trên trang chủ, ngay dưới CategoryGrid
- Đồng hồ đếm ngược (countdown timer) real-time cho sự kiện Flash Sale
- Hiển thị sản phẩm giảm giá với badge % giảm, giá gốc gạch ngang, giá sale
- Thanh tiến trình "Đang bán chạy" cho mỗi sản phẩm (sold progress bar)
- Carousel horizontal scroll cho danh sách sản phẩm Flash Sale
- Sản phẩm Flash Sale lấy từ danh sách sản phẩm có `compareAtPrice > price` (sản phẩm đang giảm giá)
- Hỗ trợ dark mode và responsive (mobile → desktop)
- i18n cho tất cả text (VI/EN)

## Capabilities

### New Capabilities
- `flash-sale-section`: Component Flash Sale trên trang chủ với countdown timer, product carousel, discount badges, sold progress bars, và auto-scroll

### Modified Capabilities
_None — không thay đổi spec hiện tại_

## Impact

- **Frontend**: Thêm `FlashSale.tsx` component, cập nhật `LandingPage.tsx`
- **Translations**: Thêm keys vào `en.json` và `vi.json`
- **Data**: Sử dụng dữ liệu sản phẩm hiện có từ `ShopContext` (không cần backend mới)
- **Dependencies**: Không thêm dependency mới
