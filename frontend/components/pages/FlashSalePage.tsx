import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import SEO from '../ui/SEO';
import ProductCardSkeleton from '../product/ProductCardSkeleton';
import {
  fetchTodayFlashSales,
  fetchServerTime,
  FlashSaleEventResponse,
  FlashSaleItemResponse,
  FlashSaleSoldUpdate,
} from '../../services/flashSaleApi';
import { getApiBaseUrl } from '../../services/apiClient';
import { useShop } from '../../contexts/ShopContext';

const S3_BASE = (((import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL as string) || '').replace(/\/+$/, '');

function resolveImage(key: string | null | undefined): string {
  if (!key) return '';
  if (key.startsWith('http')) return key;
  return `${S3_BASE}/${key}`;
}

// ─── WebSocket URL builder ───
function getFlashSaleWsUrl(): string {
  const base = getApiBaseUrl();
  if (!base) {
    const loc = window.location;
    return `${loc.protocol}//${loc.host}/ws/flash-sale`;
  }
  const url = new URL(base);
  return `${url.protocol}//${url.host}/ws/flash-sale`;
}

// ─── Server-synced Countdown Hook ───
function useCountdown(endTime: string | null, serverOffset: number) {
  const getTimeLeft = useCallback(() => {
    if (!endTime) return { hours: 0, minutes: 0, seconds: 0, total: 0 };
    const now = Date.now() + serverOffset;
    const diff = new Date(endTime).getTime() - now;
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      total: diff,
    };
  }, [endTime, serverOffset]);

  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [getTimeLeft]);

  return timeLeft;
}

const pad = (n: number) => String(n).padStart(2, '0');

// ─── Time Slot Component ───
const TimeSlot: React.FC<{
  event: FlashSaleEventResponse;
  isActive: boolean;
  onClick: () => void;
  t: any;
}> = ({ event, isActive, onClick, t }) => {
  const startDate = new Date(event.startTime);
  const now = Date.now();
  const isHappening = now >= startDate.getTime() && now <= new Date(event.endTime).getTime();
  const isEnded = now > new Date(event.endTime).getTime();

  const timeLabel = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
  const statusLabel = isHappening
    ? t('flashSalePage.happeningNow')
    : isEnded
      ? t('flashSalePage.ended')
      : t('flashSalePage.upcoming');

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 sm:px-6 py-3 rounded-xl transition-all duration-300 min-w-[80px] ${
        isActive
          ? 'bg-orange-500 text-white shadow-lg scale-105'
          : isHappening
            ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/40'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
      }`}
    >
      <span className="text-lg sm:text-xl font-extrabold">{timeLabel}</span>
      <span className={`text-[10px] sm:text-xs font-semibold ${isActive ? 'text-white/90' : ''}`}>
        {statusLabel}
      </span>
    </button>
  );
};

// ─── Product Card ───
const FlashSaleProductCard: React.FC<{
  item: FlashSaleItemResponse;
  t: any;
  onAddToCart: (item: FlashSaleItemResponse) => void;
  adding: string | null;
}> = ({ item, t, onAddToCart, adding }) => {
  const isSoldOut = item.stock > 0 && item.soldCount >= item.stock;
  const isAdding = adding === item.id;
  const productUrl = `/product/${item.productSlug || item.productId}?salePrice=${item.salePrice}&originalPrice=${item.originalPrice}&discount=${item.discountPercent}${item.variantId ? `&variantId=${item.variantId}` : ''}`;

  return (
    <div className={`group bg-white dark:bg-neutral-800 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-700 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 ${isSoldOut ? 'opacity-60' : ''}`}>
      {/* Image + Badge */}
      <Link to={productUrl} className="block">
        <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700">
          <img
            src={resolveImage(item.productImage)}
            alt={item.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {item.discountPercent > 0 && (
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-bl-lg shadow-md">
              -{item.discountPercent}%
            </div>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-sm bg-orange-500 px-3 py-1 rounded-full">
                {t('flashSalePage.soldOut')}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-2.5 sm:p-3">
        <Link to={productUrl}>
          <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white line-clamp-2 mb-1.5 min-h-[2.5em] group-hover:text-primary-500 transition-colors">
            {item.productName}
          </h3>
        </Link>

        {/* Prices */}
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
        <div className="relative w-full h-5 sm:h-[22px] bg-orange-100 dark:bg-orange-950/30 rounded-full overflow-hidden mb-2">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(item.soldPercent, 100)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white drop-shadow-sm">
            {item.soldPercent > 70
              ? t('flashSalePage.sellingFast')
              : `${t('flashSalePage.sold')} ${item.soldCount}`}
          </span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => !isSoldOut && !isAdding && onAddToCart(item)}
          disabled={isSoldOut || isAdding}
          className={`w-full py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1 ${
            isSoldOut
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
              : isAdding
                ? 'bg-orange-400 text-white cursor-wait animate-pulse'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md active:scale-95'
          }`}
        >
          {isSoldOut
            ? t('flashSalePage.soldOut')
            : isAdding
              ? '...'
              : <><span className="material-symbols-outlined !text-sm">shopping_cart</span>Thêm giỏ hàng</>}
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ───
const FlashSalePage: React.FC = () => {
  const { t } = useTranslation();
  const { products, addToCart } = useShop();
  const [events, setEvents] = useState<FlashSaleEventResponse[]>([]);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [addingId, setAddingId] = useState<string | null>(null);
  const stompClientRef = useRef<Client | null>(null);

  // ─── Fetch data + sync server time ───
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([fetchTodayFlashSales(), fetchServerTime()])
      .then(([data, serverTimeStr]) => {
        if (cancelled) return;
        setEvents(data);

        // Server time sync offset
        const serverTime = new Date(serverTimeStr).getTime();
        const localTime = Date.now();
        setServerOffset(serverTime - localTime);

        // Auto-select active event
        const now = serverTime;
        const activeIdx = data.findIndex(
          (e) => now >= new Date(e.startTime).getTime() && now <= new Date(e.endTime).getTime()
        );
        setSelectedEventIndex(activeIdx >= 0 ? activeIdx : 0);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ─── Level 3: WebSocket real-time subscription ───
  useEffect(() => {
    if (events.length === 0) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(getFlashSaleWsUrl()) as any,
      reconnectDelay: 3000,
      onConnect: () => {
        // Subscribe to all active event topics
        events.forEach((event) => {
          client.subscribe(`/topic/flash-sale/${event.id}`, (message) => {
            try {
              const update: FlashSaleSoldUpdate = JSON.parse(message.body);
              // Update the item's sold data in real-time
              setEvents((prev) =>
                prev.map((evt) => {
                  if (evt.id !== update.eventId) return evt;
                  return {
                    ...evt,
                    items: evt.items.map((item) => {
                      if (item.id !== update.itemId) return item;
                      return {
                        ...item,
                        soldCount: update.soldCount,
                        soldPercent: update.soldPercent,
                      };
                    }),
                  };
                })
              );
            } catch {
              // ignore
            }
          });
        });
      },
      onStompError: (frame) => {
        console.warn('[Flash Sale WS] STOMP error:', frame.headers?.message ?? frame);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      stompClientRef.current = null;
    };
  }, [events.length]); // Re-connect when events change

  // ─── Add to Cart with sale price ───
  const handleAddToCart = useCallback((item: FlashSaleItemResponse) => {
    setAddingId(item.id);
    // Find the real product from shop context
    const realProduct = products.find(p => String(p.id) === String(item.productId));
    if (!realProduct) {
      alert('Sản phẩm không tồn tại');
      setAddingId(null);
      return;
    }

    // Use the specific variantId from flash sale (admin-chosen), fallback to first
    const targetVariantId = item.variantId || realProduct.variants?.[0]?.id;
    const targetVariant = realProduct.variants?.find(v => v.id === targetVariantId) || realProduct.variants?.[0];

    const productWithSalePrice = {
      ...realProduct,
      price: item.salePrice,
      variantId: targetVariant?.id,
      weight: targetVariant?.weight || realProduct.weight,
    };
    addToCart(productWithSalePrice, 1);
    setTimeout(() => setAddingId(null), 600);
  }, [products, addToCart]);

  const selectedEvent = events[selectedEventIndex] || null;
  const { hours, minutes, seconds } = useCountdown(selectedEvent?.endTime || null, serverOffset);

  // Extract unique categories
  const categories = useMemo(() => {
    if (!selectedEvent) return [];
    const cats = new Set<string>();
    selectedEvent.items.forEach((item) => {
      if (item.categoryName) cats.add(item.categoryName);
    });
    return Array.from(cats);
  }, [selectedEvent]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!selectedEvent) return [];
    if (!selectedCategory) return selectedEvent.items;
    return selectedEvent.items.filter((item) => item.categoryName === selectedCategory);
  }, [selectedEvent, selectedCategory]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <SEO title={t('flashSalePage.title')} description={t('flashSalePage.subtitle')} path="/flash-sale" />

      {/* ═══ Hero Banner ═══ */}
      <section className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-orange-500 overflow-hidden">
        <div className="max-w-[1440px] mx-auto">
          {selectedEvent?.bannerUrl ? (
            <img src={resolveImage(selectedEvent.bannerUrl)} alt="Flash Sale Banner"
              className="w-full h-[200px] sm:h-[280px] md:h-[350px] object-cover" />
          ) : (
            <img src="/flash_sale_banner.png" alt="Flash Sale Banner"
              className="w-full h-[200px] sm:h-[280px] md:h-[350px] object-cover" />
          )}
        </div>
      </section>

      {/* ═══ Sticky Header + Countdown ═══ */}
      <section className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 sticky top-[64px] z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined !text-2xl sm:!text-3xl text-orange-500"
                  style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-orange-500 uppercase tracking-tight">
                  {t('flashSalePage.title')}
                </h1>
              </div>

              {selectedEvent && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                    {t('flashSalePage.endsIn')}
                  </span>
                  {[pad(hours), pad(minutes), pad(seconds)].map((val, idx) => (
                    <React.Fragment key={idx}>
                      <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm sm:text-lg font-bold font-mono shadow-md">
                        {val}
                      </span>
                      {idx < 2 && <span className="text-neutral-400 font-bold text-sm">:</span>}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* WebSocket indicator */}
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-green-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                LIVE
              </div>
            </div>

            <Link to="/shop"
              className="text-sm font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors">
              {t('flashSalePage.backToShop')}
              <span className="material-symbols-outlined !text-base">chevron_right</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Time Slots ═══ */}
      {events.length > 1 && (
        <section className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1">
              {events.map((event, idx) => (
                <TimeSlot key={event.id} event={event} isActive={idx === selectedEventIndex}
                  onClick={() => { setSelectedEventIndex(idx); setSelectedCategory(null); }} t={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Category Tabs ═══ */}
      {categories.length > 0 && (
        <section className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  !selectedCategory ? 'bg-orange-500 text-white shadow-button'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}>
                {t('flashSalePage.allCategories')}
              </button>
              {categories.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    selectedCategory === cat ? 'bg-orange-500 text-white shadow-button'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Product Grid ═══ */}
      <section className="py-6 sm:py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined !text-5xl text-orange-400 mb-4 block opacity-50">error</span>
              <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined !text-6xl text-neutral-300 dark:text-neutral-600 mb-4 block">flash_off</span>
              <h2 className="text-lg font-bold text-neutral-700 dark:text-neutral-300 mb-2">{t('flashSalePage.noEvents')}</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{t('flashSalePage.noEventsDesc')}</p>
              <Link to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors shadow-button">
                <span className="material-symbols-outlined !text-lg">storefront</span>
                {t('flashSalePage.backToShop')}
              </Link>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
              <span className="material-symbols-outlined !text-5xl mb-4 opacity-50 block">search_off</span>
              <p>{t('common.noResults')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredItems.map((item) => (
                <FlashSaleProductCard key={item.id} item={item} t={t}
                  onAddToCart={handleAddToCart} adding={addingId} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FlashSalePage;
