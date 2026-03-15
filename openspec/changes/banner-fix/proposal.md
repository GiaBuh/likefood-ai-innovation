## Why

3 ảnh banner hiện tại (`banner-freeship.png`, `banner-combo.png`, `banner-new-arrival.png`) đều 640x640 (hình vuông 1:1). Carousel container là dạng panorama ngang → ảnh bị co/cắt/letterbox, không vừa vặn.

## What Changes

- **Tạo mới** 3 ảnh banner với kích thước panorama (1440×420, tỉ lệ ~3.4:1) để vừa khung carousel
- **Cập nhật** CSS trong `BannerCarousel.tsx` sử dụng aspect ratio cố định thay vì auto height
- **Giữ nguyên** nội dung banner: Freeship, Combo giảm giá, Hàng mới về

## Capabilities

### New Capabilities
- `banner-responsive`: Banner carousel hiển thị ảnh panorama vừa vặn, responsive trên mọi kích thước màn hình

### Modified Capabilities

## Impact

- `frontend/public/banners/banner-freeship.png` — thay bằng ảnh 1440×420
- `frontend/public/banners/banner-combo.png` — thay bằng ảnh 1440×420
- `frontend/public/banners/banner-new-arrival.png` — thay bằng ảnh 1440×420
- `frontend/components/home/BannerCarousel.tsx` — cập nhật CSS cho responsive aspect ratio
