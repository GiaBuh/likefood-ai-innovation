## ADDED Requirements

### Requirement: Permission-based endpoint security
Backend SHALL check permission (resource:action) trên mỗi admin endpoint thay vì chỉ check role ADMIN. Sử dụng custom `@PreAuthorize` expression kết hợp `PermissionEvaluator`.

#### Scenario: User with PRODUCTS:CREATE permission
- **WHEN** user có permission PRODUCTS:CREATE gửi `POST /products`
- **THEN** hệ thống MUST cho phép truy cập

#### Scenario: User without PRODUCTS:CREATE permission
- **WHEN** user KHÔNG có permission PRODUCTS:CREATE gửi `POST /products`
- **THEN** hệ thống MUST trả lỗi 403 Forbidden

#### Scenario: SUPER_ADMIN bypass
- **WHEN** user có role SUPER_ADMIN gửi bất kỳ request nào
- **THEN** hệ thống MUST cho phép truy cập (bypass mọi permission check)

### Requirement: Permission mapping to endpoints
Các endpoint SHALL được bảo vệ bởi permission tương ứng:

| Endpoint | Permission |
|----------|------------|
| GET /products, /categories | PRODUCTS:VIEW |
| POST /products, /products/import | PRODUCTS:CREATE |
| PUT /products/* | PRODUCTS:EDIT |
| DELETE /products/* | PRODUCTS:DELETE |
| POST /categories | CATEGORIES:CREATE |
| PUT /categories/* | CATEGORIES:EDIT |
| DELETE /categories/* | CATEGORIES:DELETE |
| GET /orders (admin) | ORDERS:VIEW |
| PATCH /orders/*/status | ORDERS:EDIT |
| GET /users (admin list) | CUSTOMERS:VIEW or STAFF:VIEW |
| PUT /users/* (admin update) | CUSTOMERS:EDIT or STAFF:EDIT |
| POST /users/staff | STAFF:CREATE |
| GET /roles, POST /roles, etc. | STAFF:VIEW/CREATE/EDIT/DELETE |
| GET /vouchers (admin), POST /vouchers | VOUCHERS:VIEW/CREATE |
| PUT /vouchers/*, DELETE /vouchers/* | VOUCHERS:EDIT/DELETE |

#### Scenario: Order manager can view but not edit products
- **WHEN** user có permissions [ORDERS:VIEW, ORDERS:EDIT] nhưng KHÔNG có PRODUCTS:EDIT
- **THEN** user MUST có thể xem đơn hàng và đổi trạng thái, nhưng MUST bị từ chối khi cố sửa sản phẩm

### Requirement: User permission API
API `GET /users/me/permissions` SHALL trả danh sách permissions của user hiện tại.

#### Scenario: Get my permissions
- **WHEN** authenticated user gửi `GET /users/me/permissions`
- **THEN** response MUST chứa `[{ resource, action }]` của tất cả permissions thuộc role của user

#### Scenario: SUPER_ADMIN permissions
- **WHEN** SUPER_ADMIN gửi `GET /users/me/permissions`
- **THEN** response MUST chứa TẤT CẢ permissions (toàn quyền)
