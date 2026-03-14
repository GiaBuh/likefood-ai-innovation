# Dark Mode Page & Component Audit

## Page Audit Requirements
Each page must have:
- Dark background (neutral-900/950)
- Light text (white or neutral-200/300)
- Visible borders (neutral-700/800)
- Readable card content
- Proper image contrast

## Component Audit Requirements
- All modals: dark overlay + dark background
- Forms: dark inputs with visible placeholder text
- Buttons: proper contrast in dark mode
- Cards: dark border, visible shadow or none
- MobileBottomNav: dark background, visible icons

## Test Cases

| ID | Test | Expected |
|----|------|----------|
| P1 | Landing page in dark mode | Dark hero, readable text, visible sections |
| P2 | Shop page in dark mode | Dark sidebar, readable product cards |
| P3 | About page in dark mode | Dark sections, readable mission/vision |
| P4 | Blog page in dark mode | Dark article cards, readable text |
| P5 | Product detail in dark mode | Dark gallery area, readable info |
| P6 | Checkout in dark mode | Dark stepper, readable form |
| C1 | AuthModal in dark mode | Dark overlay, dark form bg, visible inputs |
| C2 | UserProfileModal in dark mode | Dark bg, readable labels |
| C3 | ChatWidget in dark mode | Dark chat area, readable messages |
| C4 | MobileCartModal in dark mode | Dark bg, readable items |
| C5 | Header in dark mode | Dark bg, visible nav links |
| C6 | Footer in dark mode | Dark bg, visible links |
| C7 | MobileBottomNav in dark mode | Dark bg, visible tab icons |
| C8 | Sidebar filters in dark mode | Dark bg, readable filter options |
| C9 | Hover states in dark mode | Visible hover effects on cards, buttons |
| C10 | Focus states in dark mode | Visible focus ring on inputs |
