## CHANGED Requirements

### Requirement: bestSeller di chuyển từ Product sang ProductVariant
bestSeller flag SHALL nằm ở ProductVariant level thay vì Product level.

#### Scenario: Toggle bestSeller per variant
- **GIVEN** ProductVariant A (size M) và ProductVariant B (size L)
- **WHEN** Admin toggle bestSeller trên variant B
- **THEN** chỉ variant B có bestSeller = true, variant A vẫn false

#### Scenario: Filter best seller variants
- **WHEN** GET /products?bestSeller=true
- **THEN** API trả products mà CÓ ÍT NHẤT 1 variant bestSeller=true

#### Scenario: Xóa Product.bestSeller
- **THEN** field bestSeller trên Product entity bị XÓA
