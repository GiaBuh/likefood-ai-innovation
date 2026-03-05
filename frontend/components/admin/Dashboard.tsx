
import React from 'react';
import KPICards from './KPICards';
import { KPIStats, Order, Product } from '../../types';
import Skeleton from '../ui/Skeleton';

interface DashboardProps {
  kpiData: KPIStats[];
  recentOrders: Order[];
  topProducts: Product[];
  onOrderClick: (order: Order) => void;
  isLoading?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ kpiData, recentOrders, topProducts, onOrderClick, isLoading = false }) => {
  const chartData = recentOrders
    .slice(0, 7)
    .reverse()
    .map((order, index) => ({
      label: `#${index + 1}`,
      value: order.totalAmount,
    }));
  const maxRevenue = chartData.reduce((max, item) => Math.max(max, item.value), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Section: KPI Cards */}
      <KPICards data={kpiData} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Middle Left: Revenue Chart (Simulated) */}
        <div className="lg:col-span-2 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Revenue Overview</h3>
            <select className="rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-3 py-1.5 text-xs font-medium text-text-light dark:text-text-dark focus:border-primary focus:outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          
          {isLoading ? (
            <div className="flex h-64 items-end justify-between gap-4 px-2">
                {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} className={`w-full rounded-t-md`} style={{ height: `${Math.random() * 60 + 20}%` }} />
                ))}
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-subtext-light dark:text-subtext-dark">
              No revenue data yet.
            </div>
          ) : (
            <div className="flex h-64 items-end justify-between gap-2 px-2">
                {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2 w-full group">
                    <div className="relative w-full max-w-[40px] rounded-t-md bg-primary/10 group-hover:bg-primary/20 transition-all duration-300" style={{ height: '100%' }}>
                    <div 
                        className="absolute bottom-0 w-full rounded-t-md bg-primary transition-all duration-500 ease-out group-hover:bg-blue-600"
                        style={{ height: `${maxRevenue > 0 ? Math.max(8, (item.value / maxRevenue) * 100) : 8}%` }}
                    ></div>
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-dark text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                        ${item.value}
                    </div>
                    </div>
                    <span className="text-xs font-medium text-subtext-light dark:text-subtext-dark">{item.label}</span>
                </div>
                ))}
            </div>
          )}
        </div>

        {/* Middle Right: Top Products */}
        <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
           <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Top Products</h3>
            <a href="#" className="text-xs font-bold text-primary hover:underline">View All</a>
          </div>
          
          <div className="flex flex-col gap-4">
            {isLoading ? (
                [...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex flex-1 flex-col gap-1">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-2 w-20" />
                        </div>
                        <Skeleton className="h-4 w-12" />
                    </div>
                ))
            ) : (
                topProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark">
                    <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col overflow-hidden">
                    <span className="truncate text-sm font-bold text-text-light dark:text-text-dark">{product.name}</span>
                    <span className="truncate text-xs text-subtext-light dark:text-subtext-dark">{product.variants.reduce((acc, v) => acc + v.quantity, 0)} in stock</span>
                    </div>
                    <div className="text-right">
                    <span className="block text-sm font-bold text-text-light dark:text-text-dark">${product.variants[0]?.price.toFixed(2)}</span>
                    </div>
                </div>
                ))
            )}
          </div>
          <button className="mt-6 w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-2 text-sm font-bold text-subtext-light dark:text-subtext-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            See All Products
          </button>
        </div>
      </div>

      {/* Bottom: Recent Orders */}
      <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm">
        <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark px-6 py-4">
           <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Recent Orders</h3>
           <button className="rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-3 py-1.5 text-xs font-bold text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
             Filter
           </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background-light dark:bg-surface-dark text-xs uppercase text-subtext-light dark:text-subtext-dark font-semibold">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                    <tr key={i}>
                        <td className="px-6 py-4"><Skeleton className="h-3 w-16" /></td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </td>
                        <td className="px-6 py-4"><Skeleton className="h-3 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-3 w-12" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    </tr>
                ))
              ) : (
                  recentOrders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-background-light dark:hover:bg-background-dark/50 cursor-pointer transition-colors" onClick={() => onOrderClick(order)}>
                    <td className="px-6 py-4 font-medium text-primary">{order.id}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                        {order.customer.avatarUrl ? (
                            <img src={order.customer.avatarUrl} className="h-6 w-6 rounded-full" alt="" />
                        ) : (
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${order.customer.initialsBgColor} ${order.customer.initialsTextColor}`}>
                                {order.customer.initials}
                            </div>
                        )}
                        <span className="text-text-light dark:text-text-dark">{order.customer.fullname}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-subtext-light dark:text-subtext-dark">{order.createdAt}</td>
                    <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">${order.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium 
                        ${order.fulfillmentStatus === 'Complete' ? 'bg-green-100 text-green-700' : 
                            order.fulfillmentStatus === 'Processing' ? 'bg-yellow-100 text-yellow-800' : 
                            order.fulfillmentStatus === 'Confirm' ? 'bg-indigo-100 text-indigo-700' :
                            order.fulfillmentStatus === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-800'}`}>
                        {order.fulfillmentStatus}
                        </span>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
