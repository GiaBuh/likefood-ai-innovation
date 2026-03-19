
import React, { useEffect, useState, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ShopProvider, useShop } from './contexts/ShopContext';
import { FlyToCartProvider } from './contexts/FlyToCartContext';
import Layout from './components/layout/Layout';
import HomePage from './components/home/HomePage';
import ProductPage from './components/product/ProductPage';
import VnpayReturnPage from './components/checkout/VnpayReturnPage';
import UserProfileModal from './components/auth/UserProfileModal';
import AuthModal from './components/auth/AuthModal';
import GoogleAuthCallbackPage from './components/auth/GoogleAuthCallbackPage';
import NotFound from './components/admin/NotFound';
import LandingPage from './components/pages/LandingPage';
import VouchersPage from './components/pages/VouchersPage';
import { Product, Order } from './types';
import { ToastProvider, useToast } from './contexts/ToastContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ScrollToTop from './components/ui/ScrollToTop';
import { HelmetProvider } from 'react-helmet-async';

// Lazy-loaded pages for code splitting (reduces initial bundle size)
const AdminPanel = React.lazy(() => import('./components/admin/AdminPanel'));
const FlashSalePage = React.lazy(() => import('./components/pages/FlashSalePage'));
const ComboPage = React.lazy(() => import('./components/pages/ComboPage'));
const Checkout = React.lazy(() => import('./components/checkout/Checkout'));
const OrderHistory = React.lazy(() => import('./components/orders/OrderHistory'));

// Loading fallback for lazy-loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm text-neutral-500 dark:text-neutral-400">Đang tải...</span>
    </div>
  </div>
);

// Wrapper that uses routing and auth
const MainContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, loginWithGoogle, getGoogleLoginUrl, register, updateUser, isAuthenticated } = useAuth();
  const { showError } = useToast();
  const {
    products,
    orders,
    categories,
    productPagination,
    orderPagination,
    addToCart,
    updateProducts,
    submitOrder,
    retryVnpayPayment,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
    createProduct,
    importProductsFromCsv,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    cancelOrder,
    loadOrdersForRole,
    clearCart,
    clearOrders,
    loadCartForCurrentUser,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Open auth modal when redirected with ?auth=login
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('auth') === 'login') {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (!user) {
      clearCart();
      clearOrders();
      return;
    }
    Promise.all([
      loadOrdersForRole(user.role === 'admin'),
      loadCartForCurrentUser(),
    ]).catch((error) => {
      console.error('Cannot load user data from backend.', error);
    });
  }, [user, loadOrdersForRole, loadCartForCurrentUser, clearCart, clearOrders]);

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.slug || product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToShop = () => {
    navigate('/shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProductFromChat = (productId: string) => {
    // Try to find product by ID and navigate by slug
    const p = products.find((pr) => String(pr.id) === productId);
    if (p) {
      navigate(`/product/${p.slug || productId}`);
    } else {
      // If not in products, it must be a combo
      navigate(`/combo?id=${productId}`);
    }
  };

  const handleCheckoutStart = () => {
    if (!isAuthenticated) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    navigate('/checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToAdmin = () => navigate('/admin');
  const handleExitAdmin = () => navigate('/');

  const handleOpenLogin = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthMode('register');
    setIsAuthModalOpen(true);
  };

  const handlePlaceOrder = async (payload: {
    name: string;
    phone: string;
    address: string;
    note?: string;
    paymentMethod: 'COD' | 'BANK_TRANSFER';
    shopVoucherId?: string;
    shippingVoucherId?: string;
  }) => {
    if (!user) return { order: {} as any, paymentRequired: false };
    return await submitOrder({
      name: payload.name || user.name,
      phone: payload.phone || user.phone,
      address: payload.address || user.address,
      note: payload.note,
      paymentMethod: payload.paymentMethod,
      shopVoucherId: payload.shopVoucherId,
      shippingVoucherId: payload.shippingVoucherId,
    });
  };

  const handleBuyNow = (product: Product, quantity: number) => {
    if (!isAuthenticated) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    addToCart(product, quantity);
    navigate('/checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      // Map OrderItem fields to Product-compatible fields
      const productLike = {
        ...item,
        name: item.name || item.productName || 'Sản phẩm',
        image: item.image || item.productThumbnail || '',
        images: [],
        location: 'Viet Nam',
        category: '',
        categoryName: '',
        isUsShip: true,
        description: '',
        weight: item.variantLabel || 'Default',
        packaging: 'Standard Pack',
        variants: [],
        thumbnail: item.image || item.productThumbnail || '',
        status: 'Active' as const,
      };
      addToCart(productLike as any, item.quantity);
    });
    navigate('/checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCartAuth = (product: Product, qty: number) => {
    if (!isAuthenticated) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    addToCart(product, qty);
  };

  // Admin route - full screen, no Layout (RBAC: only admin role)
  if (location.pathname.startsWith('/admin')) {
    if (!user || user.role !== 'admin') {
      return <NotFound onGoHome={() => navigate('/')} />;
    }
    return (
      <>
        <AdminPanel
          onExit={handleExitAdmin}
          products={products}
          orders={orders}
          categories={categories}
          productPagination={productPagination}
          orderPagination={orderPagination}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onRefreshCategories={refreshCategories}
          onCreateProduct={createProduct}
          onImportProductsFromCsv={importProductsFromCsv}
          onUpdateProduct={updateProduct}
          onDeleteProduct={deleteProduct}
          onUpdateProducts={updateProducts}
          onUpdateOrderStatus={updateOrderStatus}
        />
      </>
    );
  }

  return (
    <Layout
      onCheckout={handleCheckoutStart}
      onGoToCheckout={handleCheckoutStart}
      onOpenProduct={handleOpenProductFromChat}
      onOpenProfile={() => setIsProfileModalOpen(true)}
      onViewOrders={() => navigate('/myorders')}
      onOpenLogin={handleOpenLogin}
      onOpenRegister={handleOpenRegister}
      onGoHome={handleBackToShop}
      onGoToAdmin={handleGoToAdmin}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
    >
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
        <Route
          path="/shop"
          element={
            <ErrorBoundary>
              <HomePage onProductClick={handleProductClick} searchQuery={searchQuery} />
            </ErrorBoundary>
          }
        />
        <Route path="/combo" element={<ErrorBoundary><ComboPage /></ErrorBoundary>} />
        <Route path="/about" element={<Navigate to="/combo" replace />} />
        <Route path="/flash-sale" element={<ErrorBoundary><FlashSalePage /></ErrorBoundary>} />
        <Route path="/vouchers" element={<ErrorBoundary><VouchersPage /></ErrorBoundary>} />
        <Route
          path="/product/:slug"
          element={
            <ErrorBoundary>
              <ProductPage
                onAddToCart={handleAddToCartAuth}
                onBuyNow={handleBuyNow}
              />
            </ErrorBoundary>
          }
        />
        <Route
          path="/checkout"
          element={
            <ErrorBoundary>
              {user ? (
                <Checkout
                  onBackToHome={handleBackToShop}
                  onPlaceOrder={handlePlaceOrder}
                  onViewOrders={() => navigate('/myorders')}
                />
              ) : (
                <HomePage onProductClick={handleProductClick} searchQuery={searchQuery} />
              )}
            </ErrorBoundary>
          }
        />
        <Route
          path="/auth/google/callback"
          element={
            <ErrorBoundary>
              <GoogleAuthCallbackPage
                onSuccess={() => {}}
                onError={(msg) => showError(msg)}
              />
            </ErrorBoundary>
          }
        />
        <Route
          path="/myorders"
          element={
            <ErrorBoundary>
              <OrderHistory
                orders={orders.filter((o) => o.customer.email === user?.email)}
                onBackToShop={handleBackToShop}
                onCancelOrder={async (orderId) => {
                  try {
                    await cancelOrder(orderId);
                  } catch (error) {
                    console.error('Cannot cancel order.', error);
                    showError(error instanceof Error ? error.message : 'Cannot cancel order at this status.');
                  }
                }}
                onTrackOrder={(id) => alert(`Tracking Order #${id}`)}
                onReorder={handleReorder}
                onRetryPayment={async (orderId) => {
                  try {
                    const paymentUrl = await retryVnpayPayment(orderId);
                    window.location.href = paymentUrl;
                  } catch (error) {
                    showError(error instanceof Error ? error.message : 'Không thể mở thanh toán VNPay.');
                  }
                }}
              />
            </ErrorBoundary>
          }
        />
        <Route
          path="/payment/vnpay/return"
          element={
            <ErrorBoundary>
              <VnpayReturnPage />
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>

      {user && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          onUpdateUser={updateUser}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        onLogin={login}
        onGoogleLoginUrl={getGoogleLoginUrl}
        onRegister={register}
      />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ToastProvider>
        <AuthProvider>
          <ShopProvider>
            <FlyToCartProvider>
              <MainContent />
            </FlyToCartProvider>
          </ShopProvider>
        </AuthProvider>
      </ToastProvider>
    </HelmetProvider>
  );
};

export default App;
