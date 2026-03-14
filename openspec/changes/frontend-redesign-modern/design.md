## Context

LikeFood is a Vietnamese specialty food e-commerce platform targeting the US market. The current frontend is built with Vite + React 19 + TypeScript, using TailwindCSS via CDN `<script>` tag. The app has 44 TSX components across 10 groups (admin, auth, cart, chat, checkout, home, layout, orders, product, ui) with 3 React contexts (Auth, Shop, Toast), an API service layer, and WebSocket-based chat.

The current design uses a green primary color (#16a34a) with Manrope font and Material Symbols icons. While functional, the UI feels generic and lacks the premium branded experience expected from a specialty food company comparable to Mixue or Phúc Long.

**Key constraints:**
- Admin panel (14 TSX files) must remain untouched
- All existing features (AI TikTok Trend, Chat Widget, Cart/Checkout, Auth) must be preserved
- Backend API stays the same — this is a frontend-only redesign
- Must work with the existing React Router v7 setup

## Goals / Non-Goals

**Goals:**
- Deliver a premium, branded e-commerce experience inspired by Mixue/Phúc Long aesthetics
- Implement bilingual support (Vietnamese + English) with live language switching
- Add 3 new pages: Landing, About Us, Blog
- Migrate TailwindCSS from CDN to build-time for better performance and purging
- Establish a design system with consistent tokens (colors, typography, spacing)
- Significantly improve mobile responsiveness with bottom tab navigation
- Enhance product browsing with richer card designs and interactions

**Non-Goals:**
- Redesigning the admin panel
- Changing backend APIs or data models
- Adding payment gateway integration
- Building a mobile native app
- SEO server-side rendering (SSR) migration

## Decisions

### 1. TailwindCSS Build-Time Migration
**Decision:** Migrate from TailwindCSS CDN (`<script>` tag) to PostCSS + `tailwind.config.ts` build-time integration.
**Rationale:** CDN approach loads the full framework (~3MB), prevents tree-shaking, and doesn't support custom plugins. Build-time integration enables purging unused CSS, custom plugin support, and `@apply` directives.
**Alternative considered:** CSS Modules or styled-components — rejected to keep consistency and leverage existing TailwindCSS classes.

### 2. i18n Library
**Decision:** Use `react-i18next` with JSON translation files.
**Rationale:** Most popular React i18n library with excellent TypeScript support, lazy loading of namespaces, and React context integration. Mature ecosystem with browser language detection.
**Alternative considered:** `react-intl` — slightly heavier, ICU message format is overkill for this project's needs.

### 3. Animation Library
**Decision:** Use `framer-motion` for page transitions and micro-interactions.
**Rationale:** Best-in-class animation library for React, supports layout animations, gesture recognition, and scroll-triggered animations. Good for the premium feel required.
**Alternative considered:** CSS-only animations — insufficient for complex page transitions and gesture-based interactions needed for mobile.

### 4. Color Palette Evolution
**Decision:** Evolve from single green (#16a34a) to a warm, earthy palette with primary warm-orange/terracotta tones, keeping green as secondary accent. Inspired by Vietnamese cuisine aesthetics and Phúc Long's premium warmth.
**Rationale:** Warm tones connect better with food branding. Green alone feels too much like a tech/eco brand. Earthy warm tones evoke authenticity and appetite.

### 5. Component Architecture
**Decision:** Keep the existing flat component group structure (home/, product/, layout/, etc.) but add a shared `design-system/` directory for design tokens and primitive components.
**Rationale:** Minimal structural disruption while establishing a proper foundation for UI consistency.
**Alternative considered:** Atomic design (atoms/molecules/organisms) — too much restructuring for the scope of this change.

### 6. Blog Content Strategy
**Decision:** Blog content managed as static JSON/MD files initially, with API integration possible later.
**Rationale:** No backend changes allowed in this scope. Static content is sufficient for initial launch.

### 7. Routing Architecture
**Decision:** Add new routes via the existing React Router v7 setup: `/`, `/shop`, `/about`, `/blog`, `/blog/:slug`. The current home page moves to `/shop`, and a new landing page becomes `/`. A redirect from any old deep links to `/` will land on the landing page with easy navigation to `/shop`.
**Rationale:** Minimal routing changes, purely frontend — zero backend impact. No API endpoint depends on frontend routes.
**Backend impact:** NONE — backend APIs are path-independent (`/products`, `/orders`, `/carts/me`). Frontend routing is entirely client-side.

### 8. ShopContext Split
**Decision:** Refactor the monolithic `ShopContext.tsx` (18KB, ~500 lines) into 3 focused contexts: `CartContext`, `ProductContext`, `OrderContext`.
**Rationale:** The current ShopContext is a "God Context" containing all state (products, cart, orders, categories, pagination). Any state change triggers re-renders in ALL consuming components. Splitting reduces unnecessary re-renders and improves code maintainability.
**Backend impact:** NONE — this is purely an internal React state reorganization. All 3 new contexts will call the exact same `shopApi.ts` functions (`fetchProductsWithQuery`, `addItemToMyCart`, `fetchOrders`, etc.). The `services/shopApi.ts` and `services/apiClient.ts` files remain 100% untouched. Same API endpoints, same request/response format, same authentication flow.
**Alternative considered:** React `useMemo`/`useCallback` optimization within the single context — insufficient because the root cause is structural (too many concerns in one context).

### 9. SEO Metadata Strategy
**Decision:** Use `react-helmet-async` for dynamic `<title>`, `<meta>`, and Open Graph tags per route.
**Rationale:** Lightweight (~3KB), officially maintained fork of react-helmet, supports concurrent React. Each page component defines its own metadata via `<Helmet>` component.
**Alternative considered:** Manual `document.title` manipulation — doesn't handle meta tags, OG tags, or cleanup on route changes.

### 10. Error Resilience & Cleanup
**Decision:** (a) Add React Error Boundary wrapping each route to prevent full-app crashes. (b) Remove redundant ESM import map from `index.html`. (c) Add `loading="lazy"` to all `<img>` tags and implement progressive loading.
**Rationale:** (a) Currently a single component crash can white-screen the entire app. (b) The import map references `esm.sh` for React/Vite — these are already handled by Vite bundling and the import map is unused dead code. (c) Images are the heaviest assets; lazy loading reduces initial page load significantly.

## Risks / Trade-offs

- **[Risk] Large scope of visual changes** → Mitigate by implementing in phases: design system first, then page-by-page redesign
- **[Risk] TailwindCSS migration may break existing styles** → Mitigate by running visual regression testing on each page after migration
- **[Risk] i18n adds complexity to all components** → Mitigate by using a consistent `useTranslation` hook pattern and creating translation utilities
- **[Risk] framer-motion bundle size (~30KB gzipped)** → Acceptable trade-off for the premium animation quality needed
- **[Trade-off] Static blog content limits dynamic updates** → Accepted for v1; can add CMS integration later
- **[Trade-off] Bottom tab navigation on mobile reduces content viewport** → Use auto-hide on scroll down to minimize impact
- **[Risk] ShopContext split may break existing component imports** → Mitigate by providing backward-compatible `useShop()` re-export; zero backend impact since `services/` layer is untouched
- **[Risk] Removing import map may break something unexpected** → Low risk since Vite handles all bundling; verify `npm run dev` works after removal
- **[Guarantee] Backend-frontend communication unchanged** → `services/shopApi.ts`, `services/apiClient.ts`, `services/authApi.ts`, and `services/chatWebSocket.ts` are explicitly frozen — no modifications allowed in this redesign
