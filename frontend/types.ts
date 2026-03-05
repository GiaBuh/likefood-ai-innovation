
export interface ProductVariant {
  weight: string;
  price: number;
  id: string; // unique identifier for the variant, e.g. "500g"
  sku?: string;
  weightValue?: number; // Added for admin edit
  weightUnit?: string; // Added for admin edit
  quantity?: number; // Stock quantity for admin
}

export type ProductStatus = 'Active' | 'Draft' | 'Archived';

export interface Product {
  id: number | string; // Allow string IDs for new products
  name: string;
  price: number;
  image: string; // Keep for backward compatibility/thumbnail
  images: string[]; // New: Array of images for gallery
  location?: string;
  category: string; // Legacy field
  categoryName?: string; // New field for Admin
  categoryId?: string; // New field for Admin
  isUsShip: boolean;
  description: string; // New: Full product description
  weight: string; // New: Product weight (e.g. "330g", "500g")
  packaging: string; // New: Packaging type (e.g. "Bag", "Box", "Jar" / "Bịch", "Hộp", "Hũ")
  variants: ProductVariant[]; // New: Array of weight/price variants
  thumbnail?: string; // Admin compat
  variantId?: string; // Selected variant id for cart syncing
  // Admin specific fields
  sku?: string;
  status: ProductStatus;
  stock?: number;
}

export interface CartItem extends Product {
  quantity: number;
  cartId: string; // Unique ID for cart management (combination of productID + variant)
  backendCartItemId?: string;
  maxQuantity?: number; // Max allowed from product variant stock
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export type SortOption = 'Best Selling' | 'Newest Arrivals' | 'Price: Low to High' | 'Price: High to Low';

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Refunded';
export type FulfillmentStatus = 'Processing' | 'Confirm' | 'Shipped' | 'Complete' | 'Cancelled';
export type CustomerStatus = 'Active' | 'Inactive' | 'Blocked';

export interface CustomerProfile {
  id: string;
  fullname: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  initials?: string;
  initialsBgColor?: string;
  initialsTextColor?: string;
  avatarUrl?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  status: CustomerStatus;
}

export interface Order {
  id: string;
  userId?: string; // Link to user
  customer: { // Admin view needs simple customer object or link
      id: string;
      fullname: string;
      email: string;
      avatarUrl?: string;
      initials?: string;
      initialsBgColor?: string;
      initialsTextColor?: string;
      phoneNumber?: string;
      address?: string;
  };
  date?: string; // Shop view legacy
  createdAt: string; // Admin view
  time?: string;
  status: OrderStatus | string; // Shop view legacy vs Admin view
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: any[]; // relaxed type for compat between Shop CartItem and Admin OrderItem
  total: number; // Shop legacy
  totalAmount: number; // Admin view
  shippingAddress: string;
}

export type OrderStatus = 'Processing' | 'Confirm' | 'Shipped' | 'Complete' | 'Cancelled';

export interface User {
  id?: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  address: string;
  role?: 'admin' | 'customer'; // New: Role based access
}

export interface KPIStats {
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down';
  icon: string;
  iconColorClass: string;
  iconBgClass: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
}
