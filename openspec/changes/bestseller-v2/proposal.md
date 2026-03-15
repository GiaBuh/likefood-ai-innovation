## Why

Best Seller v1 đánh dấu ở cấp Product — không chính xác khi sản phẩm có nhiều variants (ví dụ: Trà Sữa size M vs size L) mà chỉ 1 variant bán chạy. Ngoài ra Admin cần xem số lượng đã bán (soldCount) của từng variant để ra quyết định.

## What Changes

### Backend
- Di chuyển `bestSeller` flag từ **Product** sang **ProductVariant**
- Thêm `soldCount` (tính tự động từ OrderItem) vào ProductVariantResponse
- Thêm `totalSoldCount` vào ProductResponse (sum tất cả variants)
- Filter `?bestSeller=true` hoạt động ở cấp variant

### Frontend — Admin Panel
- ProductsTable chuyển sang **Expandable Row** pattern
  - Thu gọn: product name, total variants, giá range, total sold
  - Mở rộng: per-variant sold count, ★ BS toggle per variant

### Frontend — Landing Page
- BestSellers.tsx cập nhật: fetch variants có bestSeller=true
- Card hiện: tên sản phẩm + variant label, giá variant, "Đã bán X"

## Capabilities

- `soldcount-backend`: Tính soldCount từ completed orders
- `bestseller-variant`: bestSeller flag ở variant level
- `admin-expandable`: Expandable rows + sold count display
- `landing-soldcount`: "Đã bán X" trên Best Seller cards

## Impact

- **Backend**: ProductVariant, ProductVariantResponse, ProductResponse, ProductServiceImpl, OrderItemRepository, ProductMapper
- **Frontend**: types.ts, shopApi.ts, ProductsTable.tsx, BestSellers.tsx, LandingPage.tsx, vi.json, en.json
