# Cart, Checkout & Auth Tests

## Cart & Checkout Requirements
- Add products from ProductCard and ProductDetail
- Cart updates quantity, removes items
- Checkout 3-step flow completes successfully
- MobileCartModal displays correctly on mobile

## Auth & Profile Requirements
- Login/Register forms validate inputs
- Google OAuth button works
- Profile editing saves changes
- Avatar upload works

## Chat Widget Requirements
- FAB button opens chat menu
- Admin and AI chat modes work when logged in
- Login prompt shows when not authenticated

## Test Cases

| ID | Test | Expected |
|----|------|----------|
| C1 | Add product from card | Cart count increases |
| C2 | Add product from detail (variant) | Correct variant/price in cart |
| C3 | Cart quantity +/- | Updates total |
| C4 | Remove from cart | Item removed |
| C5 | Checkout step 1 → 2 | Shipping form shows |
| C6 | Shipping validation | Errors on empty fields |
| C7 | Place order | Success page |
| C8 | MobileCartModal | Opens on mobile, shows items |
| A1 | Login form | Validates email/password |
| A2 | Register form | Validates all fields |
| A3 | Google login | OAuth flow starts |
| A4 | Profile edit | Saves name/phone/address |
| A5 | Avatar upload | Preview updates |
| CH1 | FAB opens chat | Menu with 2 options |
| CH2 | Chat AI mode | AI responds to messages |
| CH3 | Chat unauthenticated | Login prompt shows |
