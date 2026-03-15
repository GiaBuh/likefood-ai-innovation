
import React from 'react';
import { CustomerProfile, CustomerStatus } from '../../types';
import Skeleton from '../ui/Skeleton';

interface CustomersTableProps {
  customers: CustomerProfile[];
  isLoading?: boolean;
}

const CustomerStatusBadge: React.FC<{ status: CustomerStatus }> = ({ status }) => {
  const styles = {
    Active: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400',
    Inactive: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
    Blocked: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400',
  };
  const dots = {
    Active: 'bg-green-500',
    Inactive: 'bg-neutral-400',
    Blocked: 'bg-red-500',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.Active}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dots[status] || dots.Active}`} />
      {status}
    </span>
  );
};

const CustomersTable: React.FC<CustomersTableProps> = ({ customers, isLoading = false }) => {
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(customers.length / pageSize));

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800 text-xs uppercase text-neutral-500 dark:text-neutral-400 font-semibold">
            <tr>
              <th scope="col" className="px-6 py-3.5">Khách hàng</th>
              <th scope="col" className="px-6 py-3.5">Liên hệ</th>
              <th scope="col" className="px-6 py-3.5">Địa điểm</th>
              <th scope="col" className="px-6 py-3.5">Tổng đơn</th>
              <th scope="col" className="px-6 py-3.5">Tổng chi</th>
              <th scope="col" className="px-6 py-3.5">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-2.5 w-16" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-2.5 w-24" />
                    </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-3.5 w-28" /></td>
                  <td className="px-6 py-4 text-center"><Skeleton className="h-3.5 w-8 mx-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-3.5 w-16" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                </tr>
              ))
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {customer.avatarUrl ? (
                        <img src={customer.avatarUrl} alt={customer.fullname} className="h-10 w-10 rounded-full object-cover ring-2 ring-neutral-100 dark:ring-neutral-700" />
                      ) : (
                        <div className={`h-10 w-10 rounded-full ${customer.initialsBgColor} flex items-center justify-center text-sm font-bold ${customer.initialsTextColor}`}>
                          {customer.initials}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-neutral-900 dark:text-white font-bold">{customer.fullname}</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">{customer.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-neutral-900 dark:text-white">{customer.email}</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{customer.phoneNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300 max-w-[200px] truncate">{customer.address}</td>
                  <td className="px-6 py-4 text-center font-bold text-neutral-900 dark:text-white tabular-nums">{customer.totalOrders}</td>
                  <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white tabular-nums">
                    ${customer.totalSpent.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <CustomerStatusBadge status={customer.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 px-6 py-4">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">Page 1 of {totalPages}</span>
        <div className="flex items-center gap-2">
          <button disabled className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <span className="material-symbols-outlined !text-sm">chevron_left</span>
          </button>
          <button className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-primary-500 px-3 text-white text-sm font-bold">1</button>
          <button
            disabled={totalPages <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <span className="material-symbols-outlined !text-sm">chevron_right</span>
          </button>
          <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">Total: {customers.length}</span>
        </div>
      </div>
    </div>
  );
};

export default CustomersTable;
