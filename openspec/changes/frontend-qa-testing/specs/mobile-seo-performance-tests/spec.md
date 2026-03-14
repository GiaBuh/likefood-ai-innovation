# Mobile, SEO, Error & Performance Tests

## Mobile Responsive Requirements
- All pages render correctly at 320px-767px
- Touch targets minimum 44x44px
- MobileBottomNav auto-hide/show on scroll
- Modals full-width on mobile

## SEO Requirements
- Each page has unique `<title>` and meta description
- Open Graph + Twitter card tags present
- Product detail has product-specific metadata
- `<html lang>` matches selected language

## Error Resilience Requirements
- Broken image URLs show placeholder
- ErrorBoundary displays fallback UI with retry
- 404 product shows not-found page

## Performance Requirements
- Production build succeeds without errors
- JS bundle < 200KB gzip, CSS < 20KB gzip
- Images lazy loaded (except hero)
- No console errors

## Test Cases

| ID | Test | Expected |
|----|------|----------|
| M1 | Mobile 375px layout | 2-column grid, no overflow |
| M2 | Mobile 320px layout | Content fits, no horizontal scroll |
| M3 | MobileBottomNav | Shows 5 tabs, auto-hide on scroll |
| M4 | Touch targets | All buttons ≥ 44x44px |
| M5 | Modal on mobile | Full-width display |
| S1 | Landing page title | Unique title in DOM |
| S2 | Shop page OG tags | og:title, og:description present |
| S3 | Product detail SEO | Product name in title |
| S4 | Lang attribute | Matches i18n language |
| E1 | Broken image | Placeholder shown |
| E2 | ErrorBoundary | Fallback UI + retry button |
| E3 | 404 product | Not-found page + back button |
| P1 | npm run build | Success, no errors |
| P2 | Bundle size | JS < 200KB gzip |
| P3 | Lazy loading | ProductCard images have loading=lazy |
| P4 | Console errors | None in devtools |
