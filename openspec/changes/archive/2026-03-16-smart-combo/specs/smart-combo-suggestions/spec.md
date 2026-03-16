## ADDED Requirements

### Requirement: Smart combo scoring and auto-suggestions
System SHALL tính score cho mỗi sản phẩm bằng công thức `stock ÷ (soldCount + 1)` và hiển thị ranked list sản phẩm cho admin.

#### Scenario: Score calculation
- **GIVEN** sản phẩm có stock=100, totalSoldCount=2
- **WHEN** scoring engine chạy
- **THEN** score = 100 ÷ (2 + 1) = 33.3, sản phẩm được rank cao

#### Scenario: Auto-select top products
- **WHEN** admin mở tab "Đề xuất thông minh"
- **THEN** top 3 sản phẩm có score cao nhất được auto-checked
- **AND** ghi chú "Nên chọn 2-3 sản phẩm" hiển thị

#### Scenario: Admin adjustment
- **WHEN** admin ở tab "Đề xuất thông minh"
- **THEN** admin có thể check/uncheck bất kỳ sản phẩm nào trước khi generate

### Requirement: Dual-tab combo generator
AiComboGenerator SHALL có 2 tabs: "Đề xuất thông minh" (scored auto-pick) và "Chọn thủ công" (checkbox list hiện tại).

#### Scenario: Tab switching
- **WHEN** admin switch giữa 2 tabs
- **THEN** selected items reset về default của tab đó
- **AND** tab "Đề xuất thông minh" auto-select top 3
- **AND** tab "Chọn thủ công" không auto-select

### Requirement: Items stored with combo
ComboCampaign entity SHALL lưu danh sách product names trong combo.

#### Scenario: Generate saves items
- **WHEN** admin generate combo với items ["Bún chả", "Phở Bò"]
- **THEN** ComboCampaign.items lưu JSON `["Bún chả", "Phở Bò"]`

### Requirement: AI-suggested discount based on inventory
Gemini AI SHALL nhận thông tin inventory ratio để suggest discount percentage phù hợp.

#### Scenario: High inventory ratio
- **GIVEN** selected products có average score > 20
- **WHEN** generate combo
- **THEN** AI suggest discount 20-30%

#### Scenario: Low inventory ratio
- **GIVEN** selected products có average score < 10
- **WHEN** generate combo
- **THEN** AI suggest discount 10-15%
