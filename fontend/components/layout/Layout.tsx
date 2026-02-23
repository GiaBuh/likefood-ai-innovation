
import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileCartModal from '../cart/MobileCartModal';
import ChatWidget from '../chat/ChatWidget';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';

interface LayoutProps {
  children: React.ReactNode;
  onCheckout: () => void;
  onOpenProfile: () => void;
  onViewOrders: () => void;
  onGoToCheckout: () => void;
  onOpenProduct: (productId: string) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onGoHome: () => void;
  onGoToAdmin: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onCheckout,
  onOpenProfile,
  onViewOrders,
  onGoToCheckout,
  onOpenProduct,
  onOpenLogin,
  onOpenRegister,
  onGoHome,
  onGoToAdmin,
  searchQuery,
  onSearchQueryChange
}) => {
  const { user } = useAuth();
  const { cart, removeFromCart } = useShop();
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const handleCheckout = () => {
    setIsMobileCartOpen(false);
    onCheckout();
  };

  return (
    <div className="flex flex-col min-h-screen font-display">
      <Header 
        onOpenMobileCart={() => setIsMobileCartOpen(true)}
        onCheckout={onCheckout}
        onOpenProfile={onOpenProfile}
        onViewOrders={onViewOrders}
        onOpenLogin={onOpenLogin}
        onOpenRegister={onOpenRegister}
        onGoHome={onGoHome}
        onGoToAdmin={onGoToAdmin}
        onOpenProduct={onOpenProduct}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
      />
      
      <main className="w-full min-h-screen pt-20">
        {children}
      </main>

      <Footer />
      
      {/* Chat Widget - Always visible, handles its own login state */}
      <ChatWidget
        user={user}
        onOpenLogin={onOpenLogin}
        onGoToCheckout={onGoToCheckout}
        onGoToOrders={onViewOrders}
        onOpenProduct={onOpenProduct}
      />
      
      {/* Only show mobile cart modal if user is logged in, effectively */}
      {user && (
        <MobileCartModal 
          isOpen={isMobileCartOpen}
          onClose={() => setIsMobileCartOpen(false)}
          cart={cart}
          onCheckout={handleCheckout}
          onRemoveItem={removeFromCart}
        />
      )}
    </div>
  );
};

export default Layout;
