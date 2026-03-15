## Context

LandingPage hiện có: Hero → CategoryGrid → FlashSale → BestSellers → BrandValues → Featured → Testimonials → CTA → Footer. Chưa có section gợi ý cá nhân hóa. Backend đã có `ProductController` với `GET /products` + pageable, `OrderItemRepository` query COMPLETED orders.

## Goals / Non-Goals

**Goals:**
- API suggestions trả sản phẩm gợi ý phân trang (10/page)
- User đăng nhập: ưu tiên category đã mua + mix random
- Anonymous: random shuffle
- Component đẹp, responsive, nằm trước footer
- Load more pagination

**Non-Goals:**
- Không dùng AI/ML recommendation (chỉ random + category-based)
- Không tracking browsing history
- Không infinite scroll (dùng button "Xem thêm")

## Decisions

### Backend: Dùng endpoint mới thay vì mở rộng existing

**Chọn**: `GET /api/v1/products/suggestions?page=0&size=10`

**Logic:**
1. Lấy `Authentication` → nếu có user → query `OrderItemRepository` lấy category IDs từ orders COMPLETED
2. Query `ProductRepository`:
   - User có lịch sử: `findByCategoryIdIn(categoryIds)` + `findByStatusActive()` random → mix 70% category + 30% random
   - Anonymous: `findByStatusActive()` random shuffle
3. Loại bỏ duplicate, phân trang

**Tại sao endpoint riêng?** → Logic khác biệt (random, user context), không nên trộn vào `GET /products`.

### Frontend: Component riêng TodaySuggestions

Tương tự BestSellers nhưng:
- Grid 5 cột desktop, 2 cột mobile
- Title "Gợi ý hôm nay" với icon auto_awesome
- Button "Xem thêm" load page tiếp theo (append vào grid)
- Dùng ProductCard existing

## Risks / Trade-offs

- **Trade-off**: Random shuffle = kết quả khác mỗi lần reload → chấp nhận (UX tốt, user thấy sản phẩm mới)
- **Risk**: User mới chưa có order → fallback random → OK vì đây là default behavior
