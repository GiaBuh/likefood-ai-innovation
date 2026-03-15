## Context

LIKEFOOD là web app React + TypeScript + TailwindCSS v4 với Vite. Đã có responsive cơ bản (sm/md/lg prefixes) nhưng một số component chưa test kỹ trên tất cả breakpoints. Breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px).

## Goals / Non-Goals

**Goals:**
- Audit responsive cho tất cả public pages và major components
- Fix layout, spacing, font-size, grid columns cho mỗi breakpoint
- Đảm bảo không có horizontal overflow trên mobile
- Đảm bảo touch targets đủ lớn (44px minimum) trên mobile
- Đảm bảo modals, drawers, dropdowns hoạt động tốt trên mobile
- Tối ưu reading experience (line length, font size) cho mobile

**Non-Goals:**
- Không redesign lại giao diện — chỉ fix responsive issues
- Không thêm features mới
- Không refactor component structure
- Admin panel chỉ cần hỗ trợ tablet+ (≥ 768px)

## Decisions

### 1. Breakpoint Strategy
**Quyết định**: Mobile-first approach, Tailwind default breakpoints (sm:640, md:768, lg:1024, xl:1280)
**Lý do**: Consistent với Tailwind convention, dễ maintain.

### 2. Testing Approach
**Quyết định**: Test ở 3 viewport sizes: 375px (iPhone SE), 768px (iPad), 1440px (Desktop)
**Lý do**: Cover phổ biến nhất, phát hiện issues ở edge cases.

### 3. Scope Prioritization
**Quyết định**: Public pages first (Landing, Shop, Product) → Checkout → Admin
**Lý do**: User-facing pages ưu tiên cao nhất.

## Risks / Trade-offs

- **[Nhiều files cần sửa]** → Chia thành tasks nhỏ, test từng page
- **[Có thể break existing layout]** → Test ở cả 3 breakpoints sau mỗi change
- **[Admin panel limited]** → Chỉ support tablet+ là đủ cho admin workflow
