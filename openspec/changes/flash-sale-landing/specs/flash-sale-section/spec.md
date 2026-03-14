## ADDED Requirements

### Requirement: Flash Sale section hiển thị trên trang chủ
Hệ thống SHALL hiển thị phần Flash Sale trên trang chủ (LandingPage), đặt ngay dưới CategoryGrid và trên Brand Values section.

#### Scenario: Flash Sale hiển thị khi có sản phẩm giảm giá
- **WHEN** có ít nhất 1 sản phẩm có `compareAtPrice > price`
- **THEN** hệ thống hiển thị Flash Sale section với danh sách sản phẩm đang giảm giá

#### Scenario: Flash Sale ẩn khi không có sản phẩm giảm giá
- **WHEN** không có sản phẩm nào có `compareAtPrice > price`
- **THEN** hệ thống MUST ẩn toàn bộ Flash Sale section

### Requirement: Countdown timer đếm ngược
Flash Sale section SHALL hiển thị đồng hồ đếm ngược (HH:MM:SS) tới cuối ngày hiện tại (23:59:59).

#### Scenario: Timer đếm ngược real-time
- **WHEN** Flash Sale section hiển thị
- **THEN** countdown timer MUST cập nhật mỗi giây, hiển thị giờ:phút:giây còn lại

#### Scenario: Timer reset khi hết ngày
- **WHEN** countdown đạt 00:00:00
- **THEN** timer MUST tự động reset về 23:59:59 cho ngày mới

### Requirement: Product card hiển thị thông tin giảm giá
Mỗi sản phẩm trong Flash Sale SHALL hiển thị đầy đủ thông tin giảm giá.

#### Scenario: Hiển thị badge phần trăm giảm giá
- **WHEN** sản phẩm có `compareAtPrice = 20` và `price = 14`
- **THEN** badge hiển thị "-30%"

#### Scenario: Hiển thị giá gốc và giá sale
- **WHEN** sản phẩm có `compareAtPrice` và `price`
- **THEN** giá gốc (`compareAtPrice`) MUST hiển thị gạch ngang, giá sale (`price`) MUST hiển thị nổi bật

#### Scenario: Hiển thị sold progress bar
- **WHEN** sản phẩm hiển thị trong Flash Sale
- **THEN** MUST hiển thị thanh tiến trình "Đang bán chạy" với text "Đã bán X"

### Requirement: Carousel horizontal scroll
Danh sách sản phẩm Flash Sale SHALL cuộn ngang (horizontal scroll) với nút điều hướng.

#### Scenario: Cuộn qua nút prev/next
- **WHEN** user click nút mũi tên phải
- **THEN** carousel cuộn sang nhóm sản phẩm tiếp theo

#### Scenario: Responsive grid
- **WHEN** trên mobile (< 640px)
- **THEN** hiển thị 2 sản phẩm visible
- **WHEN** trên desktop (≥ 1024px)
- **THEN** hiển thị 5-6 sản phẩm visible

### Requirement: i18n và Dark Mode
Flash Sale section MUST hỗ trợ chuyển đổi ngôn ngữ (VI/EN) và dark mode.

#### Scenario: Chuyển ngôn ngữ
- **WHEN** user chuyển từ VI sang EN
- **THEN** tất cả text trong Flash Sale (tiêu đề, "Đã bán", "Xem tất cả") MUST chuyển sang tiếng Anh

#### Scenario: Dark mode
- **WHEN** user bật dark mode
- **THEN** Flash Sale section MUST hiển thị đúng với color scheme dark
