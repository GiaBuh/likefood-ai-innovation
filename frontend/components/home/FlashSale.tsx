import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useShop } from '../../contexts/ShopContext';
import { Product } from '../../types';

// Seeded random for consistent sold amounts per product
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function useCountdown() {
  const getTimeLeft = useCallback(() => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const diff = endOfDay.getTime() - now.getTime();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, []);

  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [getTimeLeft]);

  return timeLeft;
}

function getDiscount(product: Product): number {
  // Generate a consistent discount (15%-50%) based on product ID
  const id = typeof product.id === 'number' ? product.id : parseInt(product.id, 10) || 0;
  return Math.floor(15 + seededRandom(id + 7) * 35);
}

function getOriginalPrice(product: Product, discount: number): number {
  return Math.round((product.price / (1 - discount / 100)) * 100) / 100;
}

function getSoldCount(product: Product): number {
  const id = typeof product.id === 'number' ? product.id : parseInt(product.id, 10) || 0;
  return Math.floor(20 + seededRandom(id + 3) * 180);
}

function getSoldPercent(product: Product): number {
  const id = typeof product.id === 'number' ? product.id : parseInt(product.id, 10) || 0;
  return Math.floor(35 + seededRandom(id + 11) * 60);
}

const FlashSale: React.FC = () => {
  const { t } = useTranslation();
  const { products } = useShop();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { hours, minutes, seconds } = useCountdown();

  // Get active products for flash sale (take up to 12)
  const flashProducts = products
    .filter(p => p.status === 'Active')
    .slice(0, 12);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Hide if no products
  if (flashProducts.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="py-6 bg-white dark:bg-neutral-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Flash Sale Title */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined !text-2xl text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                bolt
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-red-500 uppercase tracking-tight">
                {t('home.flashSaleTitle')}
              </h2>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                {t('home.flashSaleEndsIn')}
              </span>
              {[pad(hours), pad(minutes), pad(seconds)].map((val, idx) => (
                <React.Fragment key={idx}>
                  <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm sm:text-base font-bold font-mono shadow-md">
                    {val}
                  </span>
                  {idx < 2 && <span className="text-neutral-400 font-bold text-sm">:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* View All */}
          <Link
            to="/shop"
            className="text-sm font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
          >
            {t('home.flashSaleViewAll')}
            <span className="material-symbols-outlined !text-base">chevron_right</span>
          </Link>
        </div>

        {/* Product Carousel */}
        <div className="relative group">
          {/* Scroll container */}
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {flashProducts.map((product) => {
              const discount = getDiscount(product);
              const originalPrice = getOriginalPrice(product, discount);
              const soldCount = getSoldCount(product);
              const soldPercent = getSoldPercent(product);

              return (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="flex-shrink-0 w-[140px] sm:w-[170px] md:w-[190px] lg:w-[200px] bg-white dark:bg-neutral-800 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-700 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group/card"
                >
                  {/* Image + Badge */}
                  <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Discount Badge */}
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-bl-lg shadow-md">
                      -{discount}%
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2.5 sm:p-3">
                    {/* Price */}
                    <div className="mb-1.5">
                      <p className="text-red-500 font-extrabold text-base sm:text-lg leading-tight">
                        ${product.price.toFixed(2)}
                      </p>
                      <p className="text-neutral-400 dark:text-neutral-500 text-xs line-through">
                        ${originalPrice.toFixed(2)}
                      </p>
                    </div>

                    {/* Sold Progress Bar */}
                    <div className="relative w-full h-5 sm:h-[22px] bg-red-100 dark:bg-red-950/30 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-1000"
                        style={{ width: `${soldPercent}%` }}
                      ></div>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white drop-shadow-sm">
                        {soldPercent > 70 ? t('home.flashSaleHot') : `${t('home.flashSaleSold')} ${soldCount}`}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/3 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
            aria-label="Previous"
          >
            <span className="material-symbols-outlined !text-xl">chevron_left</span>
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/3 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
            aria-label="Next"
          >
            <span className="material-symbols-outlined !text-xl">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
