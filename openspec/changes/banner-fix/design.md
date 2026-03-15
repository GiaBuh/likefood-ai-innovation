## Context

BannerCarousel hiển thị 3 banner PNG trong slider. Ảnh hiện tại 640×640 (1:1) nhưng container rộng full-width → không fit.

## Goals / Non-Goals

**Goals:**
- Ảnh banner vừa khung, không bị crop hay letterbox
- Responsive trên desktop/tablet/mobile
- Giữ nguyên thông điệp marketing (Freeship, Combo, Hàng mới)

**Non-Goals:**
- Không thay đổi logic carousel (auto-slide, arrows, dots)
- Không thêm/xóa banner slides

## Decisions

### Kích thước: 1440×420 (~3.4:1)

**Tại sao?**
- Max container = 1440px → banner 1440px width = pixel-perfect trên desktop
- Height 420px = đủ cao cho mobile, không quá lớn trên desktop
- Tỉ lệ 3.4:1 phù hợp với e-commerce banners (Shopee, Tiki dùng tương tự)

### CSS: aspect-ratio + object-cover

Dùng `aspect-ratio: 24/7` (≈3.43:1) trên container + `object-cover` trên img → đảm bảo responsive trên mọi breakpoint. Ảnh 1440×420 sẽ fit hoàn hảo.

## Risks / Trade-offs

- **Risk**: Image generation có thể không hoàn hảo → Mitigation: user review trước khi deploy
