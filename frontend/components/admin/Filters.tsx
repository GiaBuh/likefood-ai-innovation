import React from 'react';
import { Category } from '../../types';

type ViewType = 'orders' | 'products' | 'customers';

interface FiltersProps {
  view: ViewType;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  primaryFilter: string;
  onPrimaryFilterChange: (value: string) => void;
  secondaryFilter: string;
  onSecondaryFilterChange: (value: string) => void;
  resultCount: number;
  productCategories?: Category[];
  productsPage?: number;
  productsPageSize?: number;
  productsTotalPages?: number;
}

const Filters: React.FC<FiltersProps> = ({
  view,
  searchTerm,
  onSearchChange,
  primaryFilter,
  onPrimaryFilterChange,
  secondaryFilter,
  onSecondaryFilterChange,
  resultCount,
  productCategories = [],
  productsPage = 1,
  productsPageSize = 20,
  productsTotalPages = 1,
}) => {
  const getPlaceHolder = () => {
    switch(view) {
      case 'orders': return 'Search Order ID, Customer...';
      case 'products': return 'Search Product Name, SKU...';
      case 'customers': return 'Search Name, Email, Phone...';
    }
  };

  const renderPrimaryFilter = () => {
    if (view === 'orders') {
      return (
        <select 
          value={primaryFilter}
          onChange={(e) => onPrimaryFilterChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 text-sm text-text-light dark:text-text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Refunded">Refunded</option>
        </select>
      );
    } else if (view === 'products') {
      return (
        <select 
          value={primaryFilter}
          onChange={(e) => onPrimaryFilterChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 text-sm text-text-light dark:text-text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Categories</option>
          {productCategories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      );
    } else {
      return (
        <select 
          value={primaryFilter}
          onChange={(e) => onPrimaryFilterChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 text-sm text-text-light dark:text-text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Customers</option>
          <option value="Active">Active</option>
          <option value="Blocked">Blocked</option>
          <option value="Inactive">Inactive</option>
        </select>
      );
    }
  };

  const renderSecondaryFilter = () => {
    if (view === 'orders') {
      return (
        <select 
          value={secondaryFilter}
          onChange={(e) => onSecondaryFilterChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 text-sm text-text-light dark:text-text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="30">Last 30 Days</option>
          <option value="7">Last 7 Days</option>
          <option value="1">Today</option>
          <option value="month">This Month</option>
        </select>
      );
    } else if (view === 'products') {
      return (
         <select 
          value={secondaryFilter}
          onChange={(e) => onSecondaryFilterChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 text-sm text-text-light dark:text-text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Archived">Archived</option>
        </select>
      );
    } else {
      // For customers maybe Location or nothing
      return null;
    }
  };

  const getPrimaryIcon = () => {
     if (view === 'products') return 'category';
     if (view === 'customers') return 'filter_alt';
     return 'expand_more';
  };

  const getSecondaryIcon = () => {
    if (view === 'orders') return 'calendar_today';
    return 'filter_alt';
  };

  return (
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl bg-surface-light dark:bg-surface-dark p-4 shadow-sm border border-border-light dark:border-border-dark lg:flex-row lg:items-center">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-subtext-light dark:text-subtext-dark">search</span>
          <input 
            type="text" 
            placeholder={getPlaceHolder()}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark pl-10 pr-4 text-sm text-text-light dark:text-text-dark placeholder-subtext-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative min-w-[160px]">
            {renderPrimaryFilter()}
            <span className="material-symbols-outlined absolute right-3 top-1/2 pointer-events-none -translate-y-1/2 text-sm text-subtext-light dark:text-subtext-dark">{getPrimaryIcon()}</span>
          </div>
          {renderSecondaryFilter() && (
            <div className="relative min-w-[160px]">
              {renderSecondaryFilter()}
              <span className="material-symbols-outlined absolute right-3 top-1/2 pointer-events-none -translate-y-1/2 text-sm text-subtext-light dark:text-subtext-dark">{getSecondaryIcon()}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-subtext-light dark:text-subtext-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <span className="material-symbols-outlined">filter_list</span>
        </button>
        <div className="h-6 w-px bg-border-light dark:bg-border-dark mx-2"></div>
        <span className="text-sm text-subtext-light dark:text-subtext-dark">
          {view === 'products' && resultCount > 0
            ? `Showing ${(productsPage - 1) * productsPageSize + 1}-${Math.min(productsPage * productsPageSize, resultCount)} of ${resultCount}`
            : `Showing ${resultCount === 0 ? 0 : 1}-${resultCount} of ${resultCount}`}
        </span>
      </div>
    </div>
  );
};

export default Filters;
