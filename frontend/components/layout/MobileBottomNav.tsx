import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

interface MobileBottomNavProps {
  cartCount: number;
  onOpenCart: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ cartCount, onOpenCart }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setVisible(currentY < lastScrollY.current || currentY < 50);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { path: '/', icon: 'home', label: t('common.home') },
    { path: '/shop', icon: 'storefront', label: t('common.shop') },
    { path: '#cart', icon: 'shopping_cart', label: t('common.cart'), badge: cartCount },
    { path: '/about', icon: 'info', label: t('common.about') },
    { path: '/blog', icon: 'article', label: t('common.blog') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-700 lg:hidden transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          if (tab.path === '#cart') {
            return (
              <button
                key="cart"
                onClick={onOpenCart}
                className="relative flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] text-neutral-500 dark:text-neutral-400"
              >
                <span className="material-symbols-outlined !text-xl">{tab.icon}</span>
                <span className="text-[10px] font-semibold">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-0.5 right-1 bg-primary-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </button>
            );
          }
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] transition-colors ${
                isActive(tab.path)
                  ? 'text-primary-500'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              <span className="material-symbols-outlined !text-xl">{tab.icon}</span>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
