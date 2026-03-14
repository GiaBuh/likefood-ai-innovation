## 1. Design System Foundation

- [x] 1.1 Install TailwindCSS, PostCSS, and autoprefixer as build-time dependencies; create `tailwind.config.ts` and `postcss.config.js`
- [x] 1.2 Remove TailwindCSS CDN `<script>` tag and inline config from `index.html`; add `@tailwind` directives to a new `src/index.css`
- [x] 1.3 Create design tokens file (`frontend/design-tokens.ts`) with brand color palette (primary terracotta #D4631D, secondary green #2D6A4F, accent gold #E9B949), typography scale, spacing, shadows, and animation presets
- [x] 1.4 Integrate design tokens into `tailwind.config.ts` theme extend section
- [x] 1.5 Create component variant utilities: Button variants (primary, secondary, outline, ghost), Card variants (product, testimonial, blog), Badge variants (category, status, tag)
- [x] 1.6 Update `index.html` body classes and font imports for the new brand palette
- [x] 1.7 Verify Vite dev server and build work correctly with new TailwindCSS setup

## 2. Internationalization (i18n)

- [x] 2.1 Install `react-i18next`, `i18next`, and `i18next-browser-languagedetector` dependencies
- [x] 2.2 Create i18n configuration file (`frontend/i18n.ts`) with language detection, fallback, and namespace setup
- [x] 2.3 Create translation files: `frontend/locales/vi.json` and `frontend/locales/en.json` with namespaces (common, home, product, checkout, orders, auth)
- [x] 2.4 Create `LanguageSwitcher` component with VI/EN toggle for the header
- [x] 2.5 Wrap App in `I18nextProvider` and integrate `useTranslation` hook into all customer-facing components
- [x] 2.6 Translate all hardcoded Vietnamese strings in: Header, Footer, Hero, ProductCard, ProductDetail, Checkout, OrderHistory, ChatWidget, AuthModal, UserProfileModal, Sidebar, ProductFilterBar
- [x] 2.7 Verify language switching works live without page reload and persists via localStorage

## 3. Layout & Navigation Redesign

- [x] 3.1 Redesign `Header.tsx` with new brand colors, improved search bar styling, mega-menu/dropdown category navigation, and LanguageSwitcher integration
- [x] 3.2 Redesign `Footer.tsx` with new brand palette, updated section layout, and newsletter form styling
- [x] 3.3 Create `MobileBottomNav.tsx` component with 5 tabs (Home, Shop, Cart, Orders, Profile) and active tab indicator
- [x] 3.4 Implement auto-hide on scroll down / show on scroll up behavior for MobileBottomNav
- [x] 3.5 Add cart badge count to MobileBottomNav Cart tab
- [x] 3.6 Update `Layout.tsx` to include MobileBottomNav (visible only < 768px) and adjust main content padding
- [x] 3.7 Ensure desktop header navigation remains unchanged and bottom nav hides on >= 768px

## 4. Landing Page

- [x] 4.1 Create `LandingPage.tsx` with animated hero section (framer-motion fade-in + slide-up), brand tagline, and CTA button
- [x] 4.2 Create featured products carousel component with horizontal scroll and product cards
- [x] 4.3 Create brand values section with 3-4 value cards (authentic food, quality assurance, fast shipping)
- [x] 4.4 Create customer testimonials section with review cards (avatar, name, rating, text)
- [x] 4.5 Update routing: Landing page at `/`, move current shop/home to `/shop`
- [x] 4.6 Add navigation links to Landing page from header and footer
- [x] 4.7 Install `framer-motion` and implement page transition animations

## 5. About Us Page

- [x] 5.1 Create `AboutPage.tsx` with hero banner and page layout
- [x] 5.2 Create company story section with two-column layout (image + text), responsive stacking on mobile
- [x] 5.3 Create mission/vision cards section
- [x] 5.4 Create team/founder section with member cards (photo, name, role, bio)
- [x] 5.5 Create contact & location info section at page bottom
- [x] 5.6 Add route `/about` in App.tsx and navigation links

## 6. Blog Page

- [x] 6.1 Create blog data file (`frontend/data/blog-articles.json`) with sample articles (slug, title, category, date, author, excerpt, coverImage, content)
- [x] 6.2 Create `BlogListPage.tsx` with article card grid, category filter tabs, and pagination
- [x] 6.3 Create `BlogDetailPage.tsx` with full article rendering, cover image, metadata, and markdown/HTML content display
- [x] 6.4 Create related articles section at bottom of BlogDetailPage
- [x] 6.5 Add routes `/blog` and `/blog/:slug` in App.tsx and navigation links

## 7. Home/Shop Page Redesign

- [x] 7.1 Redesign `Hero.tsx` with new brand colors, animated carousel/slider with multiple slides, and updated CTA styling
- [x] 7.2 Redesign `ProductCard.tsx` with new visual style: rounded images, hover scale + overlay, quick-view icon, category badge, warm color palette
- [x] 7.3 Create `QuickViewModal.tsx` for product quick preview (image, name, description, variant selector, add to cart)
- [x] 7.4 Redesign `Sidebar.tsx` with updated filter UI matching new design system
- [x] 7.5 Create horizontal scrollable category navigation bar for the shop page
- [x] 7.6 Redesign `ProductFilterBar.tsx` with updated sort/filter controls
- [x] 7.7 Redesign `TrendSection.tsx` with new brand colors and improved card styling
- [x] 7.8 Redesign `SocialMediaSection.tsx` with updated visual treatment

## 8. Product Detail Page Redesign

- [x] 8.1 Redesign product detail gallery with thumbnail navigation, zoom-on-hover, and mobile swipe support
- [x] 8.2 Update product info section with new typography, variant selector styling, and CTA buttons matching design system
- [x] 8.3 Create "You may also like" related products section with horizontal scrollable row
- [x] 8.4 Improve mobile layout of product detail page

## 9. Checkout & Orders Redesign

- [x] 9.1 Redesign `CheckoutStepper.tsx` with new brand colors and improved step indicator design
- [x] 9.2 Redesign `CartReview.tsx` with updated card styling and improved item display
- [x] 9.3 Redesign `ShippingForm.tsx` with improved form inputs, labels, and validation styling
- [x] 9.4 Redesign `OrderSuccess.tsx` with celebration animation and updated visuals
- [x] 9.5 Redesign `OrderHistory.tsx` with improved order cards and status badges
- [x] 9.6 Redesign `MobileCartModal.tsx` with new styling

## 10. Auth & Chat Redesign

- [x] 10.1 Redesign `AuthModal.tsx` (login/register forms) with new brand colors, improved form styling, and social login button
- [x] 10.2 Redesign `UserProfileModal.tsx` with updated layout and styling
- [x] 10.3 Redesign `ChatWidget.tsx` exterior (FAB button, chat window frame) with new brand colors
- [x] 10.4 Update chat message bubbles and menu view styling to match design system

## 11. Mobile Responsiveness Polish

- [x] 11.1 Audit and fix all pages for mobile responsiveness (320px - 767px viewport)
- [x] 11.2 Ensure all touch targets are minimum 44x44px on mobile
- [x] 11.3 Test and fix mobile filter modal, mobile cart modal, and all modals for proper mobile display
- [x] 11.4 Verify bottom tab navigation works correctly with all routes
- [x] 11.5 Test swipe gestures on product gallery and carousels on mobile

## 12. Context Refactor (ShopContext Split)

- [x] 12.1 Create `CartContext.tsx` by extracting cart state and functions (`cart`, `addToCart`, `removeFromCart`, `updateCartQuantity`, `clearCart`, `loadCartForCurrentUser`, `addToCartByVariantId`) from `ShopContext.tsx`
- [x] 12.2 Create `ProductContext.tsx` by extracting product state and functions (`products`, `categories`, `productPagination`, `isLoadingProducts`, `updateProducts`, `createProduct`, `updateProduct`, `deleteProduct`, `importProductsFromCsv`, `addCategory`, `updateCategory`, `deleteCategory`, `refreshCategories`)
- [x] 12.3 Create `OrderContext.tsx` by extracting order state and functions (`orders`, `orderPagination`, `submitOrder`, `updateOrderStatus`, `cancelOrder`, `loadOrdersForRole`, `clearOrders`)
- [x] 12.4 Create `ShopCompat.ts` with backward-compatible `useShop()` hook re-exporting combined context for migration
- [x] 12.5 Update `App.tsx` provider tree: `ToastProvider` → `AuthProvider` → `ProductProvider` → `CartProvider` → `OrderProvider`
- [x] 12.6 Migrate all consuming components to use specific context hooks (`useCart`, `useProducts`, `useOrders`) instead of `useShop`
- [x] 12.7 Remove the old `ShopContext.tsx` after all migrations are verified

## 13. SEO Metadata

- [x] 13.1 Install `react-helmet-async` dependency
- [x] 13.2 Wrap `<App>` in `<HelmetProvider>` in `index.tsx`
- [x] 13.3 Add `<Helmet>` with dynamic title and meta description to Landing page, Shop page, About page, Blog pages
- [x] 13.4 Add Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`) to all main pages
- [x] 13.5 Add `<Helmet>` to Product detail page with product-specific title, description, and OG image
- [x] 13.6 Verify social share preview for key pages using Facebook/Twitter debugger URLs

## 14. Error Resilience & Cleanup

- [x] 14.1 Remove the `<script type="importmap">` block from `index.html`; verify app still works with `npm run dev` and `npm run build`
- [x] 14.2 Create `ErrorBoundary.tsx` component with friendly fallback UI (error message + retry button) and console error logging
- [x] 14.3 Wrap each route in `App.tsx` with `<ErrorBoundary>` to isolate page-level crashes
- [x] 14.4 Add `loading="lazy"` to all product `<img>` tags in ProductCard, ProductDetail, cart items, and search results
- [x] 14.5 Ensure hero section and above-fold images do NOT have `loading="lazy"` (LCP optimization)
- [x] 14.6 Add image error fallback handler (`onError`) to all product images to show a branded placeholder on broken URLs
- [x] 14.7 Verify Error Boundary catches and recovers from a simulated component crash

## 15. Final Integration & Testing

- [x] 15.1 Verify all existing features work correctly: AI TikTok Trend, Chat Widget (AI + Admin), Cart/Checkout flow, Auth (Google + Email), Order management
- [x] 15.2 Verify admin panel is completely unchanged and functional
- [x] 15.3 Run `npm run build` and verify production bundle builds successfully with optimized CSS
- [x] 15.4 Test i18n language switching across all pages
- [x] 15.5 Cross-browser testing (Chrome, Firefox, Safari) for both desktop and mobile
- [x] 15.6 Verify SEO metadata renders correctly on all pages (check `<title>`, `<meta>` tags in DOM)
- [x] 15.7 Verify context refactor: no unnecessary re-renders when cart/product/order state changes independently
- [x] 15.8 Verify Error Boundary fallback UI appears on simulated errors and does not crash the entire app
