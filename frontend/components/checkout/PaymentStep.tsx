import React from 'react';
import { useTranslation } from 'react-i18next';
import { CartItem } from '../../types';

interface PaymentStepProps {
  cart: CartItem[];
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  onPaymentMethodChange: (method: 'COD' | 'BANK_TRANSFER') => void;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  cart,
  paymentMethod,
  onPaymentMethodChange,
  onBack,
  onConfirm,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mb-2">
          Chọn phương thức thanh toán
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Đơn hàng đã sẵn sàng. Chọn phương thức để hoàn tất bước thanh toán.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => onPaymentMethodChange('COD')}
            className={`w-full rounded-2xl border p-4 text-left transition-all ${
              paymentMethod === 'COD'
                ? 'border-primary-500 bg-orange-50 dark:bg-orange-950/20'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
            }`}
          >
            <p className="font-bold text-neutral-900 dark:text-white">Thanh toán khi nhận hàng (COD)</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Đơn hàng sẽ được tạo ngay và thanh toán lúc nhận hàng.
            </p>
          </button>

          <button
            onClick={() => onPaymentMethodChange('BANK_TRANSFER')}
            className={`w-full rounded-2xl border p-4 text-left transition-all ${
              paymentMethod === 'BANK_TRANSFER'
                ? 'border-primary-500 bg-orange-50 dark:bg-orange-950/20'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
            }`}
          >
            <p className="font-bold text-neutral-900 dark:text-white">Thanh toán qua VNPay</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Hệ thống tạo đơn trước, sau đó mở cổng VNPay để bạn thanh toán.
            </p>
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-800/40">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Tạm tính</span>
            <span className="font-semibold text-neutral-900 dark:text-white">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-base mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <span className="font-bold text-neutral-700 dark:text-neutral-200">Tổng cộng</span>
            <span className="text-xl font-black text-neutral-900 dark:text-white">${subtotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="px-5 py-3 text-neutral-600 dark:text-neutral-300 font-bold hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-60"
          >
            <span className="material-symbols-outlined !text-lg">arrow_back</span>
            {t('common.back')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-8 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 flex items-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận & thanh toán'}
            <span className="material-symbols-outlined !text-lg">payments</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep;
