## ADDED Requirements

### Requirement: Create role with permissions
Admin SHALL có thể tạo Role mới kèm danh sách permission IDs. API `POST /roles` nhận body có `name` và `permissionIds[]`.

#### Scenario: Create role with selected permissions
- **WHEN** admin gửi `POST /roles` với `{ name: "Quản lý kho", permissionIds: ["p1", "p2", "p3"] }`
- **THEN** hệ thống MUST tạo role mới và gán 3 permissions cho role đó

#### Scenario: Create role with duplicate name
- **WHEN** admin tạo role với name đã tồn tại
- **THEN** hệ thống MUST trả lỗi 400 "Role name already exists"

### Requirement: Update role permissions
Admin SHALL có thể cập nhật danh sách permissions của một Role. API `PUT /roles/{id}` nhận `name` và `permissionIds[]` mới — replace toàn bộ permissions cũ.

#### Scenario: Update permissions of existing role
- **WHEN** admin gửi `PUT /roles/{id}` với `permissionIds` mới
- **THEN** hệ thống MUST xóa tất cả permissions cũ và gán permissions mới

### Requirement: Delete role
Admin SHALL có thể xóa Role. API `DELETE /roles/{id}`.

#### Scenario: Delete role with users
- **WHEN** admin xóa role đang được gán cho user
- **THEN** hệ thống MUST trả lỗi 400 "Cannot delete role with assigned users"

### Requirement: SUPER_ADMIN protection
Role SUPER_ADMIN SHALL KHÔNG thể bị sửa, xóa, hoặc thay đổi permissions. SUPER_ADMIN tự động có toàn quyền (bypass permission check).

#### Scenario: Attempt to delete SUPER_ADMIN role
- **WHEN** bất kỳ ai cố xóa role SUPER_ADMIN
- **THEN** hệ thống MUST trả lỗi 403 "Cannot modify SUPER_ADMIN role"

#### Scenario: Attempt to update SUPER_ADMIN role
- **WHEN** bất kỳ ai cố sửa role SUPER_ADMIN
- **THEN** hệ thống MUST trả lỗi 403 "Cannot modify SUPER_ADMIN role"

### Requirement: List all permissions
API `GET /permissions` SHALL trả danh sách tất cả permissions, grouped by resource.

#### Scenario: Get all permissions
- **WHEN** admin gửi `GET /permissions`
- **THEN** hệ thống MUST trả danh sách tất cả permission records với format `[{ id, resource, action }]`

### Requirement: Get role with permissions
API `GET /roles` SHALL trả danh sách roles kèm permissions của từng role.

#### Scenario: List roles with permissions
- **WHEN** admin gửi `GET /roles`
- **THEN** response MUST chứa mỗi role kèm `permissions: [{ id, resource, action }]`
