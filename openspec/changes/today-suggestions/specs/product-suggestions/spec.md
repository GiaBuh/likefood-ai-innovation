## ADDED Requirements

### Requirement: API gợi ý sản phẩm
Hệ thống SHALL cung cấp endpoint `GET /api/v1/products/suggestions` trả về danh sách sản phẩm gợi ý, phân trang 10 sản phẩm/trang. Endpoint MUST hỗ trợ cả authenticated và anonymous users.

#### Scenario: User đăng nhập có lịch sử mua hàng
- **WHEN** user đã đăng nhập và có đơn hàng COMPLETED
- **THEN** hệ thống SHALL trả về sản phẩm ưu tiên cùng category với sản phẩm đã mua, mix với sản phẩm random để đủ page size

#### Scenario: User đăng nhập chưa có đơn hàng
- **WHEN** user đã đăng nhập nhưng chưa có đơn hàng COMPLETED
- **THEN** hệ thống SHALL trả về sản phẩm random Active

#### Scenario: User chưa đăng nhập (anonymous)
- **WHEN** request không có authentication
- **THEN** hệ thống SHALL trả về sản phẩm random Active

#### Scenario: Phân trang
- **WHEN** client gửi `page` và `size` parameters
- **THEN** hệ thống SHALL trả về paginated response với đúng số lượng và metadata (totalPages, totalElements)

### Requirement: Component Gợi ý hôm nay trên Landing Page
Trang chủ SHALL hiển thị section "Gợi ý hôm nay" nằm trước footer (sau CTA section). Section MUST hiển thị grid 10 sản phẩm với button "Xem thêm".

#### Scenario: Hiển thị gợi ý trên trang chủ
- **WHEN** user truy cập trang chủ
- **THEN** section "Gợi ý hôm nay" SHALL hiển thị ở cuối trang (trước footer) với grid sản phẩm responsive (5 cột desktop, 2 cột mobile)

#### Scenario: Xem thêm sản phẩm
- **WHEN** user click "Xem thêm"
- **THEN** hệ thống SHALL load thêm 10 sản phẩm tiếp theo và append vào grid hiện tại
