## 1. CSS — Xóa wildcard transition, thêm overlay animation

- [x] 1.1 Xóa `.theme-transition` wildcard transition rule từ `index.css`
- [x] 1.2 Thêm `#theme-fade-overlay` CSS animation (opacity 1→0, 0.3s ease)

## 2. Header — Cập nhật toggle handler

- [x] 2.1 Cập nhật `Header.tsx` toggle onClick: tạo overlay với bg = theme hiện tại
- [x] 2.2 Toggle class `dark` ngay lập tức
- [x] 2.3 Fade out overlay 0.3s, xóa overlay khỏi DOM
- [x] 2.4 Xử lý click liên tục: xóa overlay cũ trước khi tạo mới

## 3. Verification

- [x] 3.1 Frontend build thành công
- [ ] 3.2 Test chuyển light→dark: mượt không lag
- [ ] 3.3 Test chuyển dark→light: mượt không lag
- [ ] 3.4 Test click liên tục: không lỗi, không overlay dư
