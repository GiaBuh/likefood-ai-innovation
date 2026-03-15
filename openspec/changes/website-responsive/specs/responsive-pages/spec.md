## ADDED Requirements

### Requirement: LandingPage responsive layout
LandingPage SHALL hiển thị đúng trên mobile (375px), tablet (768px) và desktop (1440px).

#### Scenario: Hero section responsive
- **WHEN** viewport < 640px
- **THEN** Hero text MUST có font-size nhỏ hơn, button full-width, padding giảm

#### Scenario: CategoryGrid responsive
- **WHEN** viewport < 640px
- **THEN** grid MUST hiển thị 3 columns, icon nhỏ hơn

#### Scenario: FlashSale responsive
- **WHEN** viewport < 640px
- **THEN** countdown timer MUST thu nhỏ, product cards MUST 140px width

#### Scenario: Brand Values responsive
- **WHEN** viewport < 640px
- **THEN** grid MUST chuyển sang 1 column, spacing giảm

### Requirement: HomePage (Shop) responsive layout
HomePage SHALL hiển thị sản phẩm grid phù hợp mỗi breakpoint.

#### Scenario: Product grid responsive
- **WHEN** viewport < 640px
- **THEN** product grid MUST 2 columns, sidebar MUST ẩn (dùng MobileFilterModal)

#### Scenario: Sidebar behavior
- **WHEN** viewport < 1024px
- **THEN** sidebar MUST ẩn, hiện filter button để mở MobileFilterModal

### Requirement: ProductPage responsive
ProductPage SHALL hiển thị product detail phù hợp trên mobile.

#### Scenario: Product detail mobile layout
- **WHEN** viewport < 768px
- **THEN** image gallery và product info MUST stack vertical (1 column)

#### Scenario: Product detail desktop layout
- **WHEN** viewport ≥ 1024px
- **THEN** image gallery bên trái, product info bên phải (2 columns)

### Requirement: AboutPage responsive
AboutPage SHALL responsive với content readability tốt trên mobile.

#### Scenario: About sections stack on mobile
- **WHEN** viewport < 640px
- **THEN** mission/vision/story sections MUST stack vertical, font-size giảm

### Requirement: BlogPage responsive
BlogPage SHALL responsive với blog cards grid phù hợp.

#### Scenario: Blog grid responsive
- **WHEN** viewport < 640px
- **THEN** blog cards MUST 1 column, full-width
