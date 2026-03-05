import React from 'react';
import { CartItem } from '../../types';

interface CartReviewProps {
  cart: CartItem[];
  onUpdateQuantity: (id: number | string, delta: number) => void;
  onRemoveItem: (id: number | string) => void;
  onBackToHome: () => void;
  onNext: () => void;
}

const CartReview: React.FC<CartReviewProps> = ({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onBackToHome,
  onNext
}) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 5;
  const total = subtotal + shipping;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Review Your Cart</h2>
        <span className="text-sm text-stone-500 dark:text-stone-400">{cart.length} items</span>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
          <span className="material-symbols-outlined !text-6xl text-stone-300 mb-4">remove_shopping_cart</span>
          <p className="text-lg font-medium text-stone-600 dark:text-stone-300">Your cart is empty</p>
          <button onClick={onBackToHome} className="mt-4 text-primary font-bold hover:underline">
            Go back to shop
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.backendCartItemId ?? item.cartId ?? item.id} className="flex gap-4 p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-600">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{item.category}</p>
                    <p className="text-xs font-bold text-stone-600 dark:text-stone-300 mt-1">Weight: {item.weight}</p>
                  </div>
                  <button 
                    onClick={() => onRemoveItem(item.backendCartItemId ?? item.cartId ?? item.id)}
                    className="text-stone-400 hover:text-red-500 transition-colors p-1"
                  >
                    <span className="material-symbols-outlined !text-xl">delete</span>
                  </button>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="flex items-center border border-stone-300 dark:border-stone-600 rounded-lg bg-stone-50 dark:bg-stone-900">
                    <button 
                      onClick={() => onUpdateQuantity(item.backendCartItemId ?? item.cartId ?? item.id, -1)}
                      className="p-1 px-2 text-stone-600 dark:text-stone-300 hover:text-primary transition-colors disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      <span className="material-symbols-outlined !text-sm">remove</span>
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.backendCartItemId ?? item.cartId ?? item.id, 1)}
                      className="p-1 px-2 text-stone-600 dark:text-stone-300 hover:text-primary transition-colors disabled:opacity-50"
                      disabled={item.quantity >= (item.maxQuantity ?? 999)}
                    >
                      <span className="material-symbols-outlined !text-sm">add</span>
                    </button>
                  </div>
                  <p className="font-bold text-lg text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <div className="hidden sm:block">
             <div className="text-lg font-medium text-slate-900 dark:text-white">
               Total: <span className="font-black text-2xl ml-2">${total.toFixed(2)}</span>
             </div>
          </div>

          <div className="flex gap-4 ml-auto w-full sm:w-auto">
            <button 
              onClick={onNext}
              className="flex-1 sm:flex-none px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              Checkout
              <span className="material-symbols-outlined !text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartReview;