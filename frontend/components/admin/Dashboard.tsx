
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
      <KPICards data={kpiData} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">Tổng quan doanh thu</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Doanh thu gần đây</p>
            </div>
            <select className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-900 dark:text-white focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
              <option>Năm nay</option>
            </select>
          </div>
          
          {isLoading ? (
            <div className="flex h-64 items-end justify-between gap-4 px-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="w-full rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
              ))}
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-neutral-400 dark:text-neutral-500">
              <span className="material-symbols-outlined !text-5xl mb-3 opacity-40">bar_chart</span>
              <p className="text-sm">Chưa có dữ liệu doanh thu.</p>
            </div>
          ) : (
            <div className="flex h-64 items-end justify-between gap-2 px-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2 w-full group">
                  <div className="relative w-full max-w-[40px] rounded-t-lg bg-primary-50 dark:bg-primary-950/20 group-hover:bg-primary-100 dark:group-hover:bg-primary-950/30 transition-all duration-300" style={{ height: '100%' }}>
                    <div 
                      className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 transition-all duration-500 ease-out group-hover:from-primary-700 group-hover:to-primary-500"
                      style={{ height: `${maxRevenue > 0 ? Math.max(8, (item.value / maxRevenue) * 100) : 8}%` }}
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 dark:bg-neutral-700 text-white text-xs py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-10 shadow-lg">
                      ${item.value}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">Top Products</h3>
            <span className="text-xs font-bold text-primary-500 hover:text-primary-600 cursor-pointer">Xem tất cả</span>
          </div>
          
          <div className="flex flex-col gap-3">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-14" />
                </div>
              ))
            ) : (
              topProducts.slice(0, 4).map((product, i) => (
                <div key={product.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group">
                  <div className="relative">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                      <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <span className="truncate text-sm font-bold text-neutral-900 dark:text-white">{product.name}</span>
                    <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {product.variants.reduce((acc, v) => acc + v.quantity, 0)} còn hàng
                    </span>
                  </div>
                  <span className="text-sm font-bold text-neutral-900 dark:text-white tabular-nums">
                    ${product.variants[0]?.price.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
          <button className="mt-5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 py-2.5 text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            Xem tất cả sản phẩm
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 px-6 py-4">
          <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">Recent Orders</h3>
          <button className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            Lọc
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-xs uppercase text-neutral-500 dark:text-neutral-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Mã đơn</th>
                <th className="px-6 py-3.5">Khách hàng</th>
                <th className="px-6 py-3.5">Ngày</th>
                <th className="px-6 py-3.5">Số tiền</th>
                <th className="px-6 py-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-3.5 w-24" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-3.5 w-14" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  </tr>
                ))
              ) : (
                recentOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors" onClick={() => onOrderClick(order)}>
                    <td className="px-6 py-4 font-bold text-primary-500">{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {order.customer.avatarUrl ? (
                          <img src={order.customer.avatarUrl} className="h-7 w-7 rounded-full" alt="" />
                        ) : (
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${order.customer.initialsBgColor} ${order.customer.initialsTextColor}`}>
                            {order.customer.initials}
                          </div>
                        )}
                        <span className="text-neutral-900 dark:text-white font-medium">{order.customer.fullname}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">{order.createdAt}</td>
                    <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white tabular-nums">${order.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold 
                        ${order.fulfillmentStatus === 'Complete' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 
                          order.fulfillmentStatus === 'Processing' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 
                          order.fulfillmentStatus === 'Confirm' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' :
                          order.fulfillmentStatus === 'Shipped' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' : 
                          'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}`}>
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
