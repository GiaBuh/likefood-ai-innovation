## Context

LIKEFOOD e-commerce: Java Spring Boot + React/TypeScript. Best Sellers v1 đã thêm `bestSeller` boolean ở Product level. OrderItem đã có FK tới ProductVariant + quantity field + Order có status enum (PENDING, CONFIRMED, SHIPPED, COMPLETED, CANCELED).

## Goals / Non-Goals

**Goals:**
- Admin toggle bestSeller per variant (không phải per product)
- soldCount tự động từ COMPLETED orders, hiện trên admin + landing
- Expandable rows trong admin ProductsTable
- Landing hiện "Đã bán X" trên Best Seller cards

**Non-Goals:**
- Không cache soldCount (query realtime đủ nhanh cho quy mô nhỏ-trung bình)
- Không tạo trang riêng best seller

## Decisions

### 1. soldCount Strategy
**Quyết định**: Query realtime từ OrderItem với JPQL custom query
**Lý do**: Đơn giản, chính xác, không cần cronjob. Query: `SELECT oi.variant.id, SUM(oi.quantity) FROM OrderItem oi WHERE oi.order.status = 'COMPLETED' GROUP BY oi.variant.id`

### 2. bestSeller Migration
**Quyết định**: Di chuyển từ Product → ProductVariant, xóa field trên Product
**Lý do**: Variant-level chính xác hơn. Product.bestSeller v1 sẽ bị xóa.

### 3. Admin Expandable Row
**Quyết định**: Click chevron ▶/▼ để expand, hiện sub-rows per variant
**Lý do**: Pattern phổ biến (Shopee, WooCommerce), clean UX, không chiếm nhiều space khi thu gọn

### 4. API Response Shape
**Quyết định**: Thêm `soldCount` + `bestSeller` vào ProductVariantResponse, thêm `totalSoldCount` vào ProductResponse
**Lý do**: 1 API call trả đủ data, không cần API riêng cho soldCount

## Risks / Trade-offs

- **Performance**: soldCount query per product page load. OK ở quy mô nhỏ-trung bình. Nếu scale lớn → thêm caching hoặc materialized view.
- **Migration**: Xóa Product.bestSeller có thể ảnh hưởng Landing page tạm thời → update Frontend cùng lúc.
