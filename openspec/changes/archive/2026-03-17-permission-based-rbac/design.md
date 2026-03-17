## Context

LikeFood e-commerce hiện dùng RBAC đơn giản: 2 role `USER`/`ADMIN`, mỗi User gắn 1 Role (`@ManyToOne`). Backend check `hasRole("ADMIN")` trong `SecurityConfiguration`. Frontend check `user.role === 'admin'` để render admin panel.

Hạn chế: mọi nhân viên (ADMIN) đều có toàn quyền — không phân biệt được ai quản lý sản phẩm, ai xử lý đơn hàng. Cần nâng cấp lên Permission-based RBAC như các hệ thống e-commerce thực tế.

Stack hiện tại: Spring Boot 4.0 + Spring Security (`@EnableMethodSecurity`), React 19 + Vite, MySQL 8.0, Redis 7.

## Goals / Non-Goals

**Goals:**
- Hệ thống Permission chi tiết: mỗi resource (Products, Orders...) có các action riêng (VIEW, CREATE, EDIT, DELETE)
- Role ↔ Permission many-to-many: Admin tạo role tùy chỉnh, tick chọn permission
- SUPER_ADMIN role không thể xóa/sửa, tự động toàn quyền
- Admin tạo tài khoản nhân viên + bắt đổi mật khẩu lần đầu
- Frontend ẩn sidebar/nút theo permission hiện tại
- Backward compatible: user role USER không bị ảnh hưởng

**Non-Goals:**
- Invite link qua email (để phase sau)
- Permission cấp field-level (ví dụ: chỉ xem giá nhưng không xem chi phí)
- Audit log ghi lại ai làm gì
- Multi-tenancy / multi-shop

## Decisions

### 1. Permission model: Resource + Action (flat table)

**Chọn**: Bảng `permissions` chứa (`resource`, `action`) riêng biệt, bảng trung gian `role_permissions`.

**Lý do**: Đơn giản, dễ hiểu, dễ query. Mỗi permission là 1 cặp resource:action (VD: `PRODUCTS:CREATE`). Không cần hierarchy phức tạp.

**Thay vì**: Permission string dạng `"products:create"` lưu trực tiếp trong role — khó validate, dễ typo.

### 2. Permission seed data: cố định, không cho custom

**Chọn**: Danh sách permission seed sẵn trong database migration/init. Admin chỉ tạo Role và gán từ danh sách có sẵn — không tạo permission mới.

**Lý do**: Permission mapping với backend security endpoints. Nếu cho tạo tự do sẽ không mapping được. Khi thêm feature mới → dev thêm permission mới vào seed.

### 3. Security check: Custom `@PreAuthorize` expression

**Chọn**: Dùng `@PreAuthorize("hasPermission('PRODUCTS', 'CREATE')")` custom expression trên mỗi controller method, kết hợp `PermissionEvaluator` bean.

**Thay vì**: Check trong `SecurityFilterChain` (cứng) hoặc `@Secured` (chỉ role). Spring đã có sẵn `@EnableMethodSecurity` — chỉ cần thêm custom evaluator.

### 4. SUPER_ADMIN bypass: check trong code

**Chọn**: Nếu user có role `SUPER_ADMIN` → bypass mọi permission check. Không cần gán từng permission cho SUPER_ADMIN.

**Lý do**: Tránh phải update role_permissions mỗi khi thêm permission mới. SUPER_ADMIN luôn có toàn quyền by definition.

### 5. Login response trả permissions

**Chọn**: Khi login, response trả thêm `permissions: ["PRODUCTS:VIEW", "PRODUCTS:CREATE", ...]`. Frontend lưu vào AuthContext.

**Thay vì**: Gọi API riêng `GET /users/me/permissions` mỗi lần — tốn 1 round-trip không cần thiết.

### 6. Frontend permission guard: component + hook

**Chọn**: `usePermission()` hook + `<PermissionGuard resource="PRODUCTS" action="CREATE">` component. Sidebar filter dựa trên `VIEW` permission.

**Lý do**: Reusable, declarative. Dùng được ở cả sidebar lẫn trong page content.

### 7. Onboard flow: Admin tạo account, bắt đổi MK

**Chọn**: Admin nhập email + tên + mật khẩu tạm + chọn role → user field `mustChangePassword = true` → khi login, frontend hiện modal bắt đổi mật khẩu → sau khi đổi xong → vào admin panel bình thường.

**Thay vì**: Invite link qua email — phức tạp hơn, để phase sau.

## Risks / Trade-offs

- **Permission sync frontend/backend**: Frontend ẩn nút nhưng backend vẫn phải check. Nếu không đồng bộ → user thấy nút nhưng bấm bị 403, hoặc nút ẩn nhưng API vẫn cho qua. → **Mitigation**: Backend là source of truth, frontend chỉ là UX improvement. Mọi endpoint đều check permission.

- **Permission list cứng**: Khi thêm module mới (VD: Reviews, Combo) phải thêm permission seed thủ công. → **Mitigation**: Tạo migration script rõ ràng, convention đặt tên nhất quán.

- **Performance**: Mỗi request cần load permissions của user. → **Mitigation**: Permissions đã nằm trong JWT claims hoặc cached. Số lượng permission nhỏ (~30 records), query nhanh.

- **SUPER_ADMIN bypass**: Nếu bug trong bypass logic → SUPER_ADMIN mất quyền. → **Mitigation**: Unit test cho bypass logic. SUPER_ADMIN cũng có thể fallback bằng cách gán tất cả permissions.
