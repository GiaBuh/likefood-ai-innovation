
import React, { useState, useRef, useEffect } from 'react';

interface CategoryOption {
  id: string;
  name: string;
  icon?: string;
}

interface SidebarProps {
  categories: CategoryOption[];
  activeCategory?: string;
  onCategoryChange?: (id: string) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  activeCategory = 'all', 
  onCategoryChange = (_: string) => {},
  priceRange,
  onPriceChange
}) => {
  // Slider Logic
  const minPrice = 1;
  const maxPrice = 100;
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  // Calculate percentage for positioning
  const getPercent = (value: number) => Math.round(((value - minPrice) / (maxPrice - minPrice)) * 100);

  const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    setIsDragging(type);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);
      const value = Math.round(percent * (maxPrice - minPrice) + minPrice);

      if (isDragging === 'min') {
        const newValue = Math.min(value, priceRange[1] - 5); // Minimum gap of 5
        onPriceChange([Math.max(minPrice, newValue), priceRange[1]]);
      } else {
        const newValue = Math.max(value, priceRange[0] + 5); // Minimum gap of 5
        onPriceChange([priceRange[0], Math.min(maxPrice, newValue)]);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, priceRange, onPriceChange]);

  // Touch support
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !sliderRef.current) return;
      
      const touch = e.touches[0];
      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.min(Math.max(0, (touch.clientX - rect.left) / rect.width), 1);
      const value = Math.round(percent * (maxPrice - minPrice) + minPrice);

      if (isDragging === 'min') {
        const newValue = Math.min(value, priceRange[1] - 5);
        onPriceChange([Math.max(minPrice, newValue), priceRange[1]]);
      } else {
        const newValue = Math.max(value, priceRange[0] + 5);
        onPriceChange([priceRange[0], Math.min(maxPrice, newValue)]);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, priceRange, onPriceChange]);

  return (
    <aside className="hidden lg:block w-full lg:w-64 flex-shrink-0 space-y-8 pt-3 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide pb-10">
      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Categories
          </h3>
        </div>
        {/* Scrollable Category List with right padding to prevent scrollbar overlap */}
        <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-3 pt-2 custom-scrollbar">
          {/* All Category Option */}
            <button
              onClick={() => onCategoryChange('all')}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-left ${
                activeCategory === 'all'
                  ? 'bg-green-50 dark:bg-green-900/20 text-primary dark:text-green-300 font-semibold ring-1 ring-green-200 dark:ring-green-900/40'
                  : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-300'
              }`}
            >
              <span>All Products</span>
            </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.name)} // Matching name in Products
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-left ${
                activeCategory === cat.name
                  ? 'bg-green-50 dark:bg-green-900/20 text-primary dark:text-green-300 font-semibold ring-1 ring-green-200 dark:ring-green-900/40'
                  : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-300'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Price Range */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-stone-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Price Range</h3>
        
        {/* Dual Range Slider with increased padding to prevent label clipping */}
        <div className="px-5 pt-6 pb-2">
          <div 
            ref={sliderRef}
            className="relative h-1.5 w-full bg-slate-200 dark:bg-stone-700 rounded-full"
          >
            {/* Active Range Bar */}
            <div 
              className="absolute h-full bg-primary rounded-full transition-none"
              style={{ 
                left: `${getPercent(priceRange[0])}%`, 
                width: `${getPercent(priceRange[1]) - getPercent(priceRange[0])}%` 
              }}
            ></div>
            
            {/* Min Thumb */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 touch-none"
              style={{ left: `${getPercent(priceRange[0])}%` }}
              onMouseDown={handleMouseDown('min')}
              onTouchStart={() => setIsDragging('min')}
            >
              <div className="size-4 bg-white dark:bg-stone-800 border-2 border-primary rounded-full shadow cursor-ew-resize hover:scale-125 transition-transform"></div>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 dark:text-stone-300 bg-white dark:bg-stone-900 px-1 rounded shadow-sm">
                ${priceRange[0]}
              </span>
            </div>
            
            {/* Max Thumb */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 touch-none"
              style={{ left: `${getPercent(priceRange[1])}%` }}
              onMouseDown={handleMouseDown('max')}
              onTouchStart={() => setIsDragging('max')}
            >
              <div className="size-4 bg-white dark:bg-stone-800 border-2 border-primary rounded-full shadow cursor-ew-resize hover:scale-125 transition-transform"></div>
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 dark:text-stone-300 bg-white dark:bg-stone-900 px-1 rounded shadow-sm">
                ${priceRange[1]}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between mt-6 text-xs text-stone-500 font-medium">
             <span>Min: $1</span>
             <span>Max: $100</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
