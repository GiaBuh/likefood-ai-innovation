## ADDED Requirements

### Requirement: Admin Sidebar premium redesign
AdminSidebar SHALL có gradient active state cho menu item active, smooth hover transitions, và admin profile card ở bottom với avatar + role label.

#### Scenario: Active menu item
- **WHEN** user đang ở view "Dashboard"
- **THEN** menu item Dashboard có gradient background from-primary-500/10, left border primary-500 3px, icon và text primary-500

#### Scenario: Hover effect
- **WHEN** user hover vào menu item inactive
- **THEN** menu item có background neutral-100 dark:neutral-800, smooth 200ms transition

#### Scenario: Dark mode sidebar
- **WHEN** dark mode active
- **THEN** sidebar background neutral-900, border neutral-800, text neutral-200

### Requirement: KPI Cards gradient premium
KPICards SHALL hiển thị với gradient colored accent line ở trên, large bold value, trend indicator, và subtle icon background.

#### Scenario: KPI card display
- **WHEN** dashboard loads
- **THEN** mỗi KPI card có top accent line (gradient primary cho revenue, green cho orders, blue cho products, purple cho customers), value text-3xl font-black, trend arrow color-coded

#### Scenario: Loading state
- **WHEN** data đang load
- **THEN** KPI cards hiện skeleton với shimmer animation

### Requirement: Tables sortable và responsive
OrdersTable, ProductsTable, và CustomersTable SHALL có sortable column headers, status badges pills, hover row highlight, và collapse to cards trên mobile (<768px).

#### Scenario: Column sort
- **WHEN** user click vào column header
- **THEN** table sort theo column đó, arrow indicator hiển thị sort direction

#### Scenario: Mobile responsive
- **WHEN** viewport < 768px
- **THEN** table data hiển thị dạng cards thay vì table rows

#### Scenario: Row hover
- **WHEN** user hover vào table row
- **THEN** row có background neutral-50 dark:neutral-800/50 transition

### Requirement: Dashboard premium layout
Dashboard SHALL có revenue chart với gradient bars, top products list với product image cards, recent orders table với status badges.

#### Scenario: Revenue chart
- **WHEN** dashboard hiển thị
- **THEN** bar chart có gradient fill bars (primary-400 → primary-600), rounded tops, hover tooltip

#### Scenario: Empty states
- **WHEN** không có data
- **THEN** hiện empty state icon + helpful message thay vì blank space

### Requirement: Consistent dark mode tokens
Tất cả admin components SHALL sử dụng neutral-* token system thay vì old tokens (surface-light/dark, text-light/dark, etc).

#### Scenario: Token migration
- **WHEN** admin panel render trong dark mode
- **THEN** backgrounds sử dụng neutral-800/900, text sử dụng white/neutral-200, borders neutral-700

#### Scenario: No old tokens remain
- **WHEN** grep cho `surface-light|text-light|border-light|background-light|subtext-light` trong admin components
- **THEN** kết quả trả về 0 matches

### Requirement: Filters modern design
Filters component SHALL có rounded search input với icon, dropdown filters với modern styling, consistent spacing.

#### Scenario: Search input
- **WHEN** user focus vào search input trong admin
- **THEN** input có focus ring primary-500/30, border primary-400

#### Scenario: Filter dropdowns
- **WHEN** user mở filter dropdown
- **THEN** dropdown có rounded corners, shadow, neutral-50 dark:neutral-800 background

### Requirement: Modal redesign
OrderDetailsModal và ProductModals SHALL có modern styling consistent với main site checkout form style.

#### Scenario: Modal open
- **WHEN** user mở modal
- **THEN** modal có backdrop blur, rounded-2xl corners, shadow-2xl, smooth scale-in animation

#### Scenario: Form inputs in modals
- **WHEN** modal chứa form inputs
- **THEN** inputs có rounded-xl, focus ring gradient, icon indicators (consistent với checkout redesign)
