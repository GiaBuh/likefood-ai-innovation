## Why

Dark mode toggle hiện tại bị lag/khựng khi chuyển đổi. Nguyên nhân: CSS `transition` được áp dụng lên **tất cả elements** (`*`, `*::before`, `*::after`) → browser phải animate hàng nghìn DOM nodes cùng lúc → gây jank/frame drop rõ rệt.

## What Changes

- **Xóa** CSS wildcard transition (`html.theme-transition *`) — là nguyên nhân gây lag
- **Thay thế** bằng screenshot-based transition: chụp screenshot trang hiện tại, đặt làm overlay, chuyển theme ngay lập tức phía dưới, rồi fade overlay ra → mượt 60fps vì chỉ animate 1 element
- **Cập nhật** Header.tsx toggle button logic để sử dụng cách tiếp cận mới

## Capabilities

### New Capabilities
- `darkmode-instant-swap`: Chuyển dark mode mượt bằng cách swap ngay lập tức + fade overlay screenshot, tránh animating toàn bộ DOM tree

### Modified Capabilities

## Impact

- `frontend/src/index.css` — xóa `.theme-transition` CSS rule, thêm overlay fade animation
- `frontend/components/layout/Header.tsx` — cập nhật toggle onClick handler
