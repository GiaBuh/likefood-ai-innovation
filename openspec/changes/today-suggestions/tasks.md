## 1. Backend — Suggestion Query + Endpoint

- [x] 1.1 Thêm JPQL query vào `OrderItemRepository`: lấy category IDs từ COMPLETED orders của user
- [x] 1.2 Thêm method `getSuggestions(Authentication, Pageable)` vào `ProductService`
- [x] 1.3 Logic: user authenticated → category match (purchase history); anonymous → all active products
- [x] 1.4 Thêm endpoint `GET /products/suggestions` vào `ProductController`

## 2. Frontend — API + Component

- [x] 2.1 Thêm `fetchSuggestions(page, size)` vào `shopApi.ts`
- [x] 2.2 Tạo component `TodaySuggestions.tsx` (grid 5col desktop/2col mobile, load more)
- [x] 2.3 Thêm `TodaySuggestions` vào `LandingPage.tsx` (sau CTA, trước footer)
- [x] 2.4 Thêm i18n keys (vi/en): todaySuggestions, todaySuggestionsDesc, loadMore

## 3. Verification

- [x] 3.1 Frontend build thành công
- [ ] 3.2 Test trang chủ hiển thị section "Gợi ý hôm nay" với 10 sản phẩm
- [ ] 3.3 Test click "Xem thêm" load thêm sản phẩm
