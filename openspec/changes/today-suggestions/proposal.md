## Why

Trang chủ hiện tại chưa có section gợi ý sản phẩm cá nhân hóa. User phải tự navigate qua Shop page hoặc category để tìm sản phẩm. Thêm "Gợi ý hôm nay" sẽ tăng engagement và conversion bằng cách đề xuất sản phẩm phù hợp ngay trên landing page.

## What Changes

- **Thêm** API endpoint `GET /api/v1/products/suggestions` — trả về sản phẩm gợi ý (10/trang, phân trang)
- **Thêm** logic gợi ý: user đăng nhập → ưu tiên category đã mua + mix random; anonymous → random shuffle
- **Thêm** JPQL query lấy category IDs từ đơn hàng COMPLETED của user
- **Thêm** component `TodaySuggestions` trên landing page (nằm trước footer, sau CTA)
- **Thêm** frontend API function `fetchSuggestions`
- **Thêm** i18n keys (vi/en)

## Capabilities

### New Capabilities
- `product-suggestions`: Gợi ý sản phẩm dựa trên random + lịch sử mua hàng, hiển thị trên trang chủ với phân trang 10 sản phẩm/trang

### Modified Capabilities

## Impact

- `backend/product/controller/ProductController.java` — thêm endpoint `/suggestions`
- `backend/product/service/ProductService.java` — thêm method `getSuggestions`
- `backend/order/repository/OrderItemRepository.java` — thêm query lấy category IDs
- `frontend/components/home/TodaySuggestions.tsx` — component mới
- `frontend/components/pages/LandingPage.tsx` — đặt component vào trước footer
- `frontend/services/shopApi.ts` — thêm `fetchSuggestions`
- `frontend/locales/vi.json`, `en.json` — thêm i18n keys
