## 1. Translation Keys

- [x] 1.1 Thêm Flash Sale i18n keys vào `locales/vi.json` (flashSaleTitle, flashSaleSold, flashSaleViewAll, flashSaleHot)
- [x] 1.2 Thêm Flash Sale i18n keys vào `locales/en.json`

## 2. FlashSale Component

- [x] 2.1 Tạo `components/home/FlashSale.tsx` — component chính
- [x] 2.2 Implement countdown timer hook (useCountdown) đếm ngược tới 23:59:59
- [x] 2.3 Implement filter sản phẩm `compareAtPrice > price` từ ShopContext
- [x] 2.4 Implement product card: hình ảnh, badge % giảm, giá gốc gạch ngang, giá sale
- [x] 2.5 Implement sold progress bar với seeded random từ product ID
- [x] 2.6 Implement horizontal scroll carousel với nút prev/next
- [x] 2.7 Implement responsive grid (2 items mobile → 5-6 items desktop)
- [x] 2.8 Implement dark mode styles
- [x] 2.9 Ẩn section nếu không có sản phẩm giảm giá

## 3. Integration

- [x] 3.1 Import FlashSale vào `LandingPage.tsx`, đặt dưới CategoryGrid
- [x] 3.2 Đảm bảo FlashSale không hiện khi chưa có sản phẩm giảm giá

## 4. Verification

- [x] 4.1 Build thành công (npx vite build) ✅ 3.05s
- [x] 4.2 Kiểm tra Flash Sale ẩn khi chưa có sản phẩm (verified - returns null correctly)
- [x] 4.3 Countdown timer logic verified (useCountdown hook + setInterval every 1s)
- [x] 4.4 Carousel scroll logic verified (scrollRef + scrollBy with smooth behavior)
- [x] 4.5 Dark mode classes verified (dark: prefixes throughout)
- [x] 4.6 i18n keys verified in both vi.json and en.json (5 keys each)

> Note: Full visual verification requires products in DB. Add products via Admin panel → FlashSale will auto-display.
