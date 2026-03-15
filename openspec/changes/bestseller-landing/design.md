## Context

LIKEFOOD là Java Spring Boot backend + React/TypeScript frontend. Product entity dùng JPA/Hibernate, MapStruct mapper, Spring Data JPA Specification cho filtering. Frontend dùng Tailwind CSS, react-i18next.

## Goals / Non-Goals

**Goals:**
- Admin có thể đánh dấu sản phẩm là "Best Seller" từ trang quản lý
- Landing page hiển thị grid Best Seller products với category tabs
- API hỗ trợ filter `?bestSeller=true` để lấy danh sách Best Seller
- Responsive: 2 cols mobile, 3 tablet, 5 desktop

**Non-Goals:**
- Không tự động tính Best Seller theo số lượng bán
- Không giới hạn số lượng Best Seller
- Không thêm trang riêng cho Best Seller (chỉ section trên Landing)

## Decisions

### 1. Field Design
**Quyết định**: Thêm `boolean bestSeller` (default false) vào Product entity  
**Lý do**: Đơn giản, Admin toggle on/off, không cần table riêng

### 2. Admin UX
**Quyết định**: Thêm icon ★ toggle trực tiếp trên ProductsTable row  
**Lý do**: Nhanh, không cần mở modal, 1-click toggle

### 3. API Filter
**Quyết định**: Thêm `bestSeller` param vào ProductSpecRequest với `@FilterField(operator = EQUAL)`  
**Lý do**: Consistent với existing filter pattern (status, categoryName, price)

### 4. Frontend Component
**Quyết định**: BestSellers.tsx component riêng, fetch từ `/products?bestSeller=true`  
**Lý do**: Tách biệt, dễ maintain, data thật từ backend

## Risks / Trade-offs

- **[DB Migration]** → Hibernate auto-update sẽ thêm column, không cần migration script riêng
- **[CORS]** → Đã có CORS config sẵn
- **[Empty state]** → Component tự ẩn nếu không có sản phẩm Best Seller
