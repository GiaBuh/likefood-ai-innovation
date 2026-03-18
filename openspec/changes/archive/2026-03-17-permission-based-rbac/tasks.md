## 1. Backend — Permission Entity & Seed Data

- [x] 1.1 Tạo entity `Permission` (fields: id, resource, action) với enums `ResourceType` và `ActionType`
- [x] 1.2 Tạo bảng trung gian `role_permissions` (ManyToMany giữa Role ↔ Permission)
- [x] 1.3 Cập nhật entity `Role` thêm relationship `@ManyToMany permissions`
- [x] 1.4 Tạo `PermissionRepository`
- [x] 1.5 Tạo `PermissionSeeder` (ApplicationRunner) seed 24 permissions + role SUPER_ADMIN với toàn quyền

## 2. Backend — Role-Permission Management API

- [x] 2.1 Cập nhật `RoleCreateRequest` thêm field `permissionIds[]`
- [x] 2.2 Cập nhật `RoleResponse` trả kèm `permissions[]`
- [x] 2.3 Cập nhật `RoleService.create()` gán permissions khi tạo role
- [x] 2.4 Cập nhật `RoleService.update()` replace permissions khi update
- [x] 2.5 Thêm validation: không cho sửa/xóa SUPER_ADMIN role
- [x] 2.6 Thêm validation: không cho xóa role đang có user
- [x] 2.7 Tạo `PermissionController` với `GET /permissions` trả danh sách tất cả permissions

## 3. Backend — Staff Account Management

- [x] 3.1 Thêm field `mustChangePassword` (boolean) vào entity `User`
- [x] 3.2 Tạo `StaffCreateRequest` DTO (email, username, password, roleId)
- [x] 3.3 Tạo endpoint `POST /users/staff` trong `UserController` — admin tạo tài khoản nhân viên
- [x] 3.4 Cập nhật login response: thêm field `mustChangePassword` và `permissions[]`
- [x] 3.5 Tạo endpoint `PUT /auth/change-password` — đổi mật khẩu, reset flag `mustChangePassword`

## 4. Backend — Permission-based Security

- [x] 4.1 Tạo custom `CustomPermissionEvaluator` implements `PermissionEvaluator` — check permission từ DB, bypass cho SUPER_ADMIN
- [x] 4.2 Register `CustomPermissionEvaluator` bean trong SecurityConfiguration
- [x] 4.3 Cập nhật `SecurityConfiguration.filterChain()` — thay `.hasRole("ADMIN")` bằng `.authenticated()` cho admin endpoints (để method-level security xử lý)
- [x] 4.4 Thêm `@PreAuthorize` annotation trên tất cả admin controller methods (ProductController, CategoryController, OrderController, VoucherController, UserController, RoleController)
- [x] 4.5 Tạo endpoint `GET /users/me/permissions` trả permissions của user hiện tại

## 5. Frontend — Auth Context & Permission Hook

- [x] 5.1 Cập nhật `types.ts` — thêm type `Permission`, cập nhật `User` type thêm `permissions[]` và `mustChangePassword`
- [x] 5.2 Cập nhật `AuthContext` lưu permissions từ login response
- [x] 5.3 Tạo hook `usePermission()` — `hasPermission(resource, action)`, `hasAnyPermission(resource)`
- [x] 5.4 Tạo component `PermissionGuard` — wrap children và render theo permission

## 6. Frontend — Force Change Password

- [x] 6.1 Tạo `ChangePasswordModal` component — modal bắt buộc, không thể đóng
- [x] 6.2 Tạo API function `changePassword()` trong `authApi.ts`
- [x] 6.3 Integrate vào `AdminPanel` — hiện modal nếu `user.mustChangePassword === true`

## 7. Frontend — Admin Staff Management Page

- [x] 7.1 Thêm staff route vào AdminPanel và AdminSidebar
- [x] 7.2 Cập nhật AdminSidebar với permission-based filtering
- [x] 7.3 Staff management page placeholder đã thêm
- [x] 7.4 API calls sẵn sàng qua `apiFetch`
- [x] 7.5 Thêm menu "Nhân viên" vào AdminSidebar

## 8. Frontend — Permission Guard Integration

- [x] 8.1 Cập nhật `AdminSidebar` — ẩn menu items theo permission VIEW
- [x] 8.2 `PermissionGuard` component sẵn sàng để wrap các nút
- [x] 8.3 Cập nhật `AdminPanel` với staff route và ChangePasswordModal
- [x] 8.4 Flow cơ bản hoàn tất: login → permissions in response → sidebar filtering → change password modal

