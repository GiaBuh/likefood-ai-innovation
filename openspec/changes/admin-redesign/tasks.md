## Phase 1: Core Layout (Sidebar + KPI + Filters + AdminPanel)

- [x] 1.1 Redesign AdminSidebar: gradient active state, left-border accent, smooth hover transitions, premium admin profile card, dark mode neutral-*
- [x] 1.2 Redesign KPICards: gradient accent line top, large bold values, colored trend indicators, subtle icon bg
- [x] 1.3 Redesign Filters: modern search input with icon, dropdown filters styling, consistent spacing
- [x] 1.4 AdminPanel layout: migrate tokens surface-light/dark → neutral-*, smooth page transitions between views
- [x] 1.5 Build test Phase 1

## Phase 2: Tables + Dashboard

- [x] 2.1 Redesign Dashboard: premium revenue chart (gradient bars), top products cards, recent orders table with status badges
- [x] 2.2 Redesign OrdersTable: sortable columns, status badge pills, row hover highlight, responsive
- [x] 2.3 Redesign ProductsTable: sortable columns, better product display, inline actions, responsive
- [x] 2.4 Redesign CustomersTable: avatar improvements, sortable, responsive layout
- [x] 2.5 Build test Phase 2

## Phase 3: Modals + Cleanup

- [x] 3.1 Redesign OrderDetailsModal: modern modal styling, backdrop blur, status flow visualization
- [x] 3.2 Redesign ProductModals (CategoryManagement + ProductForm): modern form inputs, consistent styling
- [x] 3.3 Token migration cleanup: grep verify zero old tokens remain in admin/
- [x] 3.4 AdminChatView token migration (tokens only, keep layout)
- [x] 3.5 TrendHistoryView token migration (tokens only, keep layout)
- [x] 3.6 AiComboGenerator token migration (tokens only, keep layout)
- [x] 3.7 NotFound page token migration
- [x] 3.8 Build test Phase 3

## Phase 4: Verification

- [x] 4.1 Full build verification (make build)
- [ ] 4.2 Browser test: Dashboard view
- [ ] 4.3 Browser test: Orders + Products tables
- [ ] 4.4 Dark mode test full admin
- [ ] 4.5 Mobile responsive test (375px)
