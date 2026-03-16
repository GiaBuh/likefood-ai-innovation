## ADDED Requirements

### Requirement: Public combo listing page
Trang `/combo` SHALL hiển thị danh sách tất cả combo đang published, mỗi combo hiện banner image, tên, slogan, discount %, và danh sách sản phẩm.

#### Scenario: Page load
- **WHEN** khách hàng truy cập `/combo`
- **THEN** page gọi `GET /ai/combos/published` (public, no auth)
- **AND** hiển thị grid của combo cards
- **AND** mỗi card có: banner image, combo name, slogan, discount badge

#### Scenario: Empty state
- **WHEN** chưa có combo nào published
- **THEN** hiển thị empty state "Chưa có combo nào" với illustration

#### Scenario: Click combo card
- **WHEN** khách hàng click vào combo card
- **THEN** expand hoặc modal hiện chi tiết combo
- **AND** hiện danh sách sản phẩm trong combo (thumbnail, tên, giá)
- **AND** mỗi sản phẩm có nút "Thêm vào giỏ" hoặc link qua trang sản phẩm

### Requirement: Navigation update
Header navigation SHALL đổi "Giới thiệu" → "Combo" và route `/about` → `/combo`.

#### Scenario: Nav click
- **WHEN** user click "Combo" trên header
- **THEN** navigate to `/combo`

#### Scenario: Old route redirect
- **WHEN** user truy cập `/about`
- **THEN** redirect to `/combo`

### Requirement: Public API endpoint
Backend SHALL expose `GET /ai/combos/published` trả về list ComboCampaign có status=PUBLISHED.

#### Scenario: API response
- **WHEN** GET `/ai/combos/published`
- **THEN** response trả về list combos, mỗi combo có: id, comboName, slogan, description, discountPercentage, imageUrl, items, createdAt
- **AND** chỉ trả combo có status = "PUBLISHED"
- **AND** sort by createdAt descending (mới nhất trước)
