## Why

The current LikeFood frontend was built rapidly with TailwindCSS CDN and inline styles, resulting in a functional but visually basic e-commerce experience. The UI lacks the premium, branded feel expected for a specialty food company (comparable to Mixue or Phúc Long). Key gaps include: no landing page, no about/blog pages, no internationalization (i18n), and inconsistent mobile responsiveness. A full frontend redesign will elevate the brand identity, improve user engagement, and support bilingual audiences (Vietnamese + English).

## What Changes

- **Complete visual overhaul** of all customer-facing pages (Home, Product Detail, Checkout, Orders, Auth) with a modern e-commerce design inspired by Mixue/Phúc Long branding style
- **New pages**: Landing page (brand storytelling), About Us page, Blog/News page
- **Internationalization (i18n)**: Support switching between Vietnamese and English across all customer-facing UI
- **Enhanced Hero section**: Animated carousel/slider with seasonal promotions and brand storytelling
- **Redesigned product cards**: Richer visuals with hover animations, quick-view, rating placeholders
- **Improved navigation**: Mega menu or category-based navigation, sticky header enhancements
- **Better mobile experience**: Bottom navigation bar, swipe gestures, mobile-optimized checkout flow
- **Design system**: Establish a proper color palette, typography scale, spacing tokens, and component library aligned with the brand identity
- **TailwindCSS migration**: Move from CDN `<script>` tag to proper build-time TailwindCSS with `tailwind.config.ts`
- **Keep admin panel unchanged**: No modifications to admin components
- **Keep all existing features**: AI TikTok Trend, Chat Widget, Cart/Checkout, Auth (Google + Email) — only improve their visual presentation
- **Cleanup index.html**: Remove redundant ESM import map (`esm.sh` references) that conflicts with Vite bundling
- **Split ShopContext**: Refactor the monolithic `ShopContext.tsx` (18KB) into separate `CartContext`, `ProductContext`, and `OrderContext` for better performance and maintainability
- **SEO metadata**: Add dynamic page titles, meta descriptions, and Open Graph tags per route using `react-helmet-async`
- **Image lazy loading**: Add `loading="lazy"` to all product images and implement progressive image loading for better performance
- **Error Boundary**: Add React Error Boundary components to catch and gracefully handle component crashes

## Capabilities

### New Capabilities
- `i18n-system`: Bilingual support (Vietnamese/English) with language switcher component, translation files, and context-based locale management
- `landing-page`: Brand storytelling landing page with animated hero, featured products carousel, customer testimonials, and brand values section
- `about-page`: About Us page with company story, team section, mission/vision, and brand heritage content
- `blog-page`: Blog/News page with article listing, category filters, and individual article detail view
- `design-system`: Unified design tokens (colors, typography, spacing, shadows, animations), component variants, and brand-consistent styling across the entire frontend
- `mobile-navigation`: Bottom tab navigation bar for mobile, swipe-friendly interactions, and mobile-optimized layouts
- `enhanced-product-browsing`: Redesigned product cards with hover effects, quick-view modal, improved gallery, and better category navigation
- `seo-metadata`: Dynamic SEO metadata per route (title, description, OG tags) using react-helmet-async
- `context-refactor`: Split monolithic ShopContext into CartContext, ProductContext, and OrderContext for performance optimization
- `error-resilience`: Error Boundary components, image lazy loading, and cleanup of redundant import map in index.html

### Modified Capabilities
- None (existing specs are AI chat-related and remain unchanged)

## Impact

- **Frontend components**: All 44 TSX files in customer-facing groups (home, product, checkout, orders, auth, cart, chat, layout, ui) will be visually redesigned
- **index.html**: TailwindCSS CDN script replaced with build-time integration
- **New files**: i18n translation files (vi.json, en.json), new page components (Landing, About, Blog), design system tokens
- **package.json**: New dependencies — `tailwindcss` (build-time), i18n library (e.g., `react-i18next`), possible animation library (e.g., `framer-motion`)
- **Routing**: New routes for /about, /blog, /blog/:slug, landing page integration
- **Context architecture**: ShopContext.tsx split into 3 separate context files
- **index.html cleanup**: Import map block removed, react-helmet-async added for SEO
- **package.json**: Additional dependency `react-helmet-async`
- **No backend changes**: All changes are frontend-only
- **Admin panel**: Explicitly excluded from this redesign scope
