
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ShopProvider, useShop } from './contexts/ShopContext';
import Layout from './components/layout/Layout';
import HomePage from './components/home/HomePage';
import ProductPage from './components/product/ProductPage';
import Checkout from './components/checkout/Checkout';
import OrderHistory from './components/orders/OrderHistory';
import UserProfileModal from './components/auth/UserProfileModal';
import AuthModal from './components/auth/AuthModal';
import GoogleAuthCallbackPage from './components/auth/GoogleAuthCallbackPage';
import AdminPanel from './components/admin/AdminPanel';
import NotFound from './components/admin/NotFound';
import { Product, Order } from './types';
import { ToastProvider, useToast } from './contexts/ToastContext';

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
    navigate(`/product/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToShop = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProductFromChat = (productId: string) => {
    navigate(`/product/${productId}`);
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

  const handlePlaceOrder = async (payload: { name: string; phone: string; address: string; note?: string }) => {
    if (!user) return;
    await submitOrder({
      name: payload.name || user.name,
      phone: payload.phone || user.phone,
      address: payload.address || user.address,
      note: payload.note,
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
    order.items.forEach((item) => addToCart(item, item.quantity));
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
  if (location.pathname === '/admin') {
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
      <Routes>
        <Route
          path="/"
          element={
            <HomePage onProductClick={handleProductClick} searchQuery={searchQuery} />
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProductPage
              onAddToCart={handleAddToCartAuth}
              onBuyNow={handleBuyNow}
            />
          }
        />
        <Route
          path="/checkout"
          element={
            user ? (
              <Checkout
                onBackToHome={handleBackToShop}
                onPlaceOrder={handlePlaceOrder}
                onViewOrders={() => navigate('/myorders')}
              />
            ) : (
              <HomePage onProductClick={handleProductClick} searchQuery={searchQuery} />
            )
          }
        />
        <Route
          path="/auth/google/callback"
          element={
            <GoogleAuthCallbackPage
              onSuccess={() => {}}
              onError={(msg) => showError(msg)}
            />
          }
        />
        <Route
          path="/myorders"
          element={
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
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

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
    <ToastProvider>
      <AuthProvider>
        <ShopProvider>
          <MainContent />
        </ShopProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
