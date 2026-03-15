## ADDED Requirements

### Requirement: Header responsive
Header SHALL hiển thị đúng trên mọi breakpoint.

#### Scenario: Mobile header
- **WHEN** viewport < 768px
- **THEN** logo nhỏ hơn, search bar ẩn (hiện icon search), nav links ẩn, hamburger menu hoặc bottom nav

#### Scenario: Desktop header
- **WHEN** viewport ≥ 1024px
- **THEN** full logo, search bar expanded, nav links visible, user menu

### Requirement: Footer responsive
Footer SHALL stack columns trên mobile.

#### Scenario: Footer mobile
- **WHEN** viewport < 640px
- **THEN** footer columns MUST stack vertical (1 column), text center-aligned

### Requirement: ProductCard responsive
ProductCard SHALL có kích thước phù hợp trên mỗi breakpoint.

#### Scenario: Card sizing
- **WHEN** trong grid 2-col (mobile)
- **THEN** card images MUST giữ aspect ratio, text MUST không bị overflow

### Requirement: Modals responsive
Tất cả modals (Auth, Cart, Profile) MUST hiển thị đúng trên mobile.

#### Scenario: Modal mobile fullscreen
- **WHEN** viewport < 640px
- **THEN** modals MUST full-width hoặc near-fullscreen, scrollable nếu nội dung dài

#### Scenario: Modal desktop centered
- **WHEN** viewport ≥ 768px
- **THEN** modals MUST centered, max-width phù hợp

### Requirement: MobileBottomNav visibility
MobileBottomNav MUST chỉ hiện trên mobile.

#### Scenario: Bottom nav mobile only
- **WHEN** viewport < 768px
- **THEN** MobileBottomNav MUST visible
- **WHEN** viewport ≥ 768px
- **THEN** MobileBottomNav MUST hidden
