# i18n Language Tests

## Requirements

- Language switcher toggles between VI and EN instantly (no page reload)
- All 17+ customer-facing components update their text
- Language persists via localStorage (`i18nextLng` key)
- `<html lang>` attribute updates

## Test Cases

| ID | Test | Expected |
|----|------|----------|
| L1 | Click VI → EN toggle | All text switches to English |
| L2 | Click EN → VI toggle | All text switches to Vietnamese |
| L3 | Refresh page after switch | Language persists |
| L4 | Header text changes | Nav links, search placeholder |
| L5 | Footer text changes | Links, copyright, newsletter |
| L6 | Hero text changes | Title, subtitle, CTA |
| L7 | ProductCard text changes | US Shipping badge |
| L8 | ProductDetail text changes | Back, variants, add to cart, buy now |
| L9 | CheckoutStepper labels | Step 1/2/3 labels |
| L10 | CartReview text | Title, empty, total, checkout |
| L11 | ShippingForm labels | All form labels, buttons |
| L12 | OrderSuccess text | Title, message, buttons |
| L13 | AuthModal text | Login/register labels |
| L14 | UserProfileModal text | Field labels, buttons |
| L15 | ChatWidget text | Titles, descriptions, tooltip |
| L16 | MobileCartModal text | Title, empty, checkout |
| L17 | OrderHistory text | Statuses, buttons |
