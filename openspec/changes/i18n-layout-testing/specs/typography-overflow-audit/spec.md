# Typography & Text Overflow Audit

## Typography Requirements
- Dấu tiếng Việt (ă, ê, ơ, ư, ả, ã, ấ, ề, ổ...) không bị cắt (clip) bởi line-height hoặc overflow:hidden
- Manrope font hỗ trợ đầy đủ Vietnamese characters (diacritics)
- Line-height tối thiểu 1.4 cho body text, 1.2 cho headings
- No text-overflow issues khi ngôn ngữ thay đổi

## Layout Overflow Requirements
- Buttons: text phải vừa trong button ở cả 2 ngôn ngữ, không tràn
- Nav links: không wrap xuống dòng, không gây header mở rộng
- Cards: tiêu đề sản phẩm truncate đúng (line-clamp), không tràn
- Form labels: không bị overflow, align đúng
- Modals: nội dung không bị cắt

## Test Cases

### Typography
| ID | Test | VI | EN | Check |
|----|------|-----|-----|-------|
| TY1 | Hero heading | Hương Vị Việt Nam Chính Gốc | Authentic Vietnamese Flavors | Dấu không bị cắt |
| TY2 | Body text | Đặc sản từ mọi vùng miền | Specialties from every region | Font renders ok |
| TY3 | Button text | Khám Phá Ngay | Explore Now | Text fits in button |
| TY4 | Nav links | Trang chủ / Cửa hàng / Giới thiệu / Tin tức | Home / Shop / About / Blog | Không wrap |
| TY5 | Small text | Quy trình bảo quản... | Quality assurance... | Readable at 12px |

### Layout Overflow
| ID | Test | Check |
|----|------|-------|
| OV1 | Header nav at 1024px | Nav links vừa 1 dòng |
| OV2 | CTA buttons on landing | Text vừa trong button |
| OV3 | ProductCard title | line-clamp works both langs |
| OV4 | CheckoutStepper labels | Step labels vừa |
| OV5 | AuthModal buttons | "Đăng nhập bằng Google" vs "Sign in with Google" vừa |
| OV6 | ShippingForm labels | Labels align correctly |
| OV7 | MobileBottomNav tabs | Tab labels vừa, icons align |
| OV8 | CartReview headers | "Giỏ hàng" vs "Cart" |
| OV9 | OrderSuccess buttons | "Về trang chủ" vs "Go Home" |
| OV10 | ChatWidget menu | Menu items vừa |
