## 1. Toggle Functionality

- [x] 1.1 Click dark mode toggle (moon icon in Header) → verify page switches to dark mode
- [x] 1.2 Click again (sun icon) → verify page returns to light mode
- [x] 1.3 Check `localStorage.getItem('theme')` → verify value is `"dark"` or `"light"`
- [x] 1.4 Reload page while in dark mode → verify dark mode persists
- [x] 1.5 Clear localStorage `theme` key → reload → verify falls back to OS preference

## 2. Page Audit — Dark Mode

- [x] 2.1 Landing page (`/`): dark hero bg, white text, visible brand values cards, visible CTA buttons
- [x] 2.2 Shop page (`/shop`): dark sidebar bg, dark product cards, readable prices & names
- [x] 2.3 About page (`/about`): dark sections, readable mission/vision text
- [x] 2.4 Blog page (`/blog`): dark article cards, readable titles and dates
- [x] 2.5 Product detail (`/product/:id`): dark gallery area, readable product info, visible variant buttons
- [x] 2.6 Checkout (`/checkout`): dark stepper, dark form inputs, readable labels

## 3. Component Audit — Dark Mode

- [x] 3.1 Header: dark bg, visible logo, readable nav links, visible search input, dark mode icon correct
- [x] 3.2 Footer: dark bg, visible section titles, readable links
- [x] 3.3 MobileBottomNav: dark bg, visible tab icons and labels
- [x] 3.4 AuthModal: dark overlay, dark form background, visible input borders, readable labels
- [x] 3.5 UserProfileModal: dark bg, visible form fields, readable button text
- [x] 3.6 ChatWidget: dark chat panel bg, readable messages, dark menu items
- [x] 3.7 MobileCartModal: dark bg, readable item names/prices, visible remove button
- [x] 3.8 OrderHistory: dark bg, readable order cards, visible status badges
- [x] 3.9 Sidebar filters: dark bg, visible checkboxes, readable category/price labels

## 4. Interactive States — Dark Mode

- [x] 4.1 ProductCard hover: visible hover effect (scale, shadow, or overlay)
- [x] 4.2 Button hover: visible color change on primary buttons
- [x] 4.3 Input focus: visible focus ring on form inputs
- [x] 4.4 Link hover: visible color change on navigation links
- [x] 4.5 Cart dropdown hover: visible hover on cart items

## 5. Contrast & Readability

- [x] 5.1 No white text on white background anywhere
- [x] 5.2 No dark text on dark background anywhere
- [x] 5.3 Primary color (Terracotta) still visible against dark backgrounds
- [x] 5.4 Secondary color (Forest Green) badges still readable
- [x] 5.5 Error messages (red) still visible in dark mode
- [x] 5.6 Success messages (green) still visible in dark mode

## 6. Mobile Dark Mode

- [x] 6.1 Set viewport to 375px → verify dark mode renders correctly
- [x] 6.2 MobileBottomNav dark bg with visible icons
- [x] 6.3 Mobile search overlay dark bg
- [x] 6.4 All mobile modals (cart, auth) have dark bg
