import React from 'react';

interface OrderSuccessProps {
  onBackToHome: () => void;
  onViewOrder: () => void;
}

const OrderSuccess: React.FC<OrderSuccessProps> = ({ onBackToHome, onViewOrder }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined !text-5xl text-green-600 dark:text-green-400">check_circle</span>
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 text-center">Order Successful!</h2>
      <p className="text-stone-500 dark:text-stone-400 text-center max-w-md mb-8">
        Thank you for your purchase. We have received your order and will begin processing it right away.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button 
          onClick={onBackToHome}
          className="flex-1 px-6 py-3.5 bg-stone-100 dark:bg-stone-800 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
        >
          Back to Home
        </button>
        <button 
          onClick={onViewOrder}
          className="flex-1 px-6 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-orange-500/20"
        >
          View Order
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;