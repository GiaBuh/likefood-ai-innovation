## ADDED Requirements

### Requirement: Permission entity
Hệ thống SHALL có entity `Permission` với 2 field chính: `resource` (enum: DASHBOARD, PRODUCTS, CATEGORIES, ORDERS, CUSTOMERS, VOUCHERS, CHAT, STAFF) và `action` (enum: VIEW, CREATE, EDIT, DELETE). Mỗi Permission là unique theo cặp (resource, action).

#### Scenario: Permission data structure
- **WHEN** hệ thống khởi động
- **THEN** bảng `permissions` MUST chứa các record được seed sẵn với unique constraint trên cặp (resource, action)

### Requirement: Role-Permission many-to-many
Hệ thống SHALL có bảng trung gian `role_permissions` liên kết Role ↔ Permission (many-to-many). Một Role có thể có nhiều Permission, một Permission có thể thuộc nhiều Role.

#### Scenario: Role with multiple permissions
- **WHEN** role "Quản lý kho" được tạo với permissions [PRODUCTS:VIEW, PRODUCTS:CREATE, PRODUCTS:EDIT, CATEGORIES:VIEW]
- **THEN** bảng `role_permissions` MUST chứa 4 records cho role đó

### Requirement: Permission seed data
Danh sách permission SHALL được seed tự động khi ứng dụng khởi động. Danh sách cố định:
- DASHBOARD: VIEW
- PRODUCTS: VIEW, CREATE, EDIT, DELETE
- CATEGORIES: VIEW, CREATE, EDIT, DELETE
- ORDERS: VIEW, EDIT
- CUSTOMERS: VIEW, EDIT
- VOUCHERS: VIEW, CREATE, EDIT, DELETE
- CHAT: VIEW
- STAFF: VIEW, CREATE, EDIT, DELETE

#### Scenario: First startup seed
- **WHEN** ứng dụng khởi động lần đầu (bảng permissions rỗng)
- **THEN** hệ thống MUST tạo tất cả 24 permission records

#### Scenario: Subsequent startup no-duplicate
- **WHEN** ứng dụng khởi động và permissions đã tồn tại
- **THEN** hệ thống MUST NOT tạo duplicate records
