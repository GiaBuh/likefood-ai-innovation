import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useShop } from '../../contexts/ShopContext';

// Material icon mapping for common food categories
const CATEGORY_ICONS: Record<string, string> = {
  'snacks': 'cookie',
  'dried': 'local_fire_department',
  'sauce': 'water_drop',
  'coffee': 'coffee',
  'tea': 'emoji_food_beverage',
  'noodle': 'ramen_dining',
  'candy': 'cake',
  'spice': 'spa',
  'fruit': 'nutrition',
  'seafood': 'set_meal',
  'rice': 'rice_bowl',
  'drink': 'local_bar',
};

// Color palette for category cards
const CATEGORY_COLORS = [
  { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-500', border: 'border-orange-100 dark:border-orange-900/30', hover: 'hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-500', border: 'border-emerald-100 dark:border-emerald-900/30', hover: 'hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30' },
  { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-500', border: 'border-blue-100 dark:border-blue-900/30', hover: 'hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30' },
  { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-500', border: 'border-purple-100 dark:border-purple-900/30', hover: 'hover:shadow-purple-200/50 dark:hover:shadow-purple-900/30' },
  { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-500', border: 'border-rose-100 dark:border-rose-900/30', hover: 'hover:shadow-rose-200/50 dark:hover:shadow-rose-900/30' },
  { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-500', border: 'border-amber-100 dark:border-amber-900/30', hover: 'hover:shadow-amber-200/50 dark:hover:shadow-amber-900/30' },
  { bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-500', border: 'border-cyan-100 dark:border-cyan-900/30', hover: 'hover:shadow-cyan-200/50 dark:hover:shadow-cyan-900/30' },
  { bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-500', border: 'border-pink-100 dark:border-pink-900/30', hover: 'hover:shadow-pink-200/50 dark:hover:shadow-pink-900/30' },
];

function getIconForCategory(name: string, icon?: string): string {
  if (icon) return icon;
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return value;
  }
  return 'category';
}

const CategoryGrid: React.FC = () => {
  const { t } = useTranslation();
  const { categories } = useShop();

  if (!categories || categories.length === 0) {
    return null; // Hide section if no categories from admin
  }

  return (
    <section className="py-10 bg-white dark:bg-neutral-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-primary-500 rounded-full"></div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white uppercase tracking-tight">
              {t('home.categories')}
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-sm font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
          >
            {t('common.viewAll')}
            <span className="material-symbols-outlined !text-base">chevron_right</span>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((cat, idx) => {
            const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
            const icon = getIconForCategory(cat.name, cat.icon);

            return (
              <Link
                key={cat.id}
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                className={`group flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl border ${color.bg} ${color.border} ${color.hover} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${color.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <span className={`material-symbols-outlined !text-2xl sm:!text-3xl ${color.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 text-center leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
