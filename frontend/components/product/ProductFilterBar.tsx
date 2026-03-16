import React, { useState } from 'react';
import { SortOption } from '../../types';

interface ProductFilterBarProps {
  currentSort: SortOption;
  onSortChange: (option: SortOption) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalProducts: number;
}

const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  currentSort,
  onSortChange,
  currentPage,
  totalPages,
  onPageChange,
  totalProducts,
}) => {
  const [priceDirection, setPriceDirection] = useState<'asc' | 'desc'>('asc');

  const sortTabs: { label: string; value: SortOption }[] = [
    { label: 'Phổ Biến', value: 'Bán chạy nhất' },
    { label: 'Mới Nhất', value: 'Mới nhất' },
    { label: 'Bán Chạy', value: 'Bán chạy nhất' },
  ];

  const isPriceSort = currentSort === 'Giá thấp đến cao' || currentSort === 'Giá cao đến thấp';

  const handlePriceClick = () => {
    if (isPriceSort) {
      // Toggle direction
      const newDir = priceDirection === 'asc' ? 'desc' : 'asc';
      setPriceDirection(newDir);
      onSortChange(newDir === 'asc' ? 'Giá thấp đến cao' : 'Giá cao đến thấp');
    } else {
      onSortChange(priceDirection === 'asc' ? 'Giá thấp đến cao' : 'Giá cao đến thấp');
    }
  };

  return (
    <div className="bg-neutral-50/80 dark:bg-neutral-800/50 rounded-sm px-4 py-3 flex items-center justify-between gap-4 border border-neutral-100 dark:border-neutral-700">
      {/* Left: Sort tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:inline mr-1">Sắp xếp theo</span>
        {sortTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => onSortChange(tab.value)}
            className={`px-4 py-1.5 rounded-sm text-sm font-medium transition-all ${
              currentSort === tab.value && !isPriceSort
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-primary border border-neutral-200 dark:border-neutral-600'
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Price dropdown-like button */}
        <button
          onClick={handlePriceClick}
          className={`px-4 py-1.5 rounded-sm text-sm font-medium transition-all flex items-center gap-1 ${
            isPriceSort
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-primary border border-neutral-200 dark:border-neutral-600'
          }`}
        >
          Giá
          <span className="material-symbols-outlined !text-sm">
            {isPriceSort && priceDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'}
          </span>
        </button>
      </div>

      {/* Right: Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-neutral-500 dark:text-neutral-400 hidden md:inline">
            {currentPage + 1}/{totalPages}
          </span>
          <div className="flex">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 0}
              className="px-2.5 py-1.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 rounded-l-sm hover:bg-neutral-50 dark:hover:bg-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined !text-lg">chevron_left</span>
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="px-2.5 py-1.5 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 border-l-0 text-neutral-600 dark:text-neutral-300 rounded-r-sm hover:bg-neutral-50 dark:hover:bg-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined !text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilterBar;