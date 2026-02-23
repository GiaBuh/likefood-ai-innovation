
import React from 'react';
import { KPIStats } from '../../types';
import Skeleton from '../ui/Skeleton';

interface KPICardsProps {
  data: KPIStats[];
  isLoading?: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-xl bg-surface-light dark:bg-surface-dark p-6 shadow-sm border border-border-light dark:border-border-dark">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {data.map((kpi, index) => (
        <div key={index} className="flex flex-col gap-1 rounded-xl bg-surface-light dark:bg-surface-dark p-6 shadow-sm border border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-subtext-light dark:text-subtext-dark">{kpi.label}</p>
            <span className={`material-symbols-outlined ${kpi.iconColorClass} ${kpi.iconBgClass} p-2 rounded-lg`}>
              {kpi.icon}
            </span>
          </div>
          <p className="text-3xl font-bold text-text-light dark:text-text-dark mt-2">{kpi.value}</p>
          <div className={`flex items-center gap-1 text-sm font-medium ${
            kpi.trendDirection === 'up' 
              ? 'text-green-600 dark:text-green-500' 
              : ['Pending Fulfillment', 'Low Stock', 'Out of Stock'].includes(kpi.label)
                ? 'text-orange-600 dark:text-orange-500'
                : 'text-red-600 dark:text-red-500'
          }`}>
            <span className="material-symbols-outlined text-base">
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
