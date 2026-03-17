## ADDED Requirements

### Requirement: Staff management page
Admin panel SHALL có trang "Quản lý nhân viên" (Staff Management) trong sidebar. Trang này hiển thị danh sách nhân viên (users có role khác USER), với các cột: Tên, Email, Role, Trạng thái.

#### Scenario: View staff list
- **WHEN** admin có permission STAFF:VIEW truy cập trang Staff Management
- **THEN** hệ thống MUST hiển thị danh sách nhân viên với tên, email, role name, status

### Requirement: Create staff account UI
Trang Staff Management SHALL có nút "Tạo nhân viên" mở modal form gồm: email, tên, mật khẩu tạm, chọn role (dropdown).

#### Scenario: Create new staff
- **WHEN** admin có permission STAFF:CREATE bấm "Tạo nhân viên" → điền form → bấm Lưu
- **THEN** hệ thống MUST gọi API `POST /users/staff` và hiển thị nhân viên mới trong danh sách

#### Scenario: Cannot see create button without permission
- **WHEN** nhân viên KHÔNG có permission STAFF:CREATE truy cập trang Staff Management
- **THEN** nút "Tạo nhân viên" MUST bị ẩn

### Requirement: Permission assignment UI (checkbox matrix)
Khi tạo hoặc sửa Role, admin SHALL thấy UI dạng checkbox matrix: hàng là resource (Sản phẩm, Đơn hàng...), cột là action (Xem, Thêm, Sửa, Xóa). Admin tick/bỏ tick để gán/bỏ permission.

#### Scenario: View permission matrix
- **WHEN** admin mở modal sửa role
- **THEN** hệ thống MUST hiển thị ma trận checkbox với tất cả resource x action, các permission đã được gán MUST có checkbox checked

#### Scenario: Save permission changes
- **WHEN** admin thay đổi checkboxes và bấm Lưu
- **THEN** hệ thống MUST gọi API `PUT /roles/{id}` với danh sách `permissionIds` mới

### Requirement: Role management in Staff page
Trang Staff Management SHALL có tab hoặc section quản lý Role: xem danh sách role, tạo role mới, sửa tên + permissions, xóa role.

#### Scenario: View roles list
- **WHEN** admin truy cập tab Roles trong Staff Management
- **THEN** hệ thống MUST hiển thị danh sách roles với tên, số permission, số nhân viên

#### Scenario: SUPER_ADMIN role protection in UI
- **WHEN** admin xem danh sách roles
- **THEN** role SUPER_ADMIN MUST hiển thị nhưng KHÔNG có nút Sửa/Xóa
