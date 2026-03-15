## Why

Trang admin đang có AI Combo Generator nhưng admin phải **tự chọn thủ công** sản phẩm vào combo. Không có logic thông minh nào gợi ý sản phẩm tồn kho cao + bán ít. Ngoài ra, combo sau khi publish chỉ tạo Product — không có trang riêng cho khách hàng xem danh sách combo deals.

## What Changes

### Backend
- Thêm `items` field (JSON list product names) vào `ComboCampaign` entity
- Thêm `GET /ai/combos/published` public endpoint để list combo đã publish
- Thêm `GET /ai/combos/{id}` public endpoint để xem chi tiết combo
- Sửa `POST /ai/combos/generate` để nhận và lưu product IDs/names

### Frontend Admin
- Redesign `AiComboGenerator.tsx` với 2 tabs:
  - Tab "Đề xuất thông minh": auto-rank sản phẩm theo score = stock ÷ (soldCount + 1), auto-select top 3
  - Tab "Chọn thủ công": giữ nguyên flow hiện tại
- Gửi product data khi generate combo
- AI suggest discount % based on inventory ratio

### Frontend Customer
- Đổi route `/about` → `/combo`
- Thay `AboutPage.tsx` → `ComboPage.tsx` hiện danh sách combo cards (banner, tên, slogan, discount %)
- Khi click combo → expand/modal hiện sản phẩm trong combo + "Thêm vào giỏ"
- Header nav: "Giới thiệu" → "Combo"

## Capabilities

### New Capabilities
- `smart-combo-suggestions`: Frontend scoring + auto-pick sản phẩm tồn kho cao bán ít
- `combo-showcase-page`: Trang `/combo` cho khách hàng xem danh sách combo deals

### Modified Capabilities
- `combo-generation`: Thêm items tracking, smart scoring, dual-tab UI
- `combo-publishing`: Publish giờ cũng hiện trên trang Combo

## Impact

- **Backend**: `ComboCampaign.java`, `ComboCampaignController.java`, `ComboCampaignService.java`
- **Frontend admin**: `AiComboGenerator.tsx`
- **Frontend customer**: `AboutPage.tsx` → `ComboPage.tsx`, `Header.tsx`, `App.tsx`
- **API**: `shopApi.ts` — thêm `getPublishedCombos()`, `getComboDetail()`
- **i18n**: Update translation keys `about.*` → `combo.*`
