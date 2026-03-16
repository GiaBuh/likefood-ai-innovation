import React, { useState, useRef, useEffect } from 'react';
import { SortOption } from '../../types';

interface CategoryOption {
  id: string;
  name: string;
  icon?: string;
}

interface ProductFilterBarProps {
  currentSort: SortOption;
  onSortChange: (option: SortOption) => void;
  categories: CategoryOption[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  onOpenMobileFilter: () => void;
}

const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  currentSort,
  onSortChange,
  categories,
  activeCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  onOpenMobileFilter
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);

  const sortOptions: SortOption[] = [
    'Bán chạy nhất',
    'Mới nhất',
    'Giá thấp đến cao',
    'Giá cao đến thấp'
  ];

  const handleSortSelect = (option: SortOption) => {
    onSortChange(option);
    setIsSortOpen(false);
  };

  // Slider Logic
  const minPrice = 1;
  const maxPrice = 100;
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  const getPercent = (value: number) => Math.round(((value - minPrice) / (maxPrice - minPrice)) * 100);

  const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(type);
    if ('preventDefault' in e && e.type !== 'touchstart') {
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.min(Math.max(0, (clientX - rect.left) / rect.width), 1);
      const value = Math.round(percent * (maxPrice - minPrice) + minPrice);

      if (isDragging === 'min') {
        const newValue = Math.min(value, priceRange[1] - 5);
        onPriceChange([Math.max(minPrice, newValue), priceRange[1]]);
      } else {
        const newValue = Math.max(value, priceRange[0] + 5);
        onPriceChange([priceRange[0], Math.min(maxPrice, newValue)]);
      }
    };

    const handleUp = () => setIsDragging(null);

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, priceRange, onPriceChange]);

  return (
    <div
      id="product-filter-bar"
      className="sticky top-[72px] z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md py-4 mb-8 flex flex-col gap-4 border-b border-stone-100 dark:border-stone-800 transition-all duration-300"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Đặc sản nổi bật
          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold uppercase hidden sm:inline-block">
            Còn hàng
          </span>
        </h2>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileFilter}
            className="md:hidden flex items-center gap-2 px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg font-bold text-sm text-slate-700 dark:text-stone-300 transition-colors"
          >
            <span className="material-symbols-outlined !text-lg">tune</span>
            <span className="hidden xs:inline">Bộ lọc</span>
          </button>

          {/* Price Range Dropdown (Desktop) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsPriceOpen(!isPriceOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-sm hover:border-primary dark:hover:border-primary/50 transition-colors group"
            >
              <span className="text-sm font-bold text-slate-900 dark:text-white">Giá: ${priceRange[0]} - ${priceRange[1]}</span>
              <span className={`material-symbols-outlined !text-lg text-slate-400 transition-transform duration-200 ${isPriceOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {isPriceOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsPriceOpen(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-100 dark:border-stone-700 p-5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <h4 className="text-sm font-bold mb-6 text-stone-700 dark:text-stone-300">Khoảng giá</h4>
                  <div className="relative h-1.5 w-full bg-slate-200 dark:bg-stone-700 rounded-full mb-8">
                    <div className="absolute h-full bg-primary rounded-full" style={{ left: `${getPercent(priceRange[0])}%`, width: `${getPercent(priceRange[1]) - getPercent(priceRange[0])}%` }}></div>
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 touch-none" style={{ left: `${getPercent(priceRange[0])}%` }} onMouseDown={handleMouseDown('min')} onTouchStart={handleMouseDown('min')}>
                      <div className="size-4 bg-white dark:bg-stone-800 border-2 border-primary rounded-full shadow cursor-ew-resize hover:scale-125 transition-transform"></div>
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 dark:text-stone-300 bg-white dark:bg-stone-900 px-1 rounded shadow-sm">${priceRange[0]}</span>
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 touch-none" style={{ left: `${getPercent(priceRange[1])}%` }} onMouseDown={handleMouseDown('max')} onTouchStart={handleMouseDown('max')}>
                      <div className="size-4 bg-white dark:bg-stone-800 border-2 border-primary rounded-full shadow cursor-ew-resize hover:scale-125 transition-transform"></div>
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 dark:text-stone-300 bg-white dark:bg-stone-900 px-1 rounded shadow-sm">${priceRange[1]}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-sm hover:border-primary dark:hover:border-primary/50 transition-colors group"
            >
              <span className="text-sm text-slate-500 dark:text-stone-400 hidden sm:inline">Sắp xếp:</span>
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
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between group ${currentSort === option ? 'bg-orange-50 dark:bg-orange-900/20 text-primary' : 'text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-primary'}`}
                    >
                      {option}
                      {currentSort === option && <span className="material-symbols-outlined !text-lg text-primary">check</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Categories Row (Scrollable) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => onCategoryChange('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
            activeCategory === 'all'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.name)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              activeCategory === cat.name
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductFilterBar;