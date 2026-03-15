## ADDED Requirements

### Requirement: Tính soldCount từ completed orders
Backend SHALL tính số lượng đã bán cho mỗi ProductVariant từ bảng OrderItem.

#### Scenario: Query soldCount
- **GIVEN** có OrderItems với variant_id và order.status = COMPLETED
- **WHEN** API trả ProductResponse
- **THEN** mỗi variant có field `soldCount` = SUM(quantity) của completed orders

#### Scenario: Order chưa COMPLETED không tính
- **GIVEN** order.status = PENDING/CONFIRMED/SHIPPED/CANCELED
- **THEN** các OrderItems này KHÔNG tính vào soldCount

### Requirement: totalSoldCount trên Product
ProductResponse SHALL có `totalSoldCount` = tổng soldCount tất cả variants.
