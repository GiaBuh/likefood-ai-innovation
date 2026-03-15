## Context

Hiện tại `AiComboGenerator.tsx` cho admin chọn sản phẩm thủ công qua checkbox → gọi Gemini AI → sinh marketing copy + banner. Backend `ComboCampaign` entity lưu combo metadata nhưng **không lưu danh sách sản phẩm** trong combo. Không có trang công khai để khách hàng xem combo deals.

Product data model đã có sẵn: `totalSoldCount`, `soldCount` (per variant), `stock` (tổng quantity), `bestSeller` flag.

## Goals / Non-Goals

**Goals:**
- Smart scoring: `score = stock ÷ (soldCount + 1)` — ưu tiên sản phẩm tồn nhiều bán ít
- 2-tab UI: "Đề xuất thông minh" (auto) + "Chọn thủ công" (manual)
- Lưu items vào ComboCampaign entity
- Trang `/combo` công khai cho khách hàng browse combo deals
- Khi click combo → hiện sản phẩm + thêm vào giỏ

**Non-Goals:**
- Không thay đổi Gemini AI prompt/logic (giữ nguyên API flow)
- Không tạo shopping cart cho combo (mỗi SP thêm riêng)
- Không thêm combo pricing riêng (giữ discount %)
- Không làm combo expiry/scheduling

## Decisions

### 1. Scoring formula
**Quyết định**: `score = stock ÷ (soldCount + 1)` — computed hoàn toàn frontend side
**Lý do**: Đơn giản, data đã có sẵn, không cần backend computation. `+1` tránh chia cho 0.

### 2. Combo items storage
**Quyết định**: Thêm `@Column(columnDefinition = "TEXT") private String items;` lưu JSON array tên sản phẩm vào `ComboCampaign` entity. 
**Lý do**: Lightweight, không cần join table. Combo chỉ reference product names, không cần FK constraint.

### 3. Trang Combo thay thế About
**Quyết định**: Đổi route `/about` → `/combo`. Xóa `AboutPage.tsx`, tạo `ComboPage.tsx`.
**Lý do**: About page ít giá trị business, combo page tạo conversion trực tiếp.

### 4. AI-suggested discount
**Quyết định**: Truyền average score của selected items cho Gemini, để AI suggest discount %. Frontend hiển thị gợi ý nhưng admin vẫn có thể override trước khi publish.
**Lý do**: AI có context, admin có final say.

## Risks / Trade-offs

- **[Risk]** ComboCampaign.items lưu product names (string) → nếu rename product thì combo reference lỗi. **Mitigation**: Acceptable trade-off, combo campaigns ngắn hạn.
- **[Risk]** Public GET endpoint không cần auth → cần đảm bảo chỉ trả combo status=PUBLISHED. **Mitigation**: Filter ở service layer.
