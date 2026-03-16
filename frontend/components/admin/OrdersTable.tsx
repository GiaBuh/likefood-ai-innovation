
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
    Paid: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400',
    Unpaid: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
    Refunded: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400',
  };
  const dotStyles = {
    Paid: 'bg-green-500',
    Unpaid: 'bg-neutral-400',
    Refunded: 'bg-red-500',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      {status}
    </span>
  );
};

const StatusSelect: React.FC<{ status: FulfillmentStatus, onChange: (s: FulfillmentStatus) => void }> = ({ status, onChange }) => {
  const styles: Record<string, string> = {
    Processing: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    Confirm: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    Shipped: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    Complete: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    Cancelled: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  };
  const labels: Record<string, string> = {
    Processing: 'Chờ xử lý',
    Confirm: 'Đã xác nhận',
    Shipped: 'Đang giao',
    Complete: 'Hoàn thành',
    Cancelled: 'Đã huỷ',
  };
  // Valid next states per current status (matches backend isAdminStatusTransitionAllowed)
  const validTransitions: Record<string, FulfillmentStatus[]> = {
    Processing: ['Confirm', 'Complete', 'Cancelled'],
    Confirm: ['Shipped', 'Complete', 'Cancelled'],
    Shipped: ['Complete'],
    Complete: [],
    Cancelled: [],
  };
  const isLocked = status === 'Complete' || status === 'Cancelled';
  const nextOptions = validTransitions[status] || [];

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <select
        value={status}
        disabled={isLocked}
        onChange={(e) => onChange(e.target.value as FulfillmentStatus)}
        className={`appearance-none rounded-full px-3 py-1 pr-7 text-xs font-bold border cursor-pointer 
          disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary-500/30 
          transition-all ${styles[status] || styles.Processing}`}
      >
        <option value={status} className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
          {labels[status] || status}
        </option>
        {nextOptions.map((opt) => (
          <option key={opt} value={opt} className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
            → {labels[opt] || opt}
          </option>
        ))}
      </select>
      {!isLocked && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
          <span className="material-symbols-outlined !text-sm">expand_more</span>
        </div>
      )}
    </div>
  );
};

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onOrderClick, onUpdateStatus, pagination, isLoading = false }) => {
  const page = pagination?.page ?? 1;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const displayTotal = pagination?.total ?? orders.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800 text-xs uppercase text-neutral-500 dark:text-neutral-400 font-semibold">
            <tr>
              <th scope="col" className="px-6 py-3.5">Mã đơn</th>
              <th scope="col" className="px-6 py-3.5">Khách hàng</th>
              <th scope="col" className="px-6 py-3.5">Ngày</th>
              <th scope="col" className="px-6 py-3.5">Tổng</th>
              <th scope="col" className="px-6 py-3.5">Thanh toán</th>
              <th scope="col" className="px-6 py-3.5">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-2.5 w-32" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-3.5 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                </tr>
              ))
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer" onClick={() => onOrderClick(order)}>
                  <td className="px-6 py-4 font-bold text-primary-500 hover:text-primary-600">
                    {order.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {order.customer.avatarUrl ? (
                        <img src={order.customer.avatarUrl} alt={order.customer.fullname} className="h-8 w-8 rounded-full object-cover ring-2 ring-neutral-100 dark:ring-neutral-700" />
                      ) : (
                        <div className={`h-8 w-8 rounded-full ${order.customer.initialsBgColor} flex items-center justify-center text-xs font-bold ${order.customer.initialsTextColor}`}>
                          {order.customer.initials}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-neutral-900 dark:text-white font-medium">{order.customer.fullname}</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">{order.customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-neutral-900 dark:text-white">{order.createdAt}</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{order.time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-neutral-900 dark:text-white font-bold tabular-nums">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusSelect status={order.fulfillmentStatus} onChange={(newStatus) => onUpdateStatus(order.id, newStatus)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 px-6 py-4">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button disabled className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <span className="material-symbols-outlined !text-sm">chevron_left</span>
          </button>
          <button className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-primary-500 px-3 text-white text-sm font-bold">
            {page}
          </button>
          <button disabled className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <span className="material-symbols-outlined !text-sm">chevron_right</span>
          </button>
          <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">Total: {displayTotal}</span>
        </div>
      </div>
    </div>
  );
};

export default OrdersTable;
