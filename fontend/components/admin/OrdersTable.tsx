
import React from 'react';
import { Order, PaymentStatus, FulfillmentStatus, PaginationMeta } from '../../types';
import Skeleton from '../ui/Skeleton';

interface OrdersTableProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onUpdateStatus: (id: string, status: FulfillmentStatus) => void;
  pagination?: PaginationMeta;
  isLoading?: boolean;
}

const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const styles = {
    Paid: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    Unpaid: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    Refunded: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };

  const dotStyles = {
    Paid: 'bg-green-600 dark:bg-green-400',
    Unpaid: 'bg-gray-500 dark:bg-gray-400',
    Refunded: 'bg-red-600 dark:bg-red-400',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dotStyles[status]}`}></span>
      {status}
    </span>
  );
};

const StatusSelect: React.FC<{ status: FulfillmentStatus, onChange: (s: FulfillmentStatus) => void }> = ({ status, onChange }) => {
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
      <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
          <select
              value={status}
              disabled={isLocked}
              onChange={(e) => onChange(e.target.value as FulfillmentStatus)}
              className={`appearance-none rounded-full px-3 py-0.5 pr-7 text-xs font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary/50 ${styles[status] || styles.Processing}`}
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
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </div>
      </div>
  );
};

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onOrderClick, onUpdateStatus, pagination, isLoading = false }) => {
  const page = pagination?.page ?? 1;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const displayTotal = pagination?.total ?? orders.length;

  return (
    <div className="overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-subtext-light dark:text-subtext-dark">
          <thead className="bg-background-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark text-xs uppercase text-subtext-light dark:text-subtext-dark font-semibold">
            <tr>
              <th scope="col" className="px-6 py-4">Order ID</th>
              <th scope="col" className="px-6 py-4">Customer</th>
              <th scope="col" className="px-6 py-4">Date</th>
              <th scope="col" className="px-6 py-4">Total</th>
              <th scope="col" className="px-6 py-4">Payment Status</th>
              <th scope="col" className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {isLoading ? (
              // Loading Skeletons
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-32" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                </tr>
              ))
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors group cursor-pointer" onClick={() => onOrderClick(order)}>
                  <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">
                    <span className="text-primary hover:underline">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {order.customer.avatarUrl ? (
                        <img 
                          src={order.customer.avatarUrl} 
                          alt={order.customer.fullname} 
                          className="h-8 w-8 rounded-full object-cover" 
                        />
                      ) : (
                        <div className={`h-8 w-8 rounded-full ${order.customer.initialsBgColor} flex items-center justify-center text-xs font-bold ${order.customer.initialsTextColor}`}>
                          {order.customer.initials}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-text-light dark:text-text-dark font-medium">{order.customer.fullname}</span>
                        <span className="text-xs">{order.customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-text-light dark:text-text-dark">{order.createdAt}</span>
                      <span className="text-xs">{order.time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-light dark:text-text-dark font-medium">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusSelect 
                      status={order.fulfillmentStatus} 
                      onChange={(newStatus) => onUpdateStatus(order.id, newStatus)} 
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination embedded in table card */}
      <div className="flex items-center justify-between border-t border-border-light dark:border-border-dark px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-subtext-light dark:text-subtext-dark">
            Page {page} of {totalPages}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-subtext-light dark:text-subtext-dark disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary px-2 text-white text-sm font-medium transition-colors">
            {page}
          </button>
          <button
            disabled
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-subtext-light dark:text-subtext-dark disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
          <span className="ml-2 text-sm text-subtext-light dark:text-subtext-dark">Total: {displayTotal}</span>
        </div>
      </div>
    </div>
  );
};

export default OrdersTable;
