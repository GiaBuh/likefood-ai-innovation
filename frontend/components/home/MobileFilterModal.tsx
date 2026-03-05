import React, { useState, useRef, useEffect } from 'react';

interface CategoryOption {
  id: string;
  name: string;
  icon?: string;
}

interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  resultCount: number;
}

const MobileFilterModal: React.FC<MobileFilterModalProps> = ({ 
  isOpen, 
  onClose,
  categories,
  priceRange,
  onPriceChange,
  activeCategory,
  onCategoryChange,
  resultCount
}) => {
  // Slider Logic (Duplicated from Sidebar for isolation/modularity)
  const minPrice = 1;
  const maxPrice = 100;
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  // Calculate percentage for positioning
  const getPercent = (value: number) => Math.round(((value - minPrice) / (maxPrice - minPrice)) * 100);

  const handleTouchStart = (type: 'min' | 'max') => (e: React.TouchEvent) => {
    setIsDragging(type);
    // e.preventDefault(); // Sometimes interferes with scroll
  };

  const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    setIsDragging(type);
  };

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging || !sliderRef.current) return;
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

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);

    const handleEnd = () => setIsDragging(null);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, priceRange, onPriceChange]);

  if (!isOpen) return null;

  return (
    <div aria-modal="true" className="fixed inset-0 z-[60] lg:hidden" role="dialog">
      <div 
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="fixed inset-x-0 bottom-0 z-10 w-full max-w-full bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl flex flex-col h-[85vh] transition-transform transform translate-y-0 ring-1 ring-white/10 animate-in slide-in-from-bottom-full duration-300">
        <div className="flex-none px-4 pt-4 pb-2 text-center relative">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-stone-300 dark:bg-stone-700 mb-4"></div>
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Filters</h2>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-stone-400 hover:text-stone-500 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 scrollbar-hide">
          {/* Categories */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider opacity-80">Categories</h3>
            <div className="space-y-3">
              <label className={`flex items-center justify-between p-4 rounded-2xl border ${activeCategory === 'all' ? 'border-primary bg-primary/5' : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30'} cursor-pointer transition-all`}>
                  <span className="font-bold text-lg text-slate-700 dark:text-stone-200">
                    All Products
                  </span>
                  <input 
                    type="radio" 
                    name="category"
                    checked={activeCategory === 'all'}
                    onChange={() => onCategoryChange('all')}
                    className="w-6 h-6 border-stone-300 text-primary focus:ring-primary"
                  />
              </label>

              {categories.map((cat) => (
                <label key={cat.id} className={`flex items-center justify-between p-4 rounded-2xl border ${activeCategory === cat.name ? 'border-primary bg-primary/5' : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30'} cursor-pointer transition-all`}>
                  <span className="font-bold text-lg text-slate-700 dark:text-stone-200">
                    {cat.name}
                  </span>
                  <input 
                    type="radio" 
                    name="category"
                    checked={activeCategory === cat.name}
                    onChange={() => onCategoryChange(cat.name)}
                    className="w-6 h-6 border-stone-300 text-primary focus:ring-primary"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-8 uppercase tracking-wider opacity-80">Price Range</h3>
            <div className="px-2 pt-6 pb-6">
              <div 
                ref={sliderRef}
                className="relative h-2 bg-stone-200 dark:bg-stone-700 rounded-full"
              >
                {/* Active Bar */}
                <div 
                  className="absolute h-full bg-primary rounded-full"
                  style={{ 
                    left: `${getPercent(priceRange[0])}%`, 
                    width: `${getPercent(priceRange[1]) - getPercent(priceRange[0])}%` 
                  }}
                ></div>
                
                {/* Min Thumb */}
                <div 
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-stone-800 border-[3px] border-primary rounded-full shadow-lg flex items-center justify-center z-10 touch-none active:scale-110 transition-transform"
                  style={{ left: `${getPercent(priceRange[0])}%` }}
                  onMouseDown={handleMouseDown('min')}
                  onTouchStart={handleTouchStart('min')}
                >
                </div>
                
                 {/* Max Thumb */}
                <div 
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-stone-800 border-[3px] border-primary rounded-full shadow-lg flex items-center justify-center z-10 touch-none active:scale-110 transition-transform"
                  style={{ left: `${getPercent(priceRange[1])}%` }}
                  onMouseDown={handleMouseDown('max')}
                  onTouchStart={handleTouchStart('max')}
                >
                </div>
              </div>

              <div className="flex justify-between mt-8 font-extrabold text-lg text-slate-700 dark:text-stone-300">
                <span className="px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">${priceRange[0]}</span>
                <span className="px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">${priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Origin */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider opacity-80">Origin</h3>
            <div className="flex flex-wrap gap-3">
              {['Ca Mau', 'Da Lat', 'Nha Trang', 'Tay Ninh'].map((place, index) => (
                <label key={place} className="cursor-pointer">
                  <input type="checkbox" className="peer sr-only" defaultChecked={index === 0} />
                  <span className="inline-block px-5 py-2.5 rounded-full border-2 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 font-bold text-sm peer-checked:bg-primary peer-checked:border-primary peer-checked:text-white hover:border-primary/50 transition-colors">
                    {place}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-none p-6 pt-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 pb-8 sm:pb-6">
          <div className="flex gap-4">
            <button 
              onClick={() => {
                onCategoryChange('all');
                onPriceChange([1, 100]);
              }}
              className="flex-1 py-4 rounded-2xl font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition-colors active:scale-95 transform"
            >
              Reset
            </button>
            <button 
              onClick={onClose}
              className="flex-[2] py-4 rounded-2xl font-bold text-white bg-primary hover:bg-primary-dark shadow-xl shadow-orange-500/20 active:scale-95 transform transition-all flex items-center justify-center gap-2"
            >
              Show {resultCount} Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterModal;