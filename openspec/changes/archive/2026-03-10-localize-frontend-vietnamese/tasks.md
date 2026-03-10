## 1. Chatbot default to Vietnamese

- [x] 1.1 Ensure `askAiAssistant` is called with `preferredLanguage: "vi"` when `chatLanguage` is null or "vi" (in `useChatAi.ts` or wherever `askAiAssistant` is invoked).
- [x] 1.2 Verify `chatLanguage` default is "vi" and `t(vi, en)` returns Vietnamese when activeLang is "vi" (already present; confirm no regressions).

## 2. Layout (Header, Footer)

- [x] 2.1 Localize `Header.tsx`: nav links, cart label, login/register buttons, user menu items.
- [x] 2.2 Localize `Footer.tsx`: copyright, links, contact text.

## 3. Home

- [x] 3.1 Localize `Hero.tsx`: headline, subtitle, CTA button.
- [x] 3.2 Localize `Sidebar.tsx`: filter labels, category names, price range labels.
- [x] 3.3 Localize `MobileFilterModal.tsx`: titles, labels, buttons.
- [x] 3.4 Localize `HomePage.tsx`, `TrendSection.tsx`, `SocialMediaSection.tsx`: any visible strings.

## 4. Product

- [x] 4.1 Localize `ProductCard.tsx`: "Add to Cart", price labels, out-of-stock.
- [x] 4.2 Localize `ProductDetail.tsx`: labels, buttons, variant selector, quantity.
- [x] 4.3 Localize `ProductFilterBar.tsx`, `ProductPage.tsx`: filter labels, sort options.

## 5. Cart

- [x] 5.1 Localize `MobileCartModal.tsx`: title, empty cart message, buttons, labels.

## 6. Checkout

- [x] 6.1 Localize `CheckoutStepper.tsx`: step labels (Cart, Shipping, Payment, Review).
- [x] 6.2 Localize `ShippingForm.tsx`: field labels, placeholders, validation messages.
- [x] 6.3 Localize `Checkout.tsx`: section titles, buttons, notes.
- [x] 6.4 Localize `CartReview.tsx`, `RecommendationModal.tsx`: labels, buttons.
- [x] 6.5 Localize `OrderSuccess.tsx`: success message, CTA.

## 7. Orders

- [x] 7.1 Localize `OrderHistory.tsx`: empty state, status labels, buttons, column headers.

## 8. Chat (static UI only)

- [x] 8.1 Localize `ChatWidget.tsx`: menu titles, tab labels, placeholder text, button labels.
- [x] 8.2 Localize `ChatMenuView.tsx`: menu options, descriptions.
- [x] 8.3 Localize `ChatInput.tsx`: placeholder, submit button if any.
- [x] 8.4 Ensure all `useChatAi.ts` fallback/local messages use Vietnamese (review `t()` usage and any hardcoded English).

## 9. Auth

- [x] 9.1 Localize `AuthModal.tsx`: "Welcome Back", "Create Account", "Login with Email", field labels, validation errors, toggle link text.
- [x] 9.2 Localize `UserProfileModal.tsx`: "Edit Profile", "Save Changes", field labels.
- [x] 9.3 Localize `GoogleAuthCallbackPage.tsx`: loading/error messages.

## 10. Admin

- [x] 10.1 Localize `AdminSidebar.tsx`: menu items (Dashboard, Orders, Products, Customers, Chatting, Trends).
- [x] 10.2 Localize `AdminPanel.tsx`: header titles, subtitles, "Add Product", "Add Customer".
- [x] 10.3 Localize `Filters.tsx`: search placeholder, filter labels.
- [x] 10.4 Localize `Dashboard.tsx`, `KPICards.tsx`: KPI labels, status names.
- [x] 10.5 Localize `OrdersTable.tsx`, `OrderDetailsModal.tsx`: column headers, status options, buttons.
- [x] 10.6 Localize `ProductsTable.tsx`, `ProductModals.tsx`: headers, "Edit", "Delete", "Add Product", form labels.
- [x] 10.7 Localize `CustomersTable.tsx`: headers, empty state.
- [x] 10.8 Localize `AdminChatView.tsx`, `TrendHistoryView.tsx`, `NotFound.tsx`: visible strings.

## 11. Validation and shared utilities

- [x] 11.1 Localize `utils/validation.ts`: all error messages ("Address must not be blank", etc.) to Vietnamese.
- [x] 11.2 Localize any shared error messages in `authApi.ts`, `shopApi.ts` (e.g., "Register failed", "Failed to get AI response").

## 12. Verification

- [x] 12.1 Run `npm run build` in frontend; ensure no build errors.
- [x] 12.2 Manually verify: auth modal, checkout flow, admin panel, chat widget – all strings in Vietnamese.
