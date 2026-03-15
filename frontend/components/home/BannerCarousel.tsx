import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

interface BannerSlide {
  id: number;
  image: string;
  link: string;
  alt: string;
}

const banners: BannerSlide[] = [
  {
    id: 1,
    image: '/banners/banner-freeship.png',
    link: '/shop',
    alt: 'Freeship 0đ - Đặc sản Việt Nam',
  },
  {
    id: 2,
    image: '/banners/banner-combo.png',
    link: '/shop',
    alt: 'Combo tiết kiệm - Giảm đến 30%',
  },
  {
    id: 3,
    image: '/banners/banner-new-arrival.png',
    link: '/shop',
    alt: 'Hàng mới về - Đặc sản 3 miền',
  },
];

const BannerCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const len = banners.length;

  const next = useCallback(() => setCurrent((p) => (p + 1) % len), [len]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + len) % len), [len]);

  // Auto-slide every 4s, pause on hover
  useEffect(() => {
    if (isHovering) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, isHovering]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto pt-4 pb-2">
      <div
        className="relative overflow-hidden rounded-2xl shadow-card-hover group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Slides */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((banner) => (
            <Link
              key={banner.id}
              to={banner.link}
              className="w-full flex-shrink-0"
            >
              <div className="aspect-[24/7] w-full overflow-hidden">
                <img
                  src={banner.image}
                  alt={banner.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Left Arrow */}
        <button
          onClick={(e) => { e.preventDefault(); prev(); }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
          aria-label="Previous banner"
        >
          <span className="material-symbols-outlined !text-2xl">chevron_left</span>
        </button>

        {/* Right Arrow */}
        <button
          onClick={(e) => { e.preventDefault(); next(); }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
          aria-label="Next banner"
        >
          <span className="material-symbols-outlined !text-2xl">chevron_right</span>
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === current
                  ? 'w-8 bg-primary-500 shadow-glow'
                  : 'w-2 bg-white/60 hover:bg-white/90'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BannerCarousel;
