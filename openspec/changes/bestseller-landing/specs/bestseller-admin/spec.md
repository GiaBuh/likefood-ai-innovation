## ADDED Requirements

### Requirement: Admin toggle Best Seller trên ProductsTable
Admin SHALL có thể toggle Best Seller cho sản phẩm trực tiếp trên bảng sản phẩm.

#### Scenario: Toggle Best Seller on
- **GIVEN** sản phẩm chưa được đánh dấu Best Seller
- **WHEN** Admin click icon ★ trên row sản phẩm
- **THEN** gửi PUT /products/{id} với bestSeller = true, icon đổi sang filled star màu vàng

#### Scenario: Toggle Best Seller off
- **GIVEN** sản phẩm đã được đánh dấu Best Seller
- **WHEN** Admin click icon ★ trên row sản phẩm
- **THEN** gửi PUT /products/{id} với bestSeller = false, icon đổi sang outline star

#### Scenario: Best Seller badge hiện trên table
- **GIVEN** sản phẩm có bestSeller = true
- **THEN** hiện badge "BS" hoặc icon ★ filled màu vàng bên cạnh Status
