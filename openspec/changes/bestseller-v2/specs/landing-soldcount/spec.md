## CHANGED Requirements

### Requirement: Landing Best Sellers hiện soldCount
Best Seller cards trên landing page SHALL hiện "Đã bán X" cho mỗi sản phẩm.

#### Scenario: Card hiện đúng thông tin
- **GIVEN** variant với bestSeller=true, soldCount=100
- **THEN** card hiện: tên sản phẩm + variant label, giá variant, "Đã bán 100", badge Best Seller

#### Scenario: Fetch by variant bestSeller
- **WHEN** BestSellers component fetch dữ liệu
- **THEN** gọi GET /products?bestSeller=true và lọc variants có bestSeller=true
