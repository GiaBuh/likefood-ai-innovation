import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../../types';
import { fetchProductsWithQuery } from '../../services/shopApi';

interface BestSellersProps {
  onProductClick?: (product: Product) => void;
}

const BestSellers: React.FC<BestSellersProps> = ({ onProductClick }) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    const fetchBestSellers = async () => {
      setIsLoading(true);
      try {
        const response = await fetchProductsWithQuery({
          page: 1,
          size: 50,
          status: 'ACTIVE',
          bestSeller: true,
        });
        if (!cancelled) {
          setProducts(response.items);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetchBestSellers();
    return () => { cancelled = true; };
  }, []);

  // Extract unique categories from best seller products
  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    products.forEach((p) => {
      const name = p.categoryName || p.category || 'Other';
      if (!cats.has(name)) cats.set(name, name);
    });
    return Array.from(cats.values());
  }, [products]);

  // Filter products by active category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(
      (p) => (p.categoryName || p.category) === activeCategory
    );
  }, [products, activeCategory]);

  // Don't render if no best sellers
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-white dark:bg-neutral-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white">
            {t('landing.bestSellers')}
          </h2>
          <div className="w-16 h-1 bg-primary-500 mx-auto rounded-full mt-3"></div>
        </div>

        {/* Category Tabs */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeCategory === 'all'
                  ? 'bg-primary-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {t('landing.bestSellerAll')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-primary-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-neutral-200 dark:bg-neutral-700"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                  <div className="h-9 bg-neutral-200 dark:bg-neutral-700 rounded-lg mt-3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredProducts.map((product, index) => {
              // Find the best seller variant for this product
              const bsVariant = (product.variants || []).find(v => v.bestSeller);
              const displayPrice = bsVariant ? bsVariant.price : product.price;
              const variantLabel = bsVariant ? `${bsVariant.weightValue || ''}${bsVariant.weightUnit || ''}` : '';
              const soldCount = product.totalSoldCount ?? 0;

              return (
                <div
                  key={product.id}
                  className="group bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-neutral-100 dark:border-neutral-700 cursor-pointer"
                  onClick={() => onProductClick?.(product)}
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-neutral-50 dark:bg-neutral-700/50">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined !text-5xl text-neutral-300 dark:text-neutral-600">
                          inventory_2
                        </span>
                      </div>
                    )}

                    {/* Best Seller Badge - Top 3 */}
                    {index < 3 && (
                      <div className="absolute bottom-0 left-0 right-0">
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold text-center py-1.5 px-2">
                          <span className="flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined !text-sm">star</span>
                            {t('landing.bestSellerBadge')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 sm:p-4">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-2 mb-0.5 group-hover:text-primary-500 transition-colors min-h-[2.5rem]">
                      {product.name}
                      {variantLabel && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal ml-1">({variantLabel})</span>
                      )}
                    </h3>

                    {/* Sold Count */}
                    {soldCount > 0 && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                        {t('landing.bestSellerSold', { count: soldCount, defaultValue: `Đã bán ${soldCount}` })}
                      </p>
                    )}

                    <p className="text-primary-600 dark:text-primary-400 font-bold text-base mb-3">
                      {displayPrice > 0
                        ? `$${displayPrice.toFixed(2)}`
                        : `$${product.variants?.[0]?.price?.toFixed(2) ?? '0.00'}`}
                    </p>

                    {/* Order Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductClick?.(product);
                      }}
                      className="w-full py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.97]"
                    >
                      <span className="material-symbols-outlined !text-base">shopping_cart</span>
                      {t('landing.bestSellerOrder')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default BestSellers;
