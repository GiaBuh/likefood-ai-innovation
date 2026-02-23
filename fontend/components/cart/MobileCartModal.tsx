import React from 'react';
import { CartItem } from '../../types';

interface MobileCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onCheckout?: () => void;
  onRemoveItem: (id: number | string) => void;
}

const MobileCartModal: React.FC<MobileCartModalProps> = ({ isOpen, onClose, cart, onCheckout, onRemoveItem }) => {
  if (!isOpen) return null;

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div aria-modal="true" className="fixed inset-0 z-[60] lg:hidden" role="dialog">
      <div 
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="fixed inset-x-0 bottom-0 z-10 w-full max-w-full bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl flex flex-col h-[75vh] transition-transform transform translate-y-0 ring-1 ring-white/10 animate-in slide-in-from-bottom-full duration-300">
        <div className="flex-none px-4 pt-4 pb-2 text-center relative">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-stone-300 dark:bg-stone-700 mb-4"></div>
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Your Cart</h2>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-stone-400 hover:text-stone-500 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-500 dark:text-stone-400 space-y-4">
              <span className="material-symbols-outlined !text-6xl opacity-20">shopping_basket</span>
              <p className="text-lg font-medium">Your cart is currently empty</p>
              <button 
                onClick={onClose}
                className="text-primary font-bold hover:underline"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={item.cartId || `${item.id}-${index}`} className="flex gap-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800">
                {/* Image */}
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover object-center"
                  />
                </div>

                {/* Info Column */}
                <div className="flex flex-1 flex-col justify-center gap-1 py-1">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">{item.name}</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{item.category}</p>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-stone-500 dark:text-stone-400 font-medium">
                    <div className="flex items-center gap-1">
                      <span>Weight:</span>
                      <span className="text-slate-900 dark:text-white font-bold">{item.weight}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Quantity:</span>
                      <span className="text-slate-900 dark:text-white font-bold">{item.quantity}</span>
                    </div>
                  </div>
                </div>

                {/* Price & Actions Column */}
                <div className="flex flex-col justify-between items-end py-1">
                  <p className="text-sm font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                  <button 
                    onClick={() => onRemoveItem(item.backendCartItemId ?? item.cartId ?? item.id)} 
                    className="p-2 text-stone-400 hover:text-red-500 transition-colors bg-white dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-red-100 dark:hover:border-red-900/30"
                  >
                    <span className="material-symbols-outlined !text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="flex-none p-6 pt-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 pb-8 sm:pb-6">
             <div className="flex justify-between items-center mb-4">
                <span className="text-stone-500 dark:text-stone-400 font-medium">Total</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">${totalPrice.toFixed(2)}</span>
             </div>
             <button 
               onClick={onCheckout}
               className="w-full py-4 rounded-2xl font-bold text-white bg-primary hover:bg-primary-dark shadow-xl shadow-orange-500/20 active:scale-95 transform transition-all flex items-center justify-center gap-2"
             >
               Checkout Now
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCartModal;
