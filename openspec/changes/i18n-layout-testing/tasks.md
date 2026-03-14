## 1. Typography — Dấu Tiếng Việt

- [x] 1.1 Kiểm tra hero heading: dấu (ươ, ệ, ố) không bị cắt bởi line-height hoặc overflow:hidden
- [x] 1.2 Kiểm tra body text: dấu descender (ạ, ụ, ọ) và ascender (ấ, ể, ở) hiển thị đầy đủ
- [x] 1.3 Kiểm tra font Manrope hỗ trợ Vietnamese diacritics rendering chính xác
- [x] 1.4 Kiểm tra small text (10-12px): dấu tiếng Việt vẫn đọc được
- [x] 1.5 Switch sang EN → verify text renders bình thường (no fallback font)

## 2. Layout Overflow — Desktop

- [x] 2.1 Header nav links: switch VI → EN → verify nav links vừa 1 dòng, không wrap (cả ở 1024px)
- [x] 2.2 Landing hero CTA buttons: "Khám Phá Ngay →" vs "Explore Now →" vừa trong button
- [x] 2.3 Landing hero secondary button: "Câu Chuyện Của Chúng Tôi" vs "Our Story" — button không co giãn bất thường
- [x] 2.4 Feature cards: text "Đảm Bảo Chất Lượng" vs "Quality Assurance" — card height nhất quán
- [x] 2.5 ProductCard: tên sản phẩm truncate đúng ở cả 2 ngôn ngữ (line-clamp-2)
- [x] 2.6 Sidebar filter labels: "Danh mục" vs "Categories", "Khoảng giá" vs "Price Range"
- [x] 2.7 ProductFilterBar: filter buttons text vừa

## 3. Layout Overflow — Components

- [x] 3.1 CheckoutStepper: labels "Giỏ hàng / Giao hàng / Hoàn tất" vs "Cart / Shipping / Complete"
- [x] 3.2 CartReview: "Tổng cộng" vs "Total", "Thanh toán" vs "Checkout" — buttons fit
- [x] 3.3 ShippingForm: labels "Họ và tên" vs "Full Name", "Số điện thoại" vs "Phone" — align ok
- [x] 3.4 OrderSuccess: "Về trang chủ" vs "Go Home", "Xem đơn hàng" vs "View Orders"
- [x] 3.5 AuthModal: "Đăng nhập" vs "Login", "Đăng ký" vs "Register" — tabs fit
- [x] 3.6 AuthModal Google button: "Đăng nhập bằng Google" vs "Sign in with Google"
- [x] 3.7 UserProfileModal: form labels fit in both languages
- [x] 3.8 ChatWidget: menu items "Hỗ trợ Admin" vs "Admin Support" + "Trợ lý AI" vs "AI Assistant"
- [x] 3.9 MobileCartModal: "Giỏ hàng" vs "Cart" title, "Thanh toán" vs "Checkout" button
- [x] 3.10 OrderHistory: status badges text fit ("Đang xử lý" vs "Processing")

## 4. Layout Overflow — Mobile (375px)

- [x] 4.1 Header: "Đăng nhập" vs "Login" + "Đăng ký" vs "Register" buttons — vừa trong header
- [x] 4.2 MobileBottomNav: tab labels "Trang chủ/Cửa hàng/Giỏ hàng/Giới thiệu/Tin tức" vs "Home/Shop/Cart/About/Blog" — tất cả vừa
- [x] 4.3 Landing hero text: không gây horizontal scroll
- [x] 4.4 About page cards: text wraps properly, no overflow
- [x] 4.5 Blog article titles: truncate ở cả 2 ngôn ngữ

## 5. Side-by-Side Page Comparison

- [x] 5.1 Landing page: screenshot VI → switch EN → screenshot EN → so sánh layout
- [x] 5.2 Shop page: screenshot VI → switch EN → screenshot EN → so sánh
- [x] 5.3 About page: screenshot VI → switch EN → screenshot EN → so sánh
- [x] 5.4 Blog page: screenshot VI → switch EN → screenshot EN → so sánh
- [x] 5.5 Checkout page: screenshot VI → switch EN → screenshot EN → so sánh

## 6. Edge Cases

- [x] 6.1 Rapid toggle VI ↔ EN 5 lần liên tiếp — no crash, no layout jank
- [x] 6.2 Switch ngôn ngữ trong khi modal đang mở — modal text cập nhật
- [x] 6.3 Switch ngôn ngữ trên mobile — MobileBottomNav labels cập nhật
- [x] 6.4 Placeholder text in search input: "Tìm kiếm sản phẩm..." vs "Search products..."
- [x] 6.5 LanguageSwitcher hiển thị đúng: VI active khi tiếng Việt, EN active khi English
