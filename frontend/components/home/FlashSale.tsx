import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  fetchActiveFlashSales,
  FlashSaleEventResponse,
  FlashSaleItemResponse,
} from '../../services/flashSaleApi';

const S3_BASE = (((import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL as string) || '').replace(/\/+$/, '');

function resolveImage(key: string | null | undefined): string {
  if (!key) return '';
  if (key.startsWith('http')) return key;
  return `${S3_BASE}/${key}`;
}

function useCountdown(endTime: string | null) {
  const getTimeLeft = useCallback(() => {
    if (!endTime) return { hours: 0, minutes: 0, seconds: 0 };
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [endTime]);

  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [getTimeLeft]);

  return timeLeft;
}

const FlashSale: React.FC = () => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeEvent, setActiveEvent] = useState<FlashSaleEventResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active flash sale from real API
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchActiveFlashSales()
      .then((events) => {
        if (cancelled) return;
        // Pick the first active event (currently happening)
        const now = Date.now();
        const active = events.find(
          (e) => e.isActive && now >= new Date(e.startTime).getTime() && now <= new Date(e.endTime).getTime()
        );
        setActiveEvent(active || null);
      })
      .catch(() => {
        if (!cancelled) setActiveEvent(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const { hours, minutes, seconds } = useCountdown(activeEvent?.endTime || null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Hide if loading or no active event
  if (isLoading || !activeEvent || activeEvent.items.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="py-6 bg-white dark:bg-neutral-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Flash Sale Title */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined !text-2xl text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                bolt
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-orange-500 uppercase tracking-tight">
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

          {/* View All → Flash Sale Page */}
          <Link
            to="/flash-sale"
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
            {activeEvent.items.map((item: FlashSaleItemResponse) => {
              const isSoldOut = item.stock > 0 && item.soldCount >= item.stock;
              const productUrl = `/product/${item.productSlug || item.productId}?salePrice=${item.salePrice}&originalPrice=${item.originalPrice}&discount=${item.discountPercent}${item.variantId ? `&variantId=${item.variantId}` : ''}`;

              return (
                <Link
                  key={item.id}
                  to={productUrl}
                  className="flex-shrink-0 w-[140px] sm:w-[170px] md:w-[190px] lg:w-[200px] bg-white dark:bg-neutral-800 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-700 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group/card"
                >
                  {/* Image + Badge */}
                  <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                    <img
                      src={resolveImage(item.productImage)}
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Discount Badge */}
                    {item.discountPercent > 0 && (
                      <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-bl-lg shadow-md">
                        -{item.discountPercent}%
                      </div>
                    )}
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-bold text-xs bg-neutral-700/90 px-2 py-1 rounded-full">
                          Đã bán hết
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5 sm:p-3">
                    {/* Price */}
                    <div className="mb-1.5">
                      <p className="text-orange-500 font-extrabold text-base sm:text-lg leading-tight">
                        ${item.salePrice.toFixed(2)}
                      </p>
                      {item.originalPrice > item.salePrice && (
                        <p className="text-neutral-400 dark:text-neutral-500 text-xs line-through">
                          ${item.originalPrice.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Sold Progress Bar */}
                    <div className="relative w-full h-5 sm:h-[22px] bg-orange-100 dark:bg-orange-950/30 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${isSoldOut ? 'bg-neutral-400 dark:bg-neutral-600' : 'bg-gradient-to-r from-orange-500 to-orange-400'}`}
                        style={{ width: `${Math.min(item.soldPercent, 100)}%` }}
                      ></div>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white drop-shadow-sm">
                        {isSoldOut
                          ? 'Đã bán hết'
                          : item.soldPercent > 70
                            ? t('home.flashSaleHot')
                            : `${t('home.flashSaleSold')} ${item.soldCount}`}
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

export default React.memo(FlashSale);
