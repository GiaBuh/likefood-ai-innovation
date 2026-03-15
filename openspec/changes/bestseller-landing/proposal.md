## Why

Trang chủ LIKEFOOD cần section "Best Sellers" để highlight sản phẩm bán chạy nhất do Admin chọn. Admin muốn chủ động đánh dấu sản phẩm nào là Best Seller từ trang quản lý, thay vì tự động theo số lượng bán.

## What Changes

### Backend (Java Spring Boot)
- Thêm field `bestSeller` (boolean) vào Product entity
- Cập nhật DTO: ProductCreateRequest, ProductResponse, ProductSpecRequest
- Hỗ trợ filter `?bestSeller=true` trên GET /products

### Frontend — Admin Panel
- Thêm toggle/button Best Seller trên ProductsTable hoặc Edit Modal
- Admin có thể bật/tắt Best Seller cho từng sản phẩm

### Frontend — Landing Page
- Tạo component BestSellers.tsx hiển thị grid sản phẩm Best Seller
- Category tabs để filter theo danh mục
- Mỗi sản phẩm có badge "Best Seller", hình ảnh, tên, giá, nút "Đặt mua"
- Đặt sau FlashSale, trước Brand Values

## Capabilities

### New Capabilities
- `bestseller-backend`: Backend field + filter cho Best Seller
- `bestseller-admin`: Admin toggle Best Seller trên sản phẩm
- `bestseller-landing`: Component Best Sellers trên trang chủ

## Impact

- **Backend**: Product.java, ProductCreateRequest, ProductResponse, ProductSpecRequest, ProductServiceImpl
- **Frontend Admin**: ProductsTable.tsx hoặc ProductModals.tsx
- **Frontend Landing**: BestSellers.tsx (NEW), LandingPage.tsx
- **i18n**: vi.json, en.json
- **Types**: types.ts
