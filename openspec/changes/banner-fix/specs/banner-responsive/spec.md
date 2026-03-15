## ADDED Requirements

### Requirement: Banner ảnh vừa vặn carousel
Ảnh banner SHALL có kích thước panorama (1440×420) phù hợp với container carousel. Ảnh MUST hiển thị đầy đủ, không bị crop, letterbox, hoặc co giãn méo.

#### Scenario: Desktop 1440px
- **WHEN** user xem trang chủ trên desktop 1440px
- **THEN** banner SHALL hiển thị full-width, pixel-perfect, không khoảng trống

#### Scenario: Mobile responsive
- **WHEN** user xem trang chủ trên mobile
- **THEN** banner SHALL co lại theo width, giữ nguyên tỉ lệ, không bị méo
