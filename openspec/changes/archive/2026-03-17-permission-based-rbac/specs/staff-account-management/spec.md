## ADDED Requirements

### Requirement: Admin create staff account
Admin (hoặc SUPER_ADMIN) SHALL có thể tạo tài khoản nhân viên qua API `POST /users/staff`. Body gồm: `email`, `username`, `password` (mật khẩu tạm), `roleId`. Tài khoản được tạo với `mustChangePassword = true`.

#### Scenario: Successfully create staff account
- **WHEN** admin gửi `POST /users/staff` với đầy đủ thông tin hợp lệ
- **THEN** hệ thống MUST tạo user mới với role đã chọn và `mustChangePassword = true`

#### Scenario: Create staff with non-admin role
- **WHEN** admin tạo staff account và chọn role USER (role dành cho khách hàng)
- **THEN** hệ thống MUST trả lỗi 400 "Cannot assign USER role to staff"

#### Scenario: Create staff with duplicate email
- **WHEN** admin tạo staff account với email đã tồn tại
- **THEN** hệ thống MUST trả lỗi 400 "Email already exists"

### Requirement: Must change password flag
Entity User SHALL có field `mustChangePassword` (boolean, default false). Khi admin tạo tài khoản nhân viên, flag này MUST được set thành `true`.

#### Scenario: User entity has mustChangePassword field
- **WHEN** user mới được admin tạo qua `POST /users/staff`
- **THEN** user record MUST có `mustChangePassword = true`

### Requirement: Force password change on first login
Khi user đăng nhập thành công và `mustChangePassword = true`, hệ thống SHALL trả thêm field `mustChangePassword: true` trong login response. User MUST đổi mật khẩu trước khi sử dụng hệ thống.

#### Scenario: First login with temporary password
- **WHEN** nhân viên đăng nhập với mật khẩu tạm (`mustChangePassword = true`)
- **THEN** login response MUST chứa `mustChangePassword: true`

#### Scenario: Login after password changed
- **WHEN** nhân viên đã đổi mật khẩu và đăng nhập lại
- **THEN** login response MUST chứa `mustChangePassword: false`

### Requirement: Change password API
API `PUT /auth/change-password` SHALL cho phép user đổi mật khẩu. Body gồm: `currentPassword`, `newPassword`. Sau khi đổi, `mustChangePassword` MUST được set thành `false`.

#### Scenario: Successfully change password
- **WHEN** user gửi `PUT /auth/change-password` với currentPassword đúng và newPassword hợp lệ
- **THEN** hệ thống MUST cập nhật mật khẩu và set `mustChangePassword = false`

#### Scenario: Wrong current password
- **WHEN** user gửi `PUT /auth/change-password` với currentPassword sai
- **THEN** hệ thống MUST trả lỗi 400 "Current password is incorrect"

#### Scenario: New password too short
- **WHEN** user gửi newPassword dưới 6 ký tự
- **THEN** hệ thống MUST trả lỗi 400 "Password must be at least 6 characters"
