
import React from 'react';
import { CustomerProfile, CustomerStatus } from '../../types';
import Skeleton from '../ui/Skeleton';

interface CustomersTableProps {
  customers: CustomerProfile[];
  isLoading?: boolean;
}

const CustomerStatusBadge: React.FC<{ status: CustomerStatus }> = ({ status }) => {
  const styles = {
    Active: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    Inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    Blocked: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.Active}`}>
      {status}
    </span>
  );
};

const CustomersTable: React.FC<CustomersTableProps> = ({ customers, isLoading = false }) => {
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(customers.length / pageSize));

  return (
    <div className="overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-subtext-light dark:text-subtext-dark">
          <thead className="bg-background-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark text-xs uppercase text-subtext-light dark:text-subtext-dark font-semibold">
            <tr>
              <th scope="col" className="px-6 py-4">Customer</th>
              <th scope="col" className="px-6 py-4">Contact Info</th>
              <th scope="col" className="px-6 py-4">Location</th>
              <th scope="col" className="px-6 py-4">Total Orders</th>
              <th scope="col" className="px-6 py-4">Total Spent</th>
              <th scope="col" className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {isLoading ? (
               // Loading Skeletons
               [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex flex-col gap-1">
                           <Skeleton className="h-3 w-24" />
                           <Skeleton className="h-2 w-16" />
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col gap-1">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-2 w-24" />
                     </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-3 w-28" /></td>
                  <td className="px-6 py-4 text-center"><Skeleton className="h-3 w-8 mx-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-3 w-16" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                </tr>
               ))
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {customer.avatarUrl ? (
                        <img 
                          src={customer.avatarUrl} 
                          alt={customer.fullname} 
                          className="h-10 w-10 rounded-full object-cover" 
                        />
                      ) : (
                        <div className={`h-10 w-10 rounded-full ${customer.initialsBgColor} flex items-center justify-center text-sm font-bold ${customer.initialsTextColor}`}>
                          {customer.initials}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-text-light dark:text-text-dark font-medium">{customer.fullname}</span>
                        <span className="text-xs text-subtext-light">{customer.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-text-light dark:text-text-dark">{customer.email}</span>
                      <span className="text-xs">{customer.phoneNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{customer.address}</td>
                  <td className="px-6 py-4 text-center">{customer.totalOrders}</td>
                  <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">
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
      <div className="flex items-center justify-between border-t border-border-light dark:border-border-dark px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-subtext-light dark:text-subtext-dark">Page 1 of {totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <button disabled className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-subtext-light dark:text-subtext-dark disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary px-2 text-white text-sm font-medium transition-colors">1</button>
          <button
            disabled={totalPages <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-subtext-light dark:text-subtext-dark disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
          <span className="ml-2 text-sm text-subtext-light dark:text-subtext-dark">Total: {customers.length}</span>
        </div>
      </div>
    </div>
  );
};

export default CustomersTable;
