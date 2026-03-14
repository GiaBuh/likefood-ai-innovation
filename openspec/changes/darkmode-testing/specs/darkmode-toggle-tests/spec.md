# Dark Mode Toggle Tests

## Requirements
- Toggle button visible in Header (moon/sun icon)
- Clicking toggles `dark` class on `<html>` element
- Preference saved to localStorage key `theme`
- On page reload, dark mode restored from localStorage
- If no localStorage, honor OS `prefers-color-scheme: dark`

## Test Cases

| ID | Test | Expected |
|----|------|----------|
| T1 | Click toggle (light → dark) | Page turns dark, icon changes to sun |
| T2 | Click toggle (dark → light) | Page turns light, icon changes to moon |
| T3 | Check localStorage after toggle | `theme: "dark"` or `theme: "light"` |
| T4 | Reload page in dark mode | Dark mode persists |
| T5 | Clear localStorage + reload | Falls back to OS preference |
