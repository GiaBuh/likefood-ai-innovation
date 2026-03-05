import React from 'react';
import { Order, PaymentStatus, FulfillmentStatus } from '../../types';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdateStatus?: (orderId: string, status: FulfillmentStatus) => Promise<void> | void;
  onCancelOrder?: (orderId: string) => Promise<void> | void;
}

const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
    const styles = {
      Paid: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      Unpaid: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
      Refunded: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
  
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
};
  
const StatusSelect: React.FC<{ status: FulfillmentStatus, onChange?: (s: FulfillmentStatus) => void }> = ({ status, onChange }) => {
    const styles: Record<string, string> = {
      Processing: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-500 border-yellow-200 dark:border-yellow-900',
      Confirm: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
      Shipped: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900',
      Complete: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900',
      Cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    };
    
    const options: FulfillmentStatus[] = ['Processing', 'Confirm', 'Shipped', 'Complete', 'Cancelled'];
    const isLocked = status === 'Complete' || status === 'Cancelled';

    return (
        <div className="relative inline-block">
            <select
                value={status}
                disabled={isLocked}
                onChange={(e) => onChange && onChange(e.target.value as FulfillmentStatus)}
                className={`appearance-none rounded-full px-3 py-1 pr-8 text-xs font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary/50 ${styles[status] || styles.Processing}`}
            >
                {options.map((opt) => (
                    <option
                      key={opt}
                      value={opt}
                      disabled={opt === 'Cancelled'}
                      className="bg-white dark:bg-gray-800 text-text-light dark:text-text-dark"
                    >
                        {opt}
                    </option>
                ))}
            </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-60">
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </div>
        </div>
    );
};

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, onUpdateStatus, onCancelOrder }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-surface-light dark:bg-surface-dark shadow-xl border border-border-light dark:border-border-dark my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-text-light dark:text-text-dark">Order {order.id}</h3>
              <StatusSelect 
                status={order.fulfillmentStatus} 
                onChange={(newStatus) => onUpdateStatus && onUpdateStatus(order.id, newStatus)} 
              />
            </div>
            <p className="text-sm text-subtext-light dark:text-subtext-dark mt-1">Placed on {order.createdAt} at {order.time}</p>
          </div>
          <button onClick={onClose} className="text-subtext-light hover:text-text-light dark:text-subtext-dark dark:hover:text-text-dark">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Customer Info */}
                <div>
                    <h4 className="text-sm font-bold text-subtext-light dark:text-subtext-dark uppercase mb-3">Customer</h4>
                    <div className="flex items-center gap-3 mb-3">
                        {order.customer.avatarUrl ? (
                            <img src={order.customer.avatarUrl} alt={order.customer.fullname} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                            <div className={`h-10 w-10 rounded-full ${order.customer.initialsBgColor} flex items-center justify-center text-sm font-bold ${order.customer.initialsTextColor}`}>
                                {order.customer.initials}
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-bold text-text-light dark:text-text-dark">{order.customer.fullname}</p>
                            <p className="text-xs text-subtext-light dark:text-subtext-dark">{order.customer.email}</p>
                        </div>
                    </div>
                </div>

                {/* Shipping Info */}
                <div>
                    <h4 className="text-sm font-bold text-subtext-light dark:text-subtext-dark uppercase mb-3">Shipping To</h4>
                    <p className="text-sm text-text-light dark:text-text-dark">{order.customer.fullname}</p>
                    <p className="text-sm text-subtext-light dark:text-subtext-dark mt-1">{order.shippingAddress || order.customer.address}</p>
                    <p className="text-sm text-subtext-light dark:text-subtext-dark mt-1">{order.customer.phoneNumber}</p>
                </div>
            </div>

            {/* Order Items */}
            <h4 className="text-sm font-bold text-subtext-light dark:text-subtext-dark uppercase mb-3">Order Items</h4>
            <div className="space-y-4">
                {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border border-border-light dark:border-border-dark bg-background-light/50 dark:bg-background-dark/50">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-white">
                                <img src={item.productThumbnail} alt={item.productName} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-bold text-text-light dark:text-text-dark truncate">{item.productName}</h5>
                                <p className="text-xs text-subtext-light dark:text-subtext-dark mt-0.5">Variant: {item.variantLabel}</p>
                                <div className="mt-2 text-xs font-medium text-subtext-light dark:text-subtext-dark">
                                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-text-light dark:text-text-dark">${(item.quantity * item.price).toFixed(2)}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-subtext-light dark:text-subtext-dark text-sm">
                        No items found for this mock order.
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="mt-6 border-t border-border-light dark:border-border-dark pt-6 flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-subtext-light dark:text-subtext-dark">Subtotal</span>
                        <span className="font-medium text-text-light dark:text-text-dark">${order.totalAmount.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-subtext-light dark:text-subtext-dark">Shipping</span>
                        <span className="font-medium text-text-light dark:text-text-dark">$0.00</span>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-subtext-light dark:text-subtext-dark">Tax</span>
                        <span className="font-medium text-text-light dark:text-text-dark">$0.00</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-border-light dark:border-border-dark pt-2 mt-2">
                        <span className="text-text-light dark:text-text-dark">Total</span>
                        <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-background-light dark:bg-background-dark rounded-b-2xl border-t border-border-light dark:border-border-dark flex justify-between items-center">
            <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-subtext-light dark:text-subtext-dark">Payment:</span>
                 <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <div className="flex gap-3">
                 {order.fulfillmentStatus !== 'Cancelled' && (
                    <button 
                        onClick={() => onCancelOrder && onCancelOrder(order.id)}
                        className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
                    >
                        Cancel Order
                    </button>
                 )}
                 <button className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-blue-600 text-sm font-bold shadow-lg shadow-blue-500/20 transition-colors">
                    Print Invoice
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
