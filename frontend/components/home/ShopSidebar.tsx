import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CategoryOption {
  id: string;
  name: string;
  icon?: string;
}

interface ShopSidebarProps {
  categories: CategoryOption[];
  activeCategory: string;
  onCategoryChange: (name: string) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
}

const ShopSidebar: React.FC<ShopSidebarProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
}) => {
  const { t } = useTranslation();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [minInput, setMinInput] = useState(String(priceRange[0]));
  const [maxInput, setMaxInput] = useState(String(priceRange[1]));

  const visibleCategories = showAllCategories ? categories : categories.slice(0, 8);

  const handleApplyPrice = () => {
    const min = Math.max(0, Number(minInput) || 0);
    const max = Math.max(min + 1, Number(maxInput) || 100);
    onPriceChange([min, max]);
  };

  const handleResetAll = () => {
    onCategoryChange('all');
    setMinInput('1');
    setMaxInput('100');
    onPriceChange([1, 100]);
  };

  return (
    <aside className="w-full lg:w-[200px] flex-shrink-0">
      {/* Category Section */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-3 pb-3 border-b border-neutral-200 dark:border-neutral-700">
          <span className="material-symbols-outlined !text-lg">list</span>
          {t('shop.allCategories')}
        </h3>
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => onCategoryChange('all')}
              className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${activeCategory === 'all'
                  ? 'text-primary font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-primary'
                }`}
            >
              {activeCategory === 'all' && (
                <span className="material-symbols-outlined !text-xs mr-1 align-middle">chevron_right</span>
              )}
              {t('shop.allProducts')}
            </button>
          </li>
          {visibleCategories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => onCategoryChange(cat.name)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${activeCategory === cat.name
                    ? 'text-primary font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-primary'
                  }`}
              >
                {activeCategory === cat.name && (
                  <span className="material-symbols-outlined !text-xs mr-1 align-middle">chevron_right</span>
                )}
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
        {categories.length > 8 && (
          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="mt-2 px-2 text-sm text-neutral-500 hover:text-primary transition-colors flex items-center gap-1"
          >
            {showAllCategories ? t('shop.showLess') : t('shop.showMore')}
            <span className={`material-symbols-outlined !text-sm transition-transform ${showAllCategories ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>
        )}
      </div>

      {/* Price Filter Section */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-3 pb-3 border-b border-neutral-200 dark:border-neutral-700 uppercase">
          <span className="material-symbols-outlined !text-lg">filter_list</span>
          {t('shop.searchFilter')}
        </h3>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{t('shop.priceRange')}</p>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            placeholder={t('shop.priceFrom')}
            className="w-full px-2 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-sm text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-primary"
          />
          <span className="text-neutral-400">—</span>
          <input
            type="number"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            placeholder={t('shop.priceTo')}
            className="w-full px-2 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-sm text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={handleApplyPrice}
          className="w-full py-1.5 bg-primary text-white text-sm font-bold rounded-sm hover:bg-primary-600 transition-colors"
        >
          {t('shop.apply')}
        </button>
      </div>

      {/* Reset Button */}
      <button
        onClick={handleResetAll}
        className="w-full py-2 bg-primary text-white text-sm font-bold rounded-sm hover:bg-primary-600 transition-colors"
      >
        {t('shop.clearAll')}
      </button>
    </aside>
  );
};

export default ShopSidebar;
