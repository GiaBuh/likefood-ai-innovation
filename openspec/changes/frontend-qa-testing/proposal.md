## Why

The `frontend-redesign-modern` change has been fully implemented (94/94 tasks). Before deploying to production, a comprehensive QA testing pass is needed to verify all features work correctly, i18n is consistent, SEO metadata renders properly, responsive layout is solid, and no regressions exist in existing functionality (admin panel, cart/checkout, auth, chat).

## What Changes

- Create a structured test plan covering all 10 test areas of the redesigned frontend
- Execute manual and automated tests for routing, i18n, cart/checkout, auth, chat, mobile responsive, SEO, error resilience, design system, and performance
- Document test results and any bugs discovered
- Fix any critical bugs found during testing

## Capabilities

### New Capabilities
- `routing-navigation-tests`: Verify all page routes render correctly and navigation flows work
- `i18n-language-tests`: Verify VI/EN switching across all 17+ components, persistence via localStorage
- `cart-checkout-tests`: Verify full cart → checkout → order success flow with real data
- `auth-profile-tests`: Verify login/register forms, Google OAuth, profile editing, avatar upload
- `chat-widget-tests`: Verify ChatWidget menu, AI/Admin chat modes, login prompt
- `mobile-responsive-tests`: Verify layout on 320px-767px viewport, touch targets, bottom nav
- `seo-metadata-tests`: Verify title, meta, OG tags, lang attribute on all pages
- `error-resilience-tests`: Verify ErrorBoundary, image fallbacks, 404 handling
- `design-system-tests`: Verify brand colors, dark mode, hover effects, animations
- `performance-tests`: Verify build success, bundle size, lazy loading

### Modified Capabilities
_None — this is a testing-only change._

## Impact

- **Frontend**: All customer-facing pages and components
- **No code changes expected** unless bugs are discovered
- **Testing scope**: 10 test categories, ~50 individual test cases
