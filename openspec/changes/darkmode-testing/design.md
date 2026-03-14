## Overview

Dark mode testing validates that every visible element on the site has proper dark: variant styling. The test approach uses browser-based manual testing with screenshots for comparison.

## Testing Approach

1. **Toggle Test**: Click dark mode button → verify `<html>` gets `dark` class
2. **Page Audit**: Navigate each page in dark mode, check backgrounds, text, borders
3. **Component Audit**: Open every modal/overlay in dark mode
4. **Contrast Check**: Ensure text is readable against dark backgrounds
5. **Persistence Test**: Reload page → verify dark mode persists
6. **System Preference**: Clear localStorage → verify OS preference honored

## Key Dark Mode Rules

- Background: `dark:bg-neutral-900` or `dark:bg-neutral-800`
- Text: `dark:text-white` or `dark:text-neutral-300`
- Borders: `dark:border-neutral-700` or `dark:border-neutral-800`
- Primary colors: stay the same (Terracotta `primary-500`)
- No white-on-white or dark-on-dark text
