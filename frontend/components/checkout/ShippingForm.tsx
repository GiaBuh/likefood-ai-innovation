import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 5;
  const total = subtotal + shipping;

  const inputFields = [
    { name: 'name', label: t('checkout.receiverName'), icon: 'person', type: 'text', placeholder: 'Nguyễn Văn A', halfWidth: true },
    { name: 'phone', label: t('checkout.receiverPhone'), icon: 'phone', type: 'tel', placeholder: '0901234567', halfWidth: true },
    { name: 'address', label: t('checkout.shippingAddress'), icon: 'location_on', type: 'textarea', placeholder: 'Số nhà, đường, phường, quận, TP' },
    { name: 'note', label: t('checkout.note'), icon: 'edit_note', type: 'text', placeholder: 'Hướng dẫn giao hàng đặc biệt' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left — Shipping Form */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
              {t('checkout.shippingInfo')}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Điền thông tin để chúng tôi giao hàng cho bạn</p>
          </div>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputFields.map((field) => {
                const hasError = field.name !== 'note' && errors[field.name as keyof typeof errors];
                const isHalf = field.halfWidth;
                
                const inputContent = (
                  <div key={field.name} className={`space-y-1.5 ${isHalf ? '' : 'md:col-span-2'}`}>
                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                      <span className={`material-symbols-outlined !text-base ${hasError ? 'text-red-500' : 'text-primary-500'}`}>
                        {field.icon}
                      </span>
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        name={field.name}
                        value={formData[field.name as keyof FormData]}
                        onChange={onInputChange}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 
                          focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white dark:focus:bg-neutral-800
                          transition-all duration-200 resize-none text-neutral-900 dark:text-white placeholder:text-neutral-400
                          ${hasError
                            ? 'border-red-400 dark:border-red-500 animate-shake'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                          }`}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name as keyof FormData]}
                        onChange={onInputChange}
                        className={`w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 
                          focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white dark:focus:bg-neutral-800
                          transition-all duration-200 text-neutral-900 dark:text-white placeholder:text-neutral-400
                          ${hasError
                            ? 'border-red-400 dark:border-red-500 animate-shake'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                          }`}
                        placeholder={field.placeholder}
                      />
                    )}
                    {hasError && (
                      <p className="text-xs text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="material-symbols-outlined !text-xs">error</span>
                        {errors[field.name as keyof typeof errors]}
                      </p>
                    )}
                  </div>
                );
                return inputContent;
              })}
            </div>
          </form>
        </div>

        {/* Right — Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800/90 dark:to-neutral-800/60 
            rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-700/60 
            shadow-sm sticky top-24">
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined !text-xl text-primary-500">receipt_long</span>
              Tóm tắt đơn hàng
            </h3>
            
            {/* Items */}
            <div className="space-y-3 mb-5 max-h-60 overflow-y-auto scrollbar-hide">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-700 dark:text-neutral-200 font-medium truncate text-xs">{item.name}</p>
                    <p className="text-neutral-400 text-xs">x{item.quantity}</p>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-white text-sm tabular-nums">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2.5 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
                <span>Tạm tính</span>
                <span className="tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Phí vận chuyển</span>
                <span className={shipping === 0 ? 'text-green-500 font-bold' : 'text-neutral-600 dark:text-neutral-300'}>
                  {shipping === 0 ? '✨ Miễn phí' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-sm text-neutral-600 dark:text-neutral-300 font-semibold">Tổng cộng</span>
                <span className="text-2xl font-black text-neutral-900 dark:text-white tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="px-5 py-3 text-neutral-600 dark:text-neutral-300 font-bold hover:text-neutral-900 dark:hover:text-white 
            transition-colors flex items-center gap-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <span className="material-symbols-outlined !text-lg">arrow_back</span>
          {t('common.back')}
        </button>
        <button 
          onClick={onPlaceOrder}
          className="px-8 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl 
            hover:from-primary-600 hover:to-primary-700 transition-all duration-300 
            shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30
            flex items-center gap-2 hover:gap-3 active:scale-[0.98]"
        >
          {t('checkout.placeOrder')}
          <span className="material-symbols-outlined !text-lg">lock</span>
        </button>
      </div>

      {/* Shake animation style */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ShippingForm;