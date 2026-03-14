# Routing & Navigation Tests

## Requirements

- All page routes render without errors
- Navigation links work correctly from Header, Footer, MobileBottomNav
- Back/forward browser navigation works
- 404/not-found pages display fallback UI

## Test Cases

| ID | Test | Route | Expected |
|----|------|-------|----------|
| R1 | Landing page loads | `/` | Hero, brand values, featured products, testimonials |
| R2 | Shop page loads | `/shop` | Product grid, sidebar, hero banner |
| R3 | About page loads | `/about` | Mission, vision, story, contact |
| R4 | Blog page loads | `/blog` | Article cards, category filter |
| R5 | Product detail loads | `/product/:id` | Gallery, variants, add to cart, related products |
| R6 | Checkout loads | `/checkout` | Stepper, cart review |
| R7 | Admin loads | `/admin` | Admin panel unchanged |
| R8 | Header nav links | all | Click → correct page |
| R9 | Footer nav links | all | Click → correct page |
| R10 | MobileBottomNav tabs | all | Tap → correct page |
