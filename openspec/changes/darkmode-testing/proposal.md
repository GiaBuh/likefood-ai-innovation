## Why

Dark mode was recently added to the frontend via a toggle in the Header. A comprehensive dark mode test is needed to ensure all pages, components, modals, and interactive elements render correctly in dark mode — with proper contrast, no invisible text, no broken borders, and consistent brand colors.

## What Changes

- Test dark mode toggle functionality (activation, persistence, initialization)
- Audit all pages for dark mode rendering (backgrounds, text, borders, shadows)
- Verify all modals and overlays in dark mode
- Check interactive elements (hover states, focus states, active states)
- Validate dark mode on mobile viewports

## Capabilities

### New Capabilities
- `darkmode-toggle-tests`: Verify toggle, localStorage persistence, system preference, page reload
- `darkmode-page-audit`: Audit all pages for correct dark mode styling
- `darkmode-component-tests`: Verify modals, forms, cards, and interactive elements in dark mode
- `darkmode-mobile-tests`: Verify dark mode on mobile viewports and bottom nav

### Modified Capabilities
_None — testing only._

## Impact

- **Frontend**: All pages and components
- **No code changes** unless contrast/visibility bugs are found
