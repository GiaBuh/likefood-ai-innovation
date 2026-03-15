## 1. Backend — Product Entity + DTO

- [x] 1.1 Thêm `private boolean bestSeller = false` vào `Product.java`
- [x] 1.2 Thêm `private Boolean bestSeller` vào `ProductCreateRequest.java`
- [x] 1.3 Thêm `private boolean bestSeller` vào `ProductResponse.java`
- [x] 1.4 Thêm `@FilterField bestSeller` vào `ProductSpecRequest.java`
- [x] 1.5 Cập nhật `ProductServiceImpl` xử lý bestSeller khi create/update

## 2. Frontend — Admin Toggle

- [x] 2.1 Thêm `bestSeller?: boolean` vào `Product` type trong `types.ts`
- [x] 2.2 Thêm cột ★ toggle Best Seller vào `ProductsTable.tsx`
- [x] 2.3 API: bestSeller in `BackendProduct`, `toProduct`, `buildProductPayload`, `ProductQuery`, `fetchProductsWithQuery`

## 3. Frontend — BestSellers Component

- [x] 3.1 Thêm i18n keys vào `vi.json` và `en.json`
- [x] 3.2 Tạo `BestSellers.tsx` — fetch `/products?bestSeller=true&status=ACTIVE`
- [x] 3.3 Implement category tabs filter
- [x] 3.4 Implement product card: hình ảnh, badge, tên, giá, nút "Đặt mua"
- [x] 3.5 Implement responsive grid (2/3/5 cols)
- [x] 3.6 Ẩn section nếu không có Best Seller
- [x] 3.7 Dark mode support

## 4. Integration

- [x] 4.1 Import BestSellers vào `LandingPage.tsx`, đặt sau FlashSale

## 5. Verification

- [x] 5.1 Backend: code syntatically correct (no local JDK, runs in Docker)
- [x] 5.2 Frontend build thành công (2.84s)
- [ ] 5.3 API test: GET /products?bestSeller=true (cần chạy Docker backend)
- [ ] 5.4 Admin: toggle Best Seller (cần chạy Docker backend)
- [ ] 5.5 Landing: Best Sellers hiện đúng (cần data trong DB)
