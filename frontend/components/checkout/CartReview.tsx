import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartItem } from '../../types';
import { getCartRecommendations } from '../../services/shopApi';
import { useToast } from '../../contexts/ToastContext';
import RecommendationModal from './RecommendationModal';

interface CartReviewProps {
  cart: CartItem[];
  onUpdateQuantity: (id: number | string, delta: number) => void;
  onRemoveItem: (id: number | string) => void;
  onBackToHome: () => void;
  onNext: () => void;
  onAddToCartByVariantId?: (variantId: string, quantity: number) => Promise<void>;
}

const CartReview: React.FC<CartReviewProps> = ({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onBackToHome,
  onNext,
  onAddToCartByVariantId
}) => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const [showRecModal, setShowRecModal] = useState(false);
  const [recommendations, setRecommendations] = useState<Array<{
    productId: string;
    variantId: string;
    productName: string;
    category: string;
    variant: string;
    price: number;
    reason: string;
  }>>([]);
  const [loadingRec, setLoadingRec] = useState(false);

  const handleCheckoutClick = async () => {
    setShowRecModal(true);
    setLoadingRec(true);
    try {
      const res = await getCartRecommendations();
      setRecommendations(res.recommendations ?? []);
    } catch (e) {
      setRecommendations([]);
      showError(e instanceof Error ? e.message : 'Không thể tải gợi ý. Bạn có thể tiếp tục thanh toán.');
    } finally {
      setLoadingRec(false);
    }
  };

  const handleContinue = () => {
    setShowRecModal(false);
    onNext();
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 5;
  const total = subtotal + shipping;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
            {t('cart.title')}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {cart.length} {t('cart.items')}
          </p>
        </div>
        <button 
          onClick={onBackToHome}
          className="text-sm text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined !text-base">arrow_back</span>
          {t('cart.continueShopping')}
        </button>
      </div>

      {/* Empty Cart */}
      {cart.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800/50 dark:to-neutral-800/30 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 dark:bg-neutral-700/50 flex items-center justify-center">
            <span className="material-symbols-outlined !text-5xl text-neutral-300 dark:text-neutral-600 animate-pulse">
              shopping_cart
            </span>
          </div>
          <h3 className="text-xl font-bold text-neutral-700 dark:text-neutral-300 mb-2">{t('cart.empty')}</h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 max-w-xs mx-auto">
            Khám phá cửa hàng để tìm những sản phẩm yêu thích
          </p>
          <button 
            onClick={onBackToHome} 
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined !text-lg">storefront</span>
              Mua sắm ngay
            </span>
          </button>
        </div>
      ) : (
        /* Cart Items */
        <div className="space-y-3">
          {cart.map((item) => {
            const itemKey = item.backendCartItemId ?? item.cartId ?? item.id;
            return (
              <div 
                key={itemKey} 
                className="group flex gap-4 sm:gap-5 p-4 sm:p-5 bg-white dark:bg-neutral-800/80 rounded-2xl border border-neutral-100 dark:border-neutral-700/60 
                  hover:border-primary-200 dark:hover:border-primary-800/50 hover:shadow-lg hover:shadow-primary-500/5 
                  transition-all duration-300"
              >
                {/* Product Image — larger */}
                <div className="h-24 w-24 sm:h-[120px] sm:w-[120px] flex-shrink-0 overflow-hidden rounded-xl border border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>

                {/* Product Info */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-1 text-sm sm:text-base">{item.name}</h3>
                      <p className="text-xs text-primary-500 font-semibold mt-0.5">{item.category}</p>
                      {item.weight && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined !text-xs">scale</span>
                          {item.weight}
                        </p>
                      )}
                    </div>
                    {/* Delete Button */}
                    <button 
                      onClick={() => onRemoveItem(itemKey)}
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center 
                        text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 
                        transition-all duration-200"
                      title="Xóa"
                    >
                      <span className="material-symbols-outlined !text-lg">delete_outline</span>
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end mt-3">
                    {/* Quantity Controls — pill style */}
                    <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/50 overflow-hidden">
                      <button 
                        onClick={() => onUpdateQuantity(itemKey, -1)}
                        className="w-8 h-8 flex items-center justify-center text-neutral-600 dark:text-neutral-300 
                          hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <span className="material-symbols-outlined !text-sm">remove</span>
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-neutral-900 dark:text-white tabular-nums transition-all">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => onUpdateQuantity(itemKey, 1)}
                        className="w-8 h-8 flex items-center justify-center text-neutral-600 dark:text-neutral-300 
                          hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-30"
                        disabled={item.quantity >= (item.maxQuantity ?? 999)}
                      >
                        <span className="material-symbols-outlined !text-sm">add</span>
                      </button>
                    </div>
                    {/* Price */}
                    <p className="font-bold text-lg text-neutral-900 dark:text-white tabular-nums">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart Summary — glassmorphism */}
      {cart.length > 0 && (
        <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-white/80 to-neutral-50/80 dark:from-neutral-800/80 dark:to-neutral-800/60 
          backdrop-blur-sm border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm">
          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <span>Tạm tính</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Phí vận chuyển</span>
              <span className={shipping === 0 ? 'text-green-500 font-bold' : 'text-neutral-600 dark:text-neutral-300 font-medium'}>
                {shipping === 0 ? '✨ Miễn phí' : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-primary-500 bg-primary-50 dark:bg-primary-950/30 rounded-lg px-3 py-2">
                💡 Mua thêm ${(50 - subtotal).toFixed(2)} để được miễn phí vận chuyển
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('cart.total')}</p>
              <p className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tabular-nums">
                ${total.toFixed(2)}
              </p>
            </div>

            <button
              onClick={handleCheckoutClick}
              className="px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl 
                hover:from-primary-600 hover:to-primary-700 transition-all duration-300 
                shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30
                flex items-center gap-2 hover:gap-3"
            >
              {t('cart.checkout')}
              <span className="material-symbols-outlined !text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      <RecommendationModal
        isOpen={showRecModal}
        onClose={() => setShowRecModal(false)}
        recommendations={recommendations}
        onAddItem={onAddToCartByVariantId ?? (async () => {})}
        onContinue={handleContinue}
        isLoading={loadingRec}
      />
    </div>
  );
};

export default CartReview;