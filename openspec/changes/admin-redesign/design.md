## Context

Admin panel gồm 14 components (~3,391 LOC). Component chính `AdminPanel.tsx` (651 LOC) quản lý 7 views: Dashboard, Orders, Products, Customers, Chat, Trends, AI Combo. 

Hiện tại dùng design tokens cũ (`surface-light/dark`, `text-light/dark`, `border-light/dark`, `background-light/dark`, `subtext-light/dark`) — không khớp với main site đã chuyển sang `neutral-*` system.

## Goals / Non-Goals

**Goals:**
- Redesign toàn bộ 14 admin components sang phong cách premium, hiện đại
- Migrate design tokens từ old system sang neutral-* (consistent với main site)
- Sidebar premium với gradient active states, smooth transitions
- Tables responsive với sortable columns, status badges, hover effects
- Dark mode consistent trên toàn bộ admin
- Giữ nguyên business logic, props interfaces, API calls

**Non-Goals:**
- Không thêm tính năng mới
- Không refactor AdminPanel.tsx thành smaller components (chỉ UI)
- Không thay đổi routing hay navigation flow
- Không thay đổi backend APIs
- Không redesign AdminChatView, TrendHistoryView, AiComboGenerator (giữ nguyên, chỉ migrate tokens)

## Decisions

### 1. Token migration strategy — find & replace
**Quyết định**: Dùng systematic find-replace cho token migration:
- `surface-light` → `white` / `neutral-50`, `surface-dark` → `neutral-900`
- `text-light` → `neutral-900`, `text-dark` → `white`
- `subtext-light` → `neutral-500`, `subtext-dark` → `neutral-400`
- `border-light` → `neutral-200`, `border-dark` → `neutral-700/800`
- `background-light` → `neutral-50/100`, `background-dark` → `neutral-800`
**Lý do**: Đảm bảo consistency, dễ review, ít risk breaking.

### 2. Chia thành 3 phases
**Quyết định**: 
- Phase 1: Core layout (Sidebar + AdminPanel + KPI + Filters) 
- Phase 2: Tables (Orders + Products + Customers + Dashboard)
- Phase 3: Modals + remaining (OrderDetails + ProductModals + token cleanup)
**Lý do**: Giảm rủi ro, dễ test từng phase.

### 3. Full UI redesign — không thêm dependencies
**Quyết định**: Dùng Tailwind CSS thuần, không thêm chart lib hay table lib.
**Lý do**: Bundle size nhẹ, consistent approach với phần còn lại.

## Risks / Trade-offs

- **[Risk]** 3,391 LOC thay đổi cùng lúc → **Mitigation**: Chia 3 phases, build test sau mỗi phase
- **[Risk]** Token migration miss một số chỗ → **Mitigation**: grep kiểm tra sau khi xong
- **[Risk]** AdminPanel.tsx 651 LOC khó edit → **Mitigation**: Chỉ thay CSS classes, không refactor logic
