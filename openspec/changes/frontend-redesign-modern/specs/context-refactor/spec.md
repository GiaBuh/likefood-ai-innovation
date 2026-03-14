## ADDED Requirements

### Requirement: Services layer frozen
The files `services/shopApi.ts`, `services/apiClient.ts`, `services/authApi.ts`, and `services/chatWebSocket.ts` SHALL NOT be modified in any way. All 3 new contexts SHALL import and call the exact same service functions as the original ShopContext. Backend-frontend communication SHALL remain 100% unchanged.

#### Scenario: API calls unchanged after refactor
- **WHEN** CartContext calls `addItemToMyCart()`, ProductContext calls `fetchProductsWithQuery()`, or OrderContext calls `fetchOrdersWithQuery()`
- **THEN** the API request URL, method, headers, body, and response parsing SHALL be identical to the current ShopContext implementation

#### Scenario: Services files untouched
- **WHEN** a developer runs `git diff` on the services directory after the refactor
- **THEN** there SHALL be zero changes to any file in `frontend/services/`

### Requirement: CartContext separation
The system SHALL extract all cart-related state and functions from `ShopContext` into a dedicated `CartContext` provider, including: `cart`, `addToCart`, `removeFromCart`, `updateCartQuantity`, `clearCart`, `loadCartForCurrentUser`, `addToCartByVariantId`.

#### Scenario: Cart operations isolated
- **WHEN** a cart item is added or removed
- **THEN** only components consuming `CartContext` SHALL re-render; components using only `ProductContext` or `OrderContext` SHALL NOT re-render

### Requirement: ProductContext separation
The system SHALL extract all product-related state and functions from `ShopContext` into a dedicated `ProductContext` provider, including: `products`, `categories`, `productPagination`, `isLoadingProducts`, `updateProducts`, `createProduct`, `updateProduct`, `deleteProduct`, `importProductsFromCsv`, `addCategory`, `updateCategory`, `deleteCategory`, `refreshCategories`.

#### Scenario: Product state isolated
- **WHEN** product data is fetched or updated
- **THEN** only components consuming `ProductContext` SHALL re-render

### Requirement: OrderContext separation
The system SHALL extract all order-related state and functions from `ShopContext` into a dedicated `OrderContext` provider, including: `orders`, `orderPagination`, `submitOrder`, `updateOrderStatus`, `cancelOrder`, `loadOrdersForRole`, `clearOrders`.

#### Scenario: Order state isolated
- **WHEN** order status is updated
- **THEN** only components consuming `OrderContext` SHALL re-render

### Requirement: Backward-compatible re-export
The system SHALL provide a `useShop()` re-export hook in `contexts/ShopCompat.ts` that combines all three contexts for backward compatibility during migration.

#### Scenario: Existing components work unchanged
- **WHEN** a component still imports `useShop()` from the compat module
- **THEN** it SHALL receive the combined state from all three contexts and function correctly

### Requirement: Provider nesting order
The three new context providers SHALL be nested in order: `ProductProvider` → `CartProvider` → `OrderProvider`, all inside the existing `AuthProvider`.

#### Scenario: Provider tree
- **WHEN** the app renders
- **THEN** the provider tree SHALL be: `ToastProvider` → `AuthProvider` → `ProductProvider` → `CartProvider` → `OrderProvider` → `MainContent`
