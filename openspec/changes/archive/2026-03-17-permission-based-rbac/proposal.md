## Why

Hệ thống LikeFood hiện chỉ có 2 role cứng (USER/ADMIN) với toàn quyền hoặc không có quyền gì. Trong thực tế e-commerce, cần phân quyền chi tiết cho nhân viên — ai được xem trang nào, thêm/sửa/xóa gì — thay vì cho tất cả nhân viên toàn quyền ADMIN. Cần bổ sung hệ thống Permission-based RBAC để Super Admin tạo role tùy chỉnh, gán quyền chi tiết, và onboard nhân viên mới chuyên nghiệp (tạo tài khoản + bắt đổi mật khẩu lần đầu).

## What Changes

- Thêm entity `Permission` (resource + action) và bảng trung gian `role_permissions` (many-to-many giữa Role ↔ Permission)
- Thêm field `mustChangePassword` vào User entity để bắt đổi mật khẩu lần đầu đăng nhập
- Seed danh sách Permission cố định (DASHBOARD:VIEW, PRODUCTS:VIEW/CREATE/EDIT/DELETE, CATEGORIES:*, ORDERS:VIEW/EDIT, CUSTOMERS:VIEW/EDIT, VOUCHERS:*, CHAT:VIEW, STAFF:*)
- Tạo role `SUPER_ADMIN` không thể xóa/sửa, tự động có toàn quyền
- Backend API: CRUD role + gán permissions, tạo tài khoản nhân viên (admin-created), API lấy permission của user hiện tại
- Backend security: check permission trên từng endpoint thay vì chỉ check role
- Frontend Admin Panel: trang quản lý nhân viên (Staff Management) với UI checkbox ma trận gán quyền
- Frontend Admin Panel: ẩn sidebar menu item + ẩn nút (Thêm/Sửa/Xóa) theo permission của user đang đăng nhập
- Frontend: flow bắt đổi mật khẩu lần đầu đăng nhập

## Capabilities

### New Capabilities
- `permission-entity`: Entity Permission, bảng role_permissions, seed data permissions cố định
- `role-permission-management`: API CRUD role với gán/bỏ permissions, bảo vệ SUPER_ADMIN role
- `staff-account-management`: API tạo tài khoản nhân viên (admin tạo), field mustChangePassword, flow đổi mật khẩu lần đầu
- `permission-based-security`: Backend security check permission trên endpoint thay vì chỉ check role ADMIN
- `admin-staff-ui`: Frontend trang quản lý nhân viên + UI gán quyền (checkbox matrix)
- `admin-permission-guard`: Frontend ẩn sidebar/nút theo permission user hiện tại, PermissionGuard component

### Modified Capabilities
_(none — existing specs are not affected at the requirement level)_

## Impact

- **Backend**: `user` module (User entity, Role entity, new Permission entity), `common/config/SecurityConfiguration.java`, `auth` module (login response cần trả permissions, thêm flow change password)
- **Database**: 1 bảng mới (`permissions`), 1 bảng trung gian mới (`role_permissions`), thêm cột `must_change_password` vào `users`
- **Frontend**: `components/admin/` (AdminPanel, AdminSidebar cần conditional render), thêm trang StaffManagement, thêm PermissionGuard component, update AuthContext để lưu permissions
- **API contracts**: Login response thêm field `permissions[]`, thêm endpoint `GET /users/me/permissions`, thêm endpoint `POST /users/staff` (admin tạo NV)
- **Breaking changes**: Không có — hệ thống cũ vẫn hoạt động, chỉ thêm layer permission mới
