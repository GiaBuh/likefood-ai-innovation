## ADDED Requirements

### Requirement: Checkout layout 2 cột desktop
Trang checkout SHALL hiển thị layout 2 cột trên desktop (>=1024px): form/content bên trái (2/3), order summary sticky bên phải (1/3). Trên mobile, stacked vertically.

#### Scenario: Desktop layout
- **WHEN** user truy cập checkout trên desktop (>=1024px)
- **THEN** content hiển thị bên trái và order summary sticky bên phải

#### Scenario: Mobile layout
- **WHEN** user truy cập checkout trên mobile (<1024px)
- **THEN** content và summary stacked vertically, summary ở dưới

### Requirement: Premium stepper design
CheckoutStepper SHALL hiển thị icons thay vì số cho mỗi step, với gradient background, pulse animation cho step hiện tại, và check animation cho step hoàn thành.

#### Scenario: Active step animation
- **WHEN** user đang ở step 2
- **THEN** step 2 icon có pulse animation nhẹ, step 1 hiện check icon với scale animation

#### Scenario: Step transition
- **WHEN** user chuyển từ step 1 sang step 2
- **THEN** progress bar fill từ trái sang phải với smooth transition 500ms

### Requirement: Cart items premium cards
Các cart items trong CartReview SHALL hiển thị dạng card với ảnh lớn hơn (96x96 → 120x120), gradient border khi hover, smooth quantity transition, và delete button với confirmation visual.

#### Scenario: Hover effect
- **WHEN** user hover vào một cart item card
- **THEN** card hiện subtle shadow elevation và border color change

#### Scenario: Quantity change animation
- **WHEN** user thay đổi quantity
- **THEN** số quantity có fade transition khi thay đổi

### Requirement: Shipping form modern input
ShippingForm inputs SHALL có floating label animation, focus ring gradient, và icon indicators cho mỗi field type.

#### Scenario: Input focus
- **WHEN** user focus vào input field
- **THEN** label float lên trên input với transition, border chuyển sang primary gradient

#### Scenario: Validation error
- **WHEN** user submit form với field trống
- **THEN** input border chuyển đỏ với shake animation nhẹ

### Requirement: Order success celebration
OrderSuccess SHALL hiển thị animated checkmark (draw animation), confetti particles effect, và order number highlight.

#### Scenario: Success page load
- **WHEN** đơn hàng đặt thành công và chuyển sang step 3
- **THEN** checkmark icon draw animation 1s, confetti particles xuất hiện, fade out sau 3s

### Requirement: Consistent dark mode
Tất cả checkout components SHALL render chính xác trong dark mode với contrast ratio >= 4.5:1 cho text.

#### Scenario: Dark mode rendering
- **WHEN** user bật dark mode
- **THEN** backgrounds sử dụng neutral-800/900, text sử dụng white/neutral-200, borders sử dụng neutral-700

### Requirement: Page transition animations
Chuyển giữa các checkout steps SHALL có slide animation (slide-in-from-right khi tiến, slide-in-from-left khi lùi).

#### Scenario: Moving forward
- **WHEN** user click "Tiếp tục" từ step 1 → step 2
- **THEN** step 1 content slide out left, step 2 content slide in from right

#### Scenario: Moving backward
- **WHEN** user click "Quay lại" từ step 2 → step 1
- **THEN** step 2 content slide out right, step 1 content slide in from left
