## 1. Backend — soldCount Query

- [x] 1.1 Thêm custom JPQL query vào `OrderItemRepository`: soldCount per variant
- [x] 1.2 Thêm `soldCount` (long) + `bestSeller` (boolean) vào `ProductVariantResponse`
- [x] 1.3 Thêm `totalSoldCount` (long) vào `ProductResponse`

## 2. Backend — bestSeller Variant Migration

- [x] 2.1 Thêm `bestSeller` boolean field vào `ProductVariant.java`
- [x] 2.2 Xóa `bestSeller` field từ `Product.java`
- [x] 2.3 Thêm `bestSeller` vào `ProductVariantCreateRequest`
- [x] 2.4 Xóa `bestSeller` từ `ProductCreateRequest`, cập nhật `ProductSpecRequest` → variants.bestSeller
- [x] 2.5 Cập nhật `ProductServiceImpl`: handle bestSeller per variant khi create/update
- [x] 2.6 Cập nhật `ProductServiceImpl`: inject soldCount vào response via `toResponseWithSoldCount()`
- [x] 2.7 Filter `?bestSeller=true` via `ProductSpecRequest` → `variants.bestSeller`

## 3. Frontend — Types & API

- [x] 3.1 Cập nhật `ProductVariant` type: thêm `bestSeller`, `soldCount`
- [x] 3.2 Cập nhật `Product` type: thêm `totalSoldCount`, bestSeller derived từ variants
- [x] 3.3 Cập nhật `shopApi.ts`: mapper + payload variant-level bestSeller + soldCount

## 4. Frontend — Admin Expandable Table

- [x] 4.1 Refactor `ProductsTable.tsx`: expandable rows pattern ▶/▼
- [x] 4.2 Thu gọn: product row với total sold, variant count
- [x] 4.3 Mở rộng: variant sub-rows với soldCount, ★ BS toggle per variant
- [x] 4.4 Wired up `handleToggleVariantBestSeller` in `AdminPanel.tsx`

## 5. Frontend — BestSellers Landing

- [x] 5.1 Cập nhật `BestSellers.tsx`: hiện variant label + price + "Đã bán X"
- [x] 5.2 Card hiện: tên + variant label, giá variant, soldCount
- [x] 5.3 i18n keys cho "Đã bán" (`bestSellerSold`)

## 6. Verification

- [x] 6.1 Frontend build thành công (3.23s)
- [ ] 6.2 Docker rebuild (`make build`)
- [ ] 6.3 Admin: expand rows, soldCount hiện đúng
- [ ] 6.4 Admin: toggle BS per variant
- [ ] 6.5 Landing: Best Sellers hiện variant BS + "Đã bán X"
