
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import Skeleton from '../ui/Skeleton';

interface OrderHistoryProps {
  orders: Order[];
  onBackToShop: () => void;
  onCancelOrder: (orderId: string) => Promise<void> | void;
  onTrackOrder: (orderId: string) => void;
  onReorder: (order: Order) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ 
  orders, 
  onBackToShop,
  onCancelOrder,
  onTrackOrder,
  onReorder
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: OrderStatus | string) => {
    switch (status) {
      case 'Processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'Confirm': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      case 'Shipped': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'Complete': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700';
    }
  };

  const renderOrderActions = (order: Order) => {
    const status = (order.fulfillmentStatus || order.status) as OrderStatus;
    switch (status) {
      case 'Processing':
        return (
          <>
            <button 
              onClick={() => onCancelOrder(order.id)}
              className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined !text-lg">cancel</span>
              Cancel Order
            </button>
            <p className="text-xs text-center text-stone-400">Order can be cancelled before shipping.</p>
          </>
        );
      case 'Confirm':
        return (
          <>
            <button 
              onClick={() => onCancelOrder(order.id)}
              className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined !text-lg">cancel</span>
              Cancel Order
            </button>
            <p className="text-xs text-center text-stone-400">Order can be cancelled before shipping.</p>
          </>
        );
      case 'Shipped':
        return (
          <>
            <button 
              onClick={() => onTrackOrder(order.id)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined !text-lg">local_shipping</span>
              Track Order
            </button>
            <button className="w-full py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-slate-700 dark:text-stone-300 font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm">
              Contact Support
            </button>
          </>
        );
      case 'Complete':
      case 'Cancelled':
        return (
          <>
             <button 
              onClick={() => onReorder(order)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-orange-500/20 text-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined !text-lg">shopping_cart</span>
              Buy Again
            </button>
            {status === 'Complete' && (
              <button className="w-full py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-slate-700 dark:text-stone-300 font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm">
                Write a Review
              </button>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">My Orders</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">Track and manage your recent purchases</p>
        </div>
        <button 
          onClick={onBackToShop}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-bold text-sm text-slate-700 dark:text-white hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
        >
          <span className="material-symbols-outlined !text-lg">storefront</span>
          Continue Shopping
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
           {[...Array(2)].map((_, i) => (
             <div key={i} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                {/* Header Skeleton */}
                <div className="p-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex gap-12">
                   <div>
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-4 w-24" />
                   </div>
                   <div>
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-4 w-32" />
                   </div>
                   <div className="ml-auto">
                      <Skeleton className="h-6 w-24 rounded-full" />
                   </div>
                </div>
                {/* Body Skeleton */}
                <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 flex gap-4">
                             <Skeleton className="h-16 w-16 rounded-lg" />
                             <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                             </div>
                        </div>
                        <div className="lg:w-72 pl-6 border-l border-stone-100 dark:border-stone-800 space-y-3">
                             <Skeleton className="h-3 w-24" />
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-10 w-full rounded-xl mt-2" />
                        </div>
                    </div>
                </div>
             </div>
           ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 border-dashed">
          <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined !text-4xl text-stone-400">receipt_long</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No orders yet</h2>
          <p className="text-stone-500 dark:text-stone-400 mb-6 max-w-sm text-center">Looks like you haven't discovered our delicious specialties yet.</p>
          <button 
            onClick={onBackToShop}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-orange-500/20"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Order Header */}
              <div className="p-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex gap-6 md:gap-12">
                  <div>
                    <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Order ID</p>
                    <p className="font-bold text-slate-900 dark:text-white">#{order.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Date Placed</p>
                    <p className="font-medium text-slate-700 dark:text-stone-300">{order.date || order.createdAt}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Total Amount</p>
                    <p className="font-bold text-slate-900 dark:text-white">${(order.totalAmount ?? order.total ?? 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor((order.fulfillmentStatus || order.status) as OrderStatus)}`}>
                    {order.fulfillmentStatus || order.status}
                  </span>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Items List */}
                  <div className="flex-1 space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <div className="h-16 w-16 flex-shrink-0 rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden bg-white">
                          <img src={item.image || item.productThumbnail} alt={item.name || item.productName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name || item.productName}</h4>
                          <p className="text-sm text-stone-500 dark:text-stone-400">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions / Address */}
                  <div className="lg:w-72 lg:border-l lg:border-stone-100 lg:dark:border-stone-800 lg:pl-6 flex flex-col justify-center gap-3">
                    <div className="mb-2">
                       <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Shipping To</p>
                       <p className="text-sm text-slate-700 dark:text-stone-300 leading-relaxed line-clamp-2">
                         {order.shippingAddress || "123 Main St, Springfield, USA"}
                       </p>
                    </div>
                    
                    {renderOrderActions(order)}
                    
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
