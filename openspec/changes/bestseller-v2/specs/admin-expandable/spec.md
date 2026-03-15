## ADDED Requirements

### Requirement: Expandable product rows hiện variant details
ProductsTable SHALL hỗ trợ expand/collapse mỗi product row để hiện variant sub-rows.

#### Scenario: Thu gọn (mặc định)
- **THEN** mỗi product hiện 1 row: ▶ icon, tên, category, variant count, giá range, total sold, actions

#### Scenario: Mở rộng
- **WHEN** click ▶ icon
- **THEN** hiện sub-rows cho mỗi variant: variant label, giá, stock, soldCount, ★ BS toggle

#### Scenario: BS toggle per variant
- **WHEN** Admin click ★ trên variant sub-row
- **THEN** gửi PUT API cập nhật bestSeller cho variant đó
