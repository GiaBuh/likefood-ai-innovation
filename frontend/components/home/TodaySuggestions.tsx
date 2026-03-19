import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { fetchSuggestions } from '../../services/shopApi';

const TodaySuggestions: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const s3Base = (((import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL as string) || '').replace(/\/+$/, '');

  const loadProducts = async (pageNum: number, append = false) => {
    try {
      if (append) setIsLoadingMore(true); else setIsLoading(true);
      const result = await fetchSuggestions(pageNum, 10);
      if (append) {
        setProducts(prev => [...prev, ...result.items]);
      } else {
        setProducts(result.items);
      }
      setHasMore(pageNum < result.meta.totalPages);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadProducts(1);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    void loadProducts(nextPage, true);
  };

  if (isLoading) {
    return (
      <section className="py-6 sm:py-10 lg:py-20 bg-neutral-50 dark:bg-neutral-800/30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-700 animate-pulse">
                <div className="aspect-square bg-neutral-200 dark:bg-neutral-700"></div>
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-6 sm:py-10 lg:py-20 bg-neutral-50 dark:bg-neutral-800/30">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-primary-300"></div>
            <span className="material-symbols-outlined text-primary-500 !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <div className="h-px w-8 bg-primary-300"></div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white">
            {t('landing.todaySuggestions')}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm sm:text-base">
            {t('landing.todaySuggestionsDesc')}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {products.map((product) => {
            const imgSrc = product.image?.startsWith('http')
              ? product.image
              : `${s3Base}/${product.image}`;

            return (
              <Link
                key={product.id}
                to={`/product/${product.slug || product.id}`}
                className="group bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-neutral-100 dark:border-neutral-700 hover:-translate-y-1"
              >
                <div className="aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700 relative">
                  <img
                    src={imgSrc}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {product.variants?.some(v => v.bestSeller) && (
                    <span className="absolute top-2 left-2 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Best Seller
                    </span>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <p className="text-xs font-semibold text-primary-500 mb-1 truncate">
                    {product.categoryName || product.category}
                  </p>
                  <h3 className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-lg text-primary-500">
                      ${product.price.toFixed(2)}
                    </p>
                    {product.totalSoldCount != null && product.totalSoldCount > 0 && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t('bestSellerSold', { count: product.totalSoldCount })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-8 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-700 dark:text-white hover:bg-primary-50 dark:hover:bg-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoadingMore ? (
                <>
                  <span className="material-symbols-outlined !text-lg animate-spin">progress_activity</span>
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined !text-lg">expand_more</span>
                  {t('landing.loadMore')}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default React.memo(TodaySuggestions);
