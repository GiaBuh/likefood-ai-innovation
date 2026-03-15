## ADDED Requirements

### Requirement: Product entity hỗ trợ Best Seller flag
Product entity SHALL có field `bestSeller` (boolean, default false).

#### Scenario: Thêm field bestSeller vào Product
- **GIVEN** Product entity hiện có
- **WHEN** thêm field `private boolean bestSeller = false`
- **THEN** Hibernate auto-update tạo column `best_seller` trong DB

### Requirement: API filter theo bestSeller
GET /products SHALL hỗ trợ query param `bestSeller=true` để lọc sản phẩm Best Seller.

#### Scenario: Filter best seller products
- **WHEN** GET /products?bestSeller=true
- **THEN** API trả về chỉ các sản phẩm có bestSeller = true

#### Scenario: Create/Update product với bestSeller
- **WHEN** POST/PUT /products với body `{ "bestSeller": true, ... }`
- **THEN** product được lưu với bestSeller = true

### Requirement: ProductResponse trả về bestSeller
ProductResponse SHALL chứa field `bestSeller` (boolean).

#### Scenario: Response chứa bestSeller
- **WHEN** GET /products hoặc GET /products/{id}
- **THEN** mỗi product trong response có field `bestSeller`
