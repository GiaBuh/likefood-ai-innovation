# Page-by-Page i18n Comparison

## Requirements
- Mỗi trang phải được kiểm tra ở cả 2 ngôn ngữ (VI và EN)
- So sánh side-by-side: layout không bị vỡ khi switch
- Không có text bị cắt, tràn, hoặc mất dấu

## Test Cases

### Desktop (≥1024px)
| ID | Page | VI Screenshot | EN Screenshot | Check |
|----|------|---------------|---------------|-------|
| D1 | Landing hero | ✅ | ✅ | Heading + CTA buttons fit |
| D2 | Landing features | ✅ | ✅ | Card text không overflow |
| D3 | Shop sidebar | ✅ | ✅ | Filter labels align |
| D4 | Shop hero banner | ✅ | ✅ | Banner text readable |
| D5 | About mission/vision | ✅ | ✅ | Card text balanced |
| D6 | Blog article cards | ✅ | ✅ | Titles truncate properly |
| D7 | Checkout stepper | ✅ | ✅ | Step labels fit |

### Mobile (375px)
| ID | Page | VI | EN | Check |
|----|------|-----|-----|-------|
| M1 | Landing hero mobile | ✅ | ✅ | Text wraps, no overflow |
| M2 | MobileBottomNav | ✅ | ✅ | Tab labels fit |
| M3 | Header mobile | ✅ | ✅ | Login/Register buttons fit |
| M4 | AuthModal mobile | ✅ | ✅ | Full-width, labels fit |
| M5 | MobileCartModal | ✅ | ✅ | Item names wrap properly |
