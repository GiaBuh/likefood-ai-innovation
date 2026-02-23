import React from 'react';
import { CartItem } from '../../types';

interface FormData {
  name: string;
  phone: string;
  address: string;
  note: string;
}

interface ShippingFormProps {
  cart: CartItem[];
  formData: FormData;
  errors?: Partial<Record<'name' | 'phone' | 'address', string>>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBack: () => void;
  onPlaceOrder: () => void;
}

const ShippingForm: React.FC<ShippingFormProps> = ({ 
  cart, 
  formData, 
  errors = {},
  onInputChange, 
  onBack,
  onPlaceOrder
}) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 5;
  const total = subtotal + shipping;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Shipping Information</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-600 dark:text-stone-300">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={onInputChange}
                  className={`w-full px-4 py-3 rounded-lg bg-stone-50 dark:bg-stone-800 focus:ring-primary focus:border-primary transition-all ${
                    errors.name
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-600 dark:text-stone-300">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={onInputChange}
                  className={`w-full px-4 py-3 rounded-lg bg-stone-50 dark:bg-stone-800 focus:ring-primary focus:border-primary transition-all ${
                    errors.phone
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}
                  placeholder="(555) 000-0000"
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-stone-600 dark:text-stone-300">Shipping Address</label>
              <textarea 
                name="address"
                value={formData.address}
                onChange={onInputChange}
                rows={3}
                className={`w-full px-4 py-3 rounded-lg bg-stone-50 dark:bg-stone-800 focus:ring-primary focus:border-primary transition-all resize-none ${
                  errors.address
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-stone-200 dark:border-stone-700'
                }`}
                placeholder="123 Street, City, State, Zip"
              ></textarea>
              {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
            </div>
            <div className="space-y-1">
               <label className="text-sm font-semibold text-stone-600 dark:text-stone-300">Order Note (Optional)</label>
               <input 
                  type="text" 
                  name="note"
                  value={formData.note}
                  onChange={onInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Special instructions for delivery"
                />
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-6 border border-stone-200 dark:border-stone-700 sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Order Summary</h3>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto scrollbar-hide">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-stone-600 dark:text-stone-300">
                    <span className="font-bold">{item.quantity}x</span> {item.name}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3 pt-4 border-t border-stone-200 dark:border-stone-700">
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-slate-900 dark:text-white pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="px-6 py-3 text-stone-600 dark:text-stone-300 font-bold hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Back
        </button>
        <button 
          onClick={onPlaceOrder}
          className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
        >
          Place Order
          <span className="material-symbols-outlined !text-lg">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default ShippingForm;