## Why

Website LIKEFOOD hiện có responsive cơ bản nhưng chưa tối ưu cho tất cả breakpoints. Nhiều trang và component chưa hiển thị tốt trên mobile (< 640px) và tablet (640px-1024px). Với hơn 70% lượt truy cập từ mobile, cần audit toàn bộ và fix responsive cho trải nghiệm nhất quán trên mọi thiết bị.

## What Changes

- Audit và fix responsive cho tất cả trang: LandingPage, HomePage (Shop), AboutPage, BlogPage, ProductPage
- Fix responsive cho core layout components: Header, Footer, MobileBottomNav
- Tối ưu responsive cho product components: ProductCard, ProductDetail, ProductFilterBar, Sidebar
- Fix responsive cho checkout flow: CartReview, ShippingForm, Checkout
- Fix responsive cho modals: AuthModal, UserProfileModal, MobileCartModal
- Fix responsive cho admin panel (tablet+)
- Đảm bảo spacing, font-size, grid columns phù hợp từng breakpoint
- Fix overflow, text truncation, image sizing trên mobile

## Capabilities

### New Capabilities
- `responsive-pages`: Responsive layout cho tất cả public pages (Landing, Shop, About, Blog, Product)
- `responsive-components`: Responsive cho shared components (Header, Footer, Cards, Modals, Forms)
- `responsive-checkout`: Responsive cho checkout flow

### Modified Capabilities
_None_

## Impact

- **Frontend**: Cập nhật CSS/Tailwind classes cho ~30 component files
- **Layout**: Header, Footer, MobileBottomNav
- **Pages**: LandingPage, HomePage, AboutPage, BlogPage, ProductPage
- **Components**: ProductCard, ProductDetail, Sidebar, MobileFilterModal, AuthModal, CartReview, ShippingForm, etc.
- **No backend changes**
