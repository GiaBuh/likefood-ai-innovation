## Why

Giao diện admin panel hiện tại sử dụng design tokens cũ (`surface-light/dark`, `text-light/dark`), không consistent với main website đã được redesign theo hệ `neutral-*`. Sidebar basic, tables thiếu sort/filter mạnh, dark mode không đồng nhất. Cần redesign toàn bộ 14 components (~3,391 LOC) để tạo trải nghiệm quản trị premium, hiện đại.

## What Changes

- **Redesign AdminSidebar**: Gradient active state, smooth hover transitions, premium admin profile card, proper dark mode
- **Redesign KPICards**: Gradient backgrounds, trend sparklines, better icons, glass effect
- **Redesign Dashboard**: Premium revenue chart, top products cards, recent orders table
- **Redesign OrdersTable**: Sortable columns, status badge pills, row hover, responsive
- **Redesign ProductsTable**: Sortable, inline search, better product cards, responsive
- **Redesign CustomersTable**: Avatar improvements, sortable, responsive
- **Redesign Filters**: Modern filter bar, inline search, dropdown styling
- **Redesign AdminPanel layout**: Consistent neutral-* tokens, smooth page transitions
- **Redesign OrderDetailsModal**: Modern modal styling, better status flow
- **Redesign ProductModals**: Form inputs consistent with checkout redesign style
- **Dark mode migration**: Migrate ALL components from old tokens to neutral-* system
- **Responsive improvements**: Tables collapse to cards on mobile

## Capabilities

### New Capabilities
- `admin-ui-redesign`: Redesign toàn bộ giao diện admin panel với premium styling, consistent dark mode, responsive tables

### Modified Capabilities
_(Không có specs hiện tại cần thay đổi — đây thuần là UI redesign)_

## Impact

- **Frontend components**: Tất cả 14 files trong `frontend/components/admin/`
- **No backend changes**: Logic giữ nguyên
- **No API changes**: Endpoints giữ nguyên
- **Design tokens**: Migrate từ `surface-light/dark`, `text-light/dark`, `border-light/dark` → `neutral-*` system
