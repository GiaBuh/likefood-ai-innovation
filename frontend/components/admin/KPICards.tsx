
import React from 'react';
import { KPIStats } from '../../types';
import Skeleton from '../ui/Skeleton';

interface KPICardsProps {
  data: KPIStats[];
  isLoading?: boolean;
}

const accentColors = [
  'from-primary-400 to-primary-600',   // Revenue
  'from-green-400 to-emerald-600',     // Orders
  'from-blue-400 to-blue-600',         // Products
  'from-violet-400 to-purple-600',     // Customers
];

const iconBgs = [
  'bg-primary-50 dark:bg-primary-950/30 text-primary-500',
  'bg-green-50 dark:bg-green-950/30 text-green-500',
  'bg-blue-50 dark:bg-blue-950/30 text-blue-500',
  'bg-violet-50 dark:bg-purple-950/30 text-violet-500',
];

const KPICards: React.FC<KPICardsProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 p-5 shadow-sm border border-neutral-100 dark:border-neutral-800">
            <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-t-2xl" />
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="h-9 w-28 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {data.map((kpi, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 p-5 shadow-sm 
            border border-neutral-100 dark:border-neutral-800 hover:shadow-md hover:border-neutral-200 dark:hover:border-neutral-700 
            transition-all duration-300"
        >
          {/* Top accent gradient line */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentColors[index % accentColors.length]} rounded-t-2xl`} />
          
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{kpi.label}</p>
            <span className={`material-symbols-outlined !text-xl p-2.5 rounded-xl ${iconBgs[index % iconBgs.length]} transition-transform duration-200 group-hover:scale-110`}>
              {kpi.icon}
            </span>
          </div>
          
          <p className="text-3xl font-black text-neutral-900 dark:text-white tabular-nums tracking-tight">
            {kpi.value}
          </p>
          
          <div className={`flex items-center gap-1.5 mt-2 text-sm font-semibold ${
            kpi.trendDirection === 'up'
              ? 'text-green-600 dark:text-green-400' 
              : ['Chờ xử lý', 'Tồn kho thấp', 'Hết hàng'].includes(kpi.label)
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
          }`}>
            <span className="material-symbols-outlined !text-base">
              {kpi.trendDirection === 'up' ? 'trending_up' : 'trending_down'}
            </span>
            <span>{kpi.trend}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
