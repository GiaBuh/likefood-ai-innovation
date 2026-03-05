import React, { useState } from 'react';
import { SortOption } from '../../types';

interface ProductFilterBarProps {
  currentSort: SortOption;
  onSortChange: (option: SortOption) => void;
  onOpenMobileFilter: () => void;
}

const ProductFilterBar: React.FC<ProductFilterBarProps> = ({ 
  currentSort, 
  onSortChange, 
  onOpenMobileFilter 
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  const sortOptions: SortOption[] = [
    'Best Selling', 
    'Newest Arrivals', 
    'Price: Low to High', 
    'Price: High to Low'
  ];

  const handleSortSelect = (option: SortOption) => {
    onSortChange(option);
    setIsSortOpen(false);
  };

  return (
    <div 
      id="product-filter-bar"
      className="sticky top-20 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm py-3 mb-6 flex flex-wrap items-center justify-between gap-4 -mx-4 px-4 sm:mx-0 sm:px-0 transition-shadow duration-300"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        Featured Specialties
        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold uppercase hidden sm:inline-block">
          In Stock
        </span>
      </h2>
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenMobileFilter}
          className="lg:hidden flex items-center gap-2 px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg font-bold text-sm text-slate-700 dark:text-stone-300 transition-colors"
        >
          <span className="material-symbols-outlined !text-lg">tune</span>
          <span className="hidden xs:inline">Filters</span>
        </button>
        
        {/* Custom Sort Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-sm hover:border-primary dark:hover:border-primary/50 transition-colors group"
          >
            <span className="text-sm text-slate-500 dark:text-stone-400">Sort by:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{currentSort}</span>
            <span className={`material-symbols-outlined !text-lg text-slate-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>

          {isSortOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsSortOpen(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-100 dark:border-stone-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSortSelect(option)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between group ${
                      currentSort === option 
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-primary' 
                        : 'text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-primary'
                    }`}
                  >
                    {option}
                    {currentSort === option && (
                      <span className="material-symbols-outlined !text-lg text-primary">check</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductFilterBar;