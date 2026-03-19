import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface OrderSuccessProps {
  onBackToHome: () => void;
  onViewOrder: () => void;
  paymentMethod?: 'COD' | 'BANK_TRANSFER';
  paymentStatusRaw?: 'PENDING' | 'PAID' | 'FAILED';
  onRetryPayment?: () => Promise<void> | void;
}

const OrderSuccess: React.FC<OrderSuccessProps> = ({
  onBackToHome,
  onViewOrder,
  paymentMethod = 'COD',
  paymentStatusRaw = 'PENDING',
  onRetryPayment,
}) => {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const isVnpay = paymentMethod === 'BANK_TRANSFER';
  const isPaid = paymentStatusRaw === 'PAID';

  const handleRetryPayment = async () => {
    if (!onRetryPayment) return;
    try {
      setIsRetrying(true);
      await onRetryPayment();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 animate-in zoom-in-95 duration-500 relative overflow-hidden">
      {/* CSS Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full opacity-80"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#f97316', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 6],
                animation: `confetti-fall ${2 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
                transform: `rotate(${Math.random() * 360}deg)`,
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
              }}
            />
          ))}
        </div>
      )}

      {/* Animated Checkmark */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-8">
        {/* Outer ring pulse */}
        <div className="absolute inset-0 rounded-full bg-green-100 dark:bg-green-900/20 animate-ping opacity-20" />
        {/* Inner circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-500/30">
          <svg className="w-14 h-14 sm:w-16 sm:h-16" viewBox="0 0 52 52" fill="none">
            <path
              className="checkmark-draw"
              d="M14 27L22 35L38 17"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 50,
                strokeDashoffset: 50,
                animation: 'draw-check 0.6s ease-out 0.3s forwards',
              }}
            />
          </svg>
        </div>
      </div>

      {/* Success Text */}
      <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white mb-3 text-center animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
        {t('checkout.orderSuccess')}
      </h2>
      <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
        {t('checkout.orderSuccessMsg')}
      </p>

      {/* Order highlight card */}
      <div className="w-full max-w-sm mb-8 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 
        animate-in fade-in slide-in-from-bottom-2 duration-500 delay-700">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined !text-2xl text-green-500">verified</span>
          <div>
            <p className="text-sm font-bold text-green-700 dark:text-green-400">Đơn hàng đã được xác nhận</p>
            <p className="text-xs text-green-600 dark:text-green-500">
              {isVnpay
                ? isPaid
                  ? 'Thanh toán VNPay đã thành công.'
                  : 'Thanh toán VNPay chưa hoàn tất. Bạn có thể thanh toán lại.'
                : 'Chúng tôi sẽ liên hệ bạn sớm nhất'}
            </p>
          </div>
        </div>
      </div>

      {isVnpay && !isPaid && onRetryPayment && (
        <button
          onClick={handleRetryPayment}
          disabled={isRetrying}
          className="mb-6 px-5 py-3 rounded-xl border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 font-bold hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors disabled:opacity-60"
        >
          {isRetrying ? 'Đang mở VNPay...' : 'Thanh toán lại với VNPay'}
        </button>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-1000">
        <button 
          onClick={onBackToHome}
          className="flex-1 px-6 py-3.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-white 
            font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-200
            flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined !text-lg">storefront</span>
          {t('checkout.backToShop')}
        </button>
        <button 
          onClick={onViewOrder}
          className="flex-1 px-6 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white 
            font-bold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 
            shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30
            flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined !text-lg">receipt_long</span>
          {t('common.myOrders')}
        </button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes draw-check {
          to { stroke-dashoffset: 0; }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default OrderSuccess;