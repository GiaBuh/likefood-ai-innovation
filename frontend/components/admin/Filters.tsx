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

const selectClass = `h-10 w-full appearance-none rounded-xl border border-neutral-200 dark:border-neutral-700 
  bg-neutral-50 dark:bg-neutral-800/80 px-4 pr-10 text-sm text-neutral-900 dark:text-white 
  focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200`;

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
}) => {
  const getPlaceHolder = () => {
    switch(view) {
      case 'orders': return 'Tìm Mã đơn, Khách hàng...';
      case 'products': return 'Tìm Tên SP, SKU...';
      case 'customers': return 'Tìm Tên, Email, SĐT...';
    }
  };

  const renderPrimaryFilter = () => {
    const options = view === 'orders'
      ? [{ v: 'All', l: 'Tất cả trạng thái' }, { v: 'Paid', l: 'Đã thanh toán' }, { v: 'Unpaid', l: 'Chưa thanh toán' }, { v: 'Refunded', l: 'Đã hoàn tiền' }]
      : view === 'products'
        ? [{ v: 'All', l: 'Tất cả danh mục' }, ...productCategories.map(c => ({ v: c.name, l: c.name }))]
        : [{ v: 'All', l: 'Tất cả khách hàng' }, { v: 'Active', l: 'Đang hoạt động' }, { v: 'Blocked', l: 'Bị chặn' }, { v: 'Inactive', l: 'Không hoạt động' }];

    return (
      <select value={primaryFilter} onChange={(e) => onPrimaryFilterChange(e.target.value)} className={selectClass}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    );
  };

  const renderSecondaryFilter = () => {
    if (view === 'orders') {
      return (
        <select value={secondaryFilter} onChange={(e) => onSecondaryFilterChange(e.target.value)} className={selectClass}>
          <option value="30">30 ngày qua</option>
          <option value="7">7 ngày qua</option>
          <option value="1">Hôm nay</option>
          <option value="month">Tháng này</option>
        </select>
      );
    } else if (view === 'products') {
      return (
        <select value={secondaryFilter} onChange={(e) => onSecondaryFilterChange(e.target.value)} className={selectClass}>
          <option value="All">Tất cả trạng thái</option>
          <option value="Active">Đang bán</option>
          <option value="Draft">Nháp</option>
          <option value="Archived">Đã lưu trữ</option>
        </select>
      );
    }
    return null;
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
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-sm border border-neutral-100 dark:border-neutral-800 lg:flex-row lg:items-center">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 !text-lg text-neutral-400 dark:text-neutral-500">search</span>
          <input 
            type="text" 
            placeholder={getPlaceHolder()}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 
              bg-neutral-50 dark:bg-neutral-800/80 pl-10 pr-4 text-sm text-neutral-900 dark:text-white 
              placeholder-neutral-400 dark:placeholder-neutral-500 
              focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 
              transition-all duration-200"
          />
        </div>
        {/* Filter Dropdowns */}
        <div className="flex gap-2">
          <div className="relative min-w-[160px]">
            {renderPrimaryFilter()}
            <span className="material-symbols-outlined absolute right-3 top-1/2 pointer-events-none -translate-y-1/2 !text-sm text-neutral-400 dark:text-neutral-500">{getPrimaryIcon()}</span>
          </div>
          {renderSecondaryFilter() && (
            <div className="relative min-w-[160px]">
              {renderSecondaryFilter()}
              <span className="material-symbols-outlined absolute right-3 top-1/2 pointer-events-none -translate-y-1/2 !text-sm text-neutral-400 dark:text-neutral-500">{getSecondaryIcon()}</span>
            </div>
          )}
        </div>
      </div>
      {/* Result count */}
      <div className="flex items-center gap-3">
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 
          bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 
          hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          <span className="material-symbols-outlined !text-xl">filter_list</span>
        </button>
        <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
        <span className="text-sm text-neutral-500 dark:text-neutral-400 tabular-nums whitespace-nowrap">
          {view === 'products' && resultCount > 0
            ? `${(productsPage - 1) * productsPageSize + 1}-${Math.min(productsPage * productsPageSize, resultCount)} / ${resultCount}`
            : `${resultCount === 0 ? 0 : 1}-${resultCount} / ${resultCount}`}
        </span>
      </div>
    </div>
  );
};

export default Filters;
