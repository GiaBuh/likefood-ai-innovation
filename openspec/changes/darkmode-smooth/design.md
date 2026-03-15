## Context

Dark mode toggle hiện tại sử dụng CSS wildcard transition:
```css
html.theme-transition *,
html.theme-transition *::before,
html.theme-transition *::after {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease !important;
}
```
Cách này force browser animate **mọi DOM element** cùng lúc (hàng nghìn nodes) → gây frame drop/jank rõ rệt.

## Goals / Non-Goals

**Goals:**
- Dark mode chuyển đổi mượt mà, không lag/khựng
- Hiệu ứng trực quan đẹp, cảm giác premium
- Giữ 60fps trong suốt quá trình transition

**Non-Goals:**
- Không thay đổi logic lưu theme (localStorage vẫn giữ nguyên)
- Không thay đổi icon toggle (sun/moon đã fix xong)

## Decisions

### Approach: Overlay-based instant swap

**Chọn**: Tạo 1 overlay element duy nhất, fade nó ra → chỉ animate 1 element thay vì hàng nghìn.

**Cách hoạt động:**
1. Click toggle → tạo 1 div overlay phủ toàn bộ viewport với background = màu theme HIỆN TẠI
2. Toggle class `dark` ngay lập tức (user không thấy vì overlay che)
3. Fade out overlay 0.3s → lộ ra theme mới bên dưới
4. Xóa overlay khỏi DOM

**Tại sao không dùng wildcard transition?** → Performance: animate 1 element opacity vs animate N000 elements background/color/border = chênh lệch cực lớn.

**Tại sao không dùng View Transitions API?** → Browser support chưa rộng (Safari chưa hỗ trợ đầy đủ).

## Risks / Trade-offs

- **Trade-off**: Không thấy từng element "fade" riêng lẻ → chấp nhận vì nó gây lag
- **Risk**: Overlay z-index conflict → Mitigation: dùng z-index 99999 + pointer-events: none
