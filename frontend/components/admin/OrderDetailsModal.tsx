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
    Paid: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400',
    Unpaid: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
    Refunded: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
};
  
const StatusSelect: React.FC<{ status: FulfillmentStatus, onChange?: (s: FulfillmentStatus) => void }> = ({ status, onChange }) => {
  const styles: Record<string, string> = {
    Processing: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    Confirm: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    Shipped: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    Complete: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    Cancelled: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700',
  };
  const options: FulfillmentStatus[] = ['Processing', 'Confirm', 'Shipped', 'Complete', 'Cancelled'];
  const isLocked = status === 'Complete' || status === 'Cancelled';

  return (
    <div className="relative inline-block">
      <select
        value={status}
        disabled={isLocked}
        onChange={(e) => onChange && onChange(e.target.value as FulfillmentStatus)}
        className={`appearance-none rounded-full px-3 py-1 pr-8 text-xs font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all ${styles[status] || styles.Processing}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} disabled={opt === 'Cancelled'} className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
            {opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
        <span className="material-symbols-outlined !text-base">expand_more</span>
      </div>
    </div>
  );
};

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, onUpdateStatus, onCancelOrder }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white">Đơn hàng {order.id}</h3>
              <StatusSelect status={order.fulfillmentStatus} onChange={(newStatus) => onUpdateStatus && onUpdateStatus(order.id, newStatus)} />
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Đặt ngày {order.createdAt} lúc {order.time}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Customer */}
            <div>
              <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Khách hàng</h4>
              <div className="flex items-center gap-3 mb-3">
                {order.customer.avatarUrl ? (
                  <img src={order.customer.avatarUrl} alt={order.customer.fullname} className="h-10 w-10 rounded-full object-cover ring-2 ring-neutral-100 dark:ring-neutral-700" />
                ) : (
                  <div className={`h-10 w-10 rounded-full ${order.customer.initialsBgColor} flex items-center justify-center text-sm font-bold ${order.customer.initialsTextColor}`}>
                    {order.customer.initials}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">{order.customer.fullname}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{order.customer.email}</p>
                </div>
              </div>
            </div>
            {/* Shipping */}
            <div>
              <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Giao đến</h4>
              <p className="text-sm text-neutral-900 dark:text-white">{order.customer.fullname}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{order.shippingAddress || order.customer.address}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{order.customer.phoneNumber}</p>
            </div>
          </div>

          {/* Items */}
          <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Chi tiết đơn hàng</h4>
          <div className="space-y-3">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                    <img src={item.productThumbnail} alt={item.productName} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold text-neutral-900 dark:text-white truncate">{item.productName}</h5>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Quy cách: {item.variantLabel}</p>
                    <div className="mt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Qty: {item.quantity} × ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-neutral-900 dark:text-white tabular-nums">${(item.quantity * item.price).toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 text-sm">
                No items found for this order.
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 border-t border-neutral-100 dark:border-neutral-800 pt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Tạm tính</span>
                <span className="font-medium text-neutral-900 dark:text-white tabular-nums">${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Phí vận chuyển</span>
                <span className="font-medium text-neutral-900 dark:text-white">$0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Tax</span>
                <span className="font-medium text-neutral-900 dark:text-white">$0.00</span>
              </div>
              <div className="flex justify-between text-lg font-black border-t border-neutral-200 dark:border-neutral-700 pt-3 mt-3">
                <span className="text-neutral-900 dark:text-white">Tổng cộng</span>
                <span className="text-primary-500">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-50 dark:bg-neutral-800/30 rounded-b-2xl border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Thanh toán:</span>
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <div className="flex gap-3">
            {order.fulfillmentStatus !== 'Cancelled' && (
              <button 
                onClick={() => onCancelOrder && onCancelOrder(order.id)}
                className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-medium transition-colors"
              >
                Hủy đơn
              </button>
            )}
            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 text-sm font-bold shadow-lg shadow-orange-500/20 transition-all">
              In hóa đơn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
