# Cấu trúc thư mục frontend

Tài liệu mô tả cấu trúc thư mục dự án LikeFood frontend, giúp dễ tìm file và bảo trì.

## Routes (React Router)

| Path | Mô tả |
|------|-------|
| `/` | Trang chủ |
| `/product/:id` | Chi tiết sản phẩm |
| `/checkout` | Thanh toán (yêu cầu đăng nhập) |
| `/myorders` | Lịch sử đơn hàng (customer) |
| `/admin` | Panel admin (full screen) |

## Cấu trúc tổng quan

```
frontend/
├── App.tsx                 # Entry app, routing
├── index.tsx               # React DOM mount
├── index.html
├── types.ts                # Shared TypeScript types
├── constants.ts            # App constants
├── contexts/               # React context providers
│   ├── AuthContext.tsx
│   ├── ShopContext.tsx
│   └── ToastContext.tsx
├── services/               # API & data layer
│   ├── apiClient.ts
│   ├── authApi.ts
│   └── shopApi.ts
├── utils/                  # Shared utilities
│   └── validation.ts
└── components/             # UI components nhóm theo feature
    ├── layout/             # Header, Footer, Layout
    ├── home/               # Trang chủ & bộ lọc
    ├── product/            # Chi tiết sản phẩm, thẻ SP, filter bar
    ├── cart/               # Modal giỏ hàng mobile
    ├── checkout/           # Thanh toán, stepper, form giao hàng
    ├── orders/             # Lịch sử đơn hàng
    ├── chat/               # Chat widget (AI & admin)
    ├── auth/               # Đăng nhập, đăng ký, profile modal
    ├── admin/              # Panel admin (dashboard, tables, modals)
    └── ui/                 # UI nguyên tố (Skeleton, etc.)
```

## Mô tả từng thư mục

| Thư mục   | Mô tả |
|-----------|-------|
| **layout** | Layout chính, Header, Footer - dùng trên toàn site |
| **home**  | HomePage, Hero, Sidebar filter, MobileFilterModal |
| **product** | ProductDetail, ProductCard, ProductCardSkeleton, ProductFilterBar |
| **cart**  | MobileCartModal - giỏ hàng cho mobile |
| **checkout** | Checkout (container), CartReview, ShippingForm, CheckoutStepper, OrderSuccess |
| **orders** | OrderHistory - lịch sử đơn hàng khách |
| **chat**  | ChatWidget - chat AI + chat admin |
| **auth**  | AuthModal (login/register), UserProfileModal |
| **admin** | AdminPanel, AdminSidebar, Dashboard, KPICards, Filters, OrdersTable, ProductsTable, CustomersTable, ProductModals, OrderDetailsModal |
| **ui**    | Skeleton, các component dùng chung |

## Quy tắc import

- Từ thư mục root (`frontend/`): `./types`, `./contexts/...`, `./services/...`
- Trong cùng thư mục: `./ComponentName`
- Từ component con lên root: `../../types`, `../../contexts/...`
- Giữa các thư mục cùng cấp: `../cart/MobileCartModal`, `../product/ProductCard`

## Khi thêm component mới

1. **Layout/navigation**: đặt trong `layout/`
2. **Trang/feature mới**: tạo thư mục mới (vd: `reviews/`) hoặc dùng thư mục sẵn có
3. **Modal/dialog**: đặt gần feature liên quan (auth modal → `auth/`, order modal → `admin/` hoặc `orders/`)
4. **Component tái sử dụng**: đặt trong `ui/`
