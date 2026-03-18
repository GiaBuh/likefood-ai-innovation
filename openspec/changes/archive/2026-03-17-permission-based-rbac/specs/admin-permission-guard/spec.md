## ADDED Requirements

### Requirement: PermissionGuard component
Frontend SHALL có component `<PermissionGuard resource="..." action="...">` wrap nội dung cần permission. Nếu user KHÔNG có permission tương ứng, children MUST bị ẩn (không render).

#### Scenario: User with permission sees content
- **WHEN** user có permission PRODUCTS:CREATE và component `<PermissionGuard resource="PRODUCTS" action="CREATE"><button>Thêm SP</button></PermissionGuard>` render
- **THEN** nút "Thêm SP" MUST hiển thị

#### Scenario: User without permission content hidden
- **WHEN** user KHÔNG có permission PRODUCTS:CREATE
- **THEN** nút "Thêm SP" MUST bị ẩn hoàn toàn

### Requirement: usePermission hook
Frontend SHALL có hook `usePermission()` trả về helper functions: `hasPermission(resource, action)`, `hasAnyPermission(resource)`, `permissions[]`.

#### Scenario: Check permission
- **WHEN** component gọi `hasPermission('PRODUCTS', 'EDIT')`
- **THEN** hook MUST trả `true` nếu user có permission đó, `false` nếu không

### Requirement: Sidebar conditional render
Admin sidebar SHALL chỉ hiển thị menu item cho resource mà user có permission VIEW. Ví dụ: user không có VOUCHERS:VIEW → menu "Voucher" ẩn.

#### Scenario: Staff sees limited sidebar
- **WHEN** nhân viên có permissions [DASHBOARD:VIEW, PRODUCTS:VIEW, ORDERS:VIEW] đăng nhập admin panel
- **THEN** sidebar MUST chỉ hiện: Dashboard, Sản phẩm, Đơn hàng. MUST ẩn: Danh mục, Khách hàng, Voucher, Chat, Nhân viên

#### Scenario: SUPER_ADMIN sees all sidebar items
- **WHEN** SUPER_ADMIN đăng nhập admin panel
- **THEN** sidebar MUST hiện TẤT CẢ menu items

### Requirement: Action buttons conditional render
Trong mỗi trang admin, các nút hành động (Thêm, Sửa, Xóa) SHALL chỉ hiện khi user có permission tương ứng (CREATE, EDIT, DELETE).

#### Scenario: Products page without DELETE permission
- **WHEN** nhân viên có [PRODUCTS:VIEW, PRODUCTS:EDIT] nhưng KHÔNG có PRODUCTS:DELETE
- **THEN** trang Products MUST hiện nút Sửa nhưng MUST ẩn nút Xóa

### Requirement: Login response permissions
Login API response SHALL chứa field `permissions: string[]` dạng `["PRODUCTS:VIEW", "PRODUCTS:CREATE", ...]`. Frontend lưu vào AuthContext.

#### Scenario: Login returns permissions
- **WHEN** user login thành công
- **THEN** response MUST chứa field `permissions` là mảng các chuỗi permission dạng `RESOURCE:ACTION`

### Requirement: Force change password modal
Khi user đăng nhập và `mustChangePassword = true`, frontend SHALL hiển thị modal bắt buộc đổi mật khẩu. User KHÔNG thể đóng modal hoặc navigate đi nơi khác.

#### Scenario: First login with temp password
- **WHEN** nhân viên đăng nhập lần đầu (mustChangePassword = true)
- **THEN** frontend MUST hiện modal đổi mật khẩu không thể đóng

#### Scenario: After changing password
- **WHEN** nhân viên điền mật khẩu mới hợp lệ và bấm Lưu
- **THEN** hệ thống MUST gọi API đổi mật khẩu, đóng modal, và redirect vào admin panel bình thường
