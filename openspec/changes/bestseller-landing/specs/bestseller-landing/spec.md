## ADDED Requirements

### Requirement: Best Sellers section trên Landing Page
Landing page SHALL hiển thị section "Best Sellers" với grid sản phẩm được Admin đánh dấu.

#### Scenario: Hiển thị Best Sellers grid
- **GIVEN** có sản phẩm với bestSeller = true trong DB
- **WHEN** user mở Landing Page
- **THEN** hiện section "BEST SELLERS" với grid sản phẩm, mỗi card có: hình ảnh, badge "Best Seller" (top 2-3), tên, giá, nút "Đặt mua"

#### Scenario: Ẩn khi không có Best Seller
- **GIVEN** không có sản phẩm nào bestSeller = true 
- **WHEN** user mở Landing Page
- **THEN** section Best Sellers KHÔNG hiện

#### Scenario: Category tabs filter
- **GIVEN** có Best Seller từ nhiều danh mục
- **WHEN** user click tab danh mục (ví dụ "Trà sữa")
- **THEN** grid chỉ hiện sản phẩm Best Seller thuộc danh mục đó

#### Scenario: Responsive grid
- **WHEN** viewport < 640px → 2 columns
- **WHEN** 640px ≤ viewport < 1024px → 3 columns
- **WHEN** viewport ≥ 1024px → 5 columns

#### Scenario: Nút "Đặt mua"
- **WHEN** user click "Đặt mua" trên Best Seller card
- **THEN** navigate tới trang chi tiết sản phẩm
