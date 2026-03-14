## 1. Setup & Build Verification

- [x] 1.1 Run `npm run dev` and verify dev server starts successfully on port 5173
- [x] 1.2 Run `npm run build` and verify production build completes without errors
- [x] 1.3 Verify JS bundle < 200KB gzip, CSS < 20KB gzip
- [x] 1.4 Open browser devtools console and verify no errors on page load

## 2. Routing & Navigation

- [x] 2.1 Navigate to `/` — verify Landing page renders (hero, brand values, products, testimonials)
- [x] 2.2 Navigate to `/shop` — verify Shop page renders (product grid, sidebar, hero)
- [x] 2.3 Navigate to `/about` — verify About page renders (mission, vision, story, contact)
- [x] 2.4 Navigate to `/blog` — verify Blog page renders (article cards, category filter)
- [x] 2.5 Click a product → verify `/product/:id` renders (gallery, variants, related products)
- [x] 2.6 Navigate to `/checkout` — verify 3-step stepper renders
- [x] 2.7 Navigate to `/admin` — verify admin panel loads unchanged
- [x] 2.8 Test Header nav links → each goes to correct page
- [x] 2.9 Test Footer nav links → each goes to correct page
- [x] 2.10 Test browser back/forward buttons work correctly

## 3. i18n Language Switching

- [x] 3.1 Click LanguageSwitcher (VI → EN) — verify all visible text changes to English
- [x] 3.2 Click LanguageSwitcher (EN → VI) — verify all visible text changes to Vietnamese
- [x] 3.3 Refresh page after switch — verify language persists (check localStorage `i18nextLng`)
- [x] 3.4 Verify Header text updates (nav links, search placeholder)
- [x] 3.5 Verify Footer text updates (links, copyright, newsletter)
- [x] 3.6 Verify Hero section text updates (title, subtitle, CTA)
- [x] 3.7 Verify ProductCard US Shipping badge updates
- [x] 3.8 Verify ProductDetail updates (back, variants, add to cart, buy now)
- [x] 3.9 Verify CheckoutStepper step labels update
- [x] 3.10 Verify CartReview text updates (title, empty, total, checkout)
- [x] 3.11 Verify ShippingForm labels update
- [x] 3.12 Verify OrderSuccess text updates
- [x] 3.13 Verify AuthModal login/register labels update
- [x] 3.14 Verify UserProfileModal field labels update
- [x] 3.15 Verify ChatWidget + ChatMenuView titles update
- [x] 3.16 Verify MobileCartModal text updates
- [x] 3.17 Verify OrderHistory statuses and buttons update

## 4. Cart & Checkout Flow

- [x] 4.1 Click "Add to Cart" from ProductCard — verify cart count increases in header
- [x] 4.2 Add product from ProductDetail: select variant, set quantity > 1, add to cart
- [x] 4.3 Open cart/checkout — verify items display with correct name, variant, price
- [x] 4.4 Update quantity +/- in CartReview — verify total updates
- [x] 4.5 Remove item from cart — verify item disappears
- [x] 4.6 Click "Checkout" → verify AI recommendation modal appears
- [x] 4.7 Continue to step 2 → verify ShippingForm renders with labels
- [x] 4.8 Submit empty form → verify validation error messages appear
- [x] 4.9 Fill form and place order → verify OrderSuccess page with confetti/checkmark
- [x] 4.10 Click "View Orders" → verify navigates to order history

## 5. Auth & Profile

- [x] 5.1 Click Login → verify AuthModal opens with login form
- [x] 5.2 Switch to Register → verify registration form displays
- [x] 5.3 Submit empty login form → verify validation errors
- [x] 5.4 Login with valid credentials → verify Header shows avatar + name
- [x] 5.5 Click Google Login button → verify OAuth flow starts
- [x] 5.6 Open UserProfileModal → verify profile info displays
- [x] 5.7 Edit name, phone, address → click Save → verify success toast
- [x] 5.8 Upload avatar → verify preview updates
- [x] 5.9 Logout → verify Header returns to guest state

## 6. Chat Widget

- [x] 6.1 Verify FAB button (chat_bubble icon) visible at bottom-right
- [x] 6.2 Hover FAB → verify tooltip "Support 👋" appears
- [x] 6.3 Click FAB → verify chat panel opens with menu (Admin, AI options)
- [x] 6.4 Select "Admin Support" without login → verify login prompt
- [x] 6.5 Login and select "Admin Support" → verify chat input available
- [x] 6.6 Send message in admin chat → verify message appears
- [x] 6.7 Select "AI Assistant" → verify AI responds to messages
- [x] 6.8 Click back arrow → returns to menu

## 7. Mobile Responsive (320px - 767px)

- [x] 7.1 Set Chrome DevTools to 375px width — verify 2-column product grid
- [x] 7.2 Set to 320px width — verify no horizontal scroll, content fits
- [x] 7.3 Verify MobileBottomNav shows 5 tabs (Home, Shop, Cart, Orders, Profile)
- [x] 7.4 Scroll down → verify MobileBottomNav hides; scroll up → shows
- [x] 7.5 Tap each MobileBottomNav tab → verify correct page loads
- [x] 7.6 Open MobileCartModal → verify full-width, items display
- [x] 7.7 Open AuthModal on mobile → verify full-width modal
- [x] 7.8 Verify all buttons/links ≥ 44x44px touch target size
- [x] 7.9 Test product gallery thumbnail scroll on mobile

## 8. SEO Metadata

- [x] 8.1 Landing page: inspect `<title>` → verify unique title
- [x] 8.2 Shop page: inspect `<meta name="description">` → verify present
- [x] 8.3 About page: inspect OG tags (`og:title`, `og:description`) → verify present
- [x] 8.4 Blog page: inspect Twitter card tags → verify present
- [x] 8.5 Product detail: verify `<title>` contains product name
- [x] 8.6 Switch language → verify `<html lang="en">` or `<html lang="vi">`

## 9. Error Resilience

- [x] 9.1 Manually break an image URL in devtools → verify placeholder shows (not broken icon)
- [x] 9.2 Navigate to `/product/nonexistent-id` → verify "Not found" page with back button
- [x] 9.3 Verify ErrorBoundary exists in route wrapping (code inspection)
- [x] 9.4 Verify no console errors during normal navigation flow

## 10. Design System & Visual

- [x] 10.1 Verify primary color (Terracotta) on buttons, links, accents
- [x] 10.2 Verify secondary color (Forest Green) on badges, shipping tags
- [x] 10.3 Toggle dark mode → verify all pages adapt correctly
- [x] 10.4 Verify hover effects on ProductCard (image scale, quick-view button)
- [x] 10.5 Verify page transition animations (fade-in on route change)
- [x] 10.6 Verify typography consistency across pages
