
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { useFlyToCart } from '../../contexts/FlyToCartContext';
import { fetchProductsWithQuery, fetchCategories } from '../../services/shopApi';
import { Product, Category } from '../../types';
import LanguageSwitcher from '../ui/LanguageSwitcher';

interface HeaderProps {
  onOpenMobileCart: () => void;
  onCheckout: () => void;
  onOpenProfile: () => void;
  onViewOrders: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onGoHome: () => void;
  onGoToAdmin: () => void;
  onOpenProduct?: (productId: string) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  onOpenMobileCart,
  onCheckout,
  onOpenProfile,
  onViewOrders,
  onOpenLogin,
  onOpenRegister,
  onGoHome,
  onGoToAdmin,
  onOpenProduct,
  searchQuery,
  onSearchQueryChange
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const defaultAvatarUrl =
    ((import.meta as any).env?.VITE_DEFAULT_AVATAR_URL as string) ||
    `${(((import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL as string) || '').replace(/\/+$/, '')}/avatars/avatar-default.svg`;
  const { user, logout } = useAuth();
  const { cart, removeFromCart, cartBounce } = useShop();
  const { cartIconRef } = useFlyToCart();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchProducts, setSearchProducts] = useState<Product[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const megaMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalItems = cart.length;
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const recentItems = cart.slice().reverse().slice(0, 3);

  const toggleUserMenu = () => {
    if (window.innerWidth < 1024) {
      setIsUserMenuOpen(!isUserMenuOpen);
    }
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchProducts([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setIsLoadingSearch(true);
      try {
        const response = await fetchProductsWithQuery({
          page: 1,
          size: 10,
          status: 'ACTIVE',
          search: trimmed,
        });
        if (!cancelled) setSearchProducts(response.items);
      } catch {
        if (!cancelled) setSearchProducts([]);
      } finally {
        if (!cancelled) setIsLoadingSearch(false);
      }
    };
    const timer = window.setTimeout(load, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleMegaMenuEnter = () => {
    if (megaMenuTimeout.current) clearTimeout(megaMenuTimeout.current);
    setIsMegaMenuOpen(true);
    if (!categoriesLoaded) {
      fetchCategories().then(cats => {
        setCategories(cats);
        setCategoriesLoaded(true);
      }).catch(() => setCategoriesLoaded(true));
    }
  };

  const handleMegaMenuLeave = () => {
    megaMenuTimeout.current = setTimeout(() => setIsMegaMenuOpen(false), 150);
  };

  const navLinks = [
    { to: '/', label: t('common.home'), key: 'home' },
    { to: '/shop', label: t('common.shop'), key: 'shop', hasMega: true },
    { to: '/combo', label: 'Combo', key: 'combo' },
    { to: '/blog', label: t('common.blog'), key: 'blog' },
  ];

  const isNavActive = (to: string, key: string) => {
    if (key === 'home') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const SearchResultsDropdown = ({ products, loading }: { products: Product[]; loading: boolean }) => (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-modal border border-neutral-100 dark:border-neutral-800 overflow-hidden max-h-80 overflow-y-auto">
      <div className="p-3 border-b border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{t('common.search')}</h3>
      </div>
      {loading ? (
        <div className="p-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">{t('common.loading')}</div>
      ) : products.length === 0 ? (
        <div className="p-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">{t('common.noResults')}</div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                onOpenProduct?.(String(product.id));
                onSearchQueryChange('');
              }}
              className="w-full flex gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left"
            >
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-2">{product.name}</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{product.categoryName || product.category}</p>
                <p className="text-sm font-bold text-primary-500 mt-1">${product.price.toFixed(2)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-card transition-all duration-300"
    >
      {/* ═══ Row 1: Logo + Search + Actions ═══ */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* Mobile Search Overlay Mode */}
          <div className={`h-16 items-center gap-2 ${isMobileSearchOpen ? 'flex md:hidden' : 'hidden'}`}>
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary-500">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                ref={searchInputRef}
                className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder={t('common.search')}
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
              />
              {searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-full pt-2 z-50 mt-1">
                  <SearchResultsDropdown products={searchProducts} loading={isLoadingSearch} />
                </div>
              )}
            </div>
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium whitespace-nowrap"
            >
              {t('common.cancel')}
            </button>
          </div>

          {/* Standard Row 1 */}
          <div className={`h-16 items-center justify-between gap-4 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
            {/* Left: Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity flex-shrink-0"
              aria-label="Go to Home"
            >
              <img src="/logo_likefood.png" alt="LikeFood Logo" className="h-10 w-10 rounded-full object-cover shadow-sm" />
              <span className="font-display font-extrabold text-xl tracking-tight text-primary-500">
                LIKEFOOD
              </span>
            </Link>

            {/* Center: Search Bar */}
            <div className="hidden sm:flex flex-1 max-w-lg mx-4">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500 transition-colors">
                  <span className="material-symbols-outlined !text-xl">search</span>
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all sm:text-sm"
                  placeholder={t('common.search')}
                  type="text"
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                />
                {searchQuery.trim() && (
                  <div className="absolute left-0 right-0 top-full pt-2 z-50">
                    <SearchResultsDropdown products={searchProducts} loading={isLoadingSearch} />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Dark Mode Toggle */}
              <button
                onClick={() => {
                  document.getElementById('theme-fade-overlay')?.remove();
                  const html = document.documentElement;
                  const wasDark = html.classList.contains('dark');
                  const overlay = document.createElement('div');
                  overlay.id = 'theme-fade-overlay';
                  overlay.style.background = wasDark ? '#171717' : '#ffffff';
                  document.body.appendChild(overlay);
                  html.classList.toggle('dark');
                  const nowDark = !wasDark;
                  setIsDark(nowDark);
                  localStorage.setItem('theme', nowDark ? 'dark' : 'light');
                  setTimeout(() => overlay.remove(), 350);
                }}
                className="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors overflow-hidden"
                title={t('common.darkMode')}
              >
                <span className={`material-symbols-outlined !text-lg transition-transform duration-500 ${isDark ? 'rotate-[360deg]' : ''}`}>
                  {isDark ? 'dark_mode' : 'light_mode'}
                </span>
              </button>

              {/* Mobile Search Button */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors sm:hidden"
              >
                <span className="material-symbols-outlined">search</span>
              </button>

              {!user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenLogin}
                    className="px-3 py-2 rounded-lg text-sm font-bold text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
                  >
                    {t('common.login')}
                  </button>
                  <button
                    onClick={onOpenRegister}
                    className="px-3 py-2 rounded-lg text-sm font-bold bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-button whitespace-nowrap"
                  >
                    {t('common.register')}
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Button & Dropdown */}
                  <div className="relative group">
                    <button
                      ref={cartIconRef as React.RefObject<HTMLButtonElement>}
                      onClick={onOpenMobileCart}
                      className={`relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-all duration-300 ${cartBounce ? 'animate-[cartBounce_0.5s_ease]' : ''}`}
                    >
                      <span className="material-symbols-outlined">shopping_basket</span>
                      {totalItems > 0 && (
                        <span className={`absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white shadow-sm transition-transform duration-300 ${cartBounce ? 'animate-[badgePulse_0.4s_ease]' : ''}`}>
                          {totalItems > 9 ? '9+' : totalItems}
                        </span>
                      )}
                    </button>

                    {/* Desktop Hover Dropdown */}
                    <div className="hidden lg:block absolute right-0 top-full pt-2 w-96 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-modal border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                          <h3 className="font-bold text-neutral-900 dark:text-white">{t('cart.title')} ({totalItems})</h3>
                        </div>

                        {cart.length === 0 ? (
                          <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                            <span className="material-symbols-outlined !text-4xl mb-2 opacity-50">shopping_cart_off</span>
                            <p className="text-sm">{t('cart.empty')}</p>
                          </div>
                        ) : (
                          <>
                            <div className="max-h-80 overflow-y-auto scrollbar-hide">
                              {recentItems.map((item) => (
                                <div key={item.backendCartItemId ?? item.cartId ?? item.id} className="flex gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
                                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" loading="lazy" />
                                  </div>
                                  <div className="flex flex-1 flex-col justify-center gap-1 py-1">
                                    <div>
                                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1"><a href="#">{item.name}</a></h3>
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">{item.category}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {t('product.weight')}: <span className="font-bold text-neutral-700 dark:text-neutral-300">{item.weight}</span>
                                      </p>
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {t('product.quantity')}: <span className="font-bold text-neutral-700 dark:text-neutral-300">{item.quantity}</span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col justify-between items-end py-1">
                                    <p className="text-sm font-bold text-primary-500">${(item.price * item.quantity).toFixed(2)}</p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromCart(item.backendCartItemId ?? item.cartId ?? item.id);
                                      }}
                                      className="text-neutral-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                      title={t('common.delete')}
                                    >
                                      <span className="material-symbols-outlined !text-lg">delete</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {cart.length > 3 && (
                                <div className="p-2 text-center text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800">
                                  +{cart.length - 3} {t('cart.items')}...
                                </div>
                              )}
                            </div>
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800">
                              <div className="flex justify-between text-base font-bold text-neutral-900 dark:text-white mb-4">
                                <p>{t('cart.subtotal')}</p>
                                <p>${totalPrice.toFixed(2)}</p>
                              </div>
                              <button
                                onClick={onCheckout}
                                className="w-full flex items-center justify-center rounded-lg bg-primary-500 px-6 py-3 text-base font-bold text-white shadow-button hover:bg-primary-600 transition-colors"
                              >
                                {t('cart.checkout')}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* User Account Dropdown */}
                  <div className="relative group">
                    <button
                      onClick={toggleUserMenu}
                      className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 ring-2 ring-transparent group-hover:ring-primary-500/20 transition-all">
                        <img
                          src={user.avatar}
                          alt="User"
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            const target = event.currentTarget;
                            if (target.src !== defaultAvatarUrl) {
                              target.src = defaultAvatarUrl;
                            }
                          }}
                        />
                      </div>
                    </button>

                    <div
                      className={`absolute right-0 top-full pt-2 w-56 transition-all duration-200 transform z-50 origin-top-right
                        ${isUserMenuOpen
                          ? 'opacity-100 visible translate-y-0 lg:opacity-0 lg:invisible lg:translate-y-2'
                          : 'opacity-0 invisible translate-y-2'}
                        lg:group-hover:opacity-100 lg:group-hover:visible lg:group-hover:translate-y-0
                      `}
                    >
                      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-modal border border-neutral-100 dark:border-neutral-800 overflow-hidden py-2">
                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                          {user.role === 'admin' && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">Admin</span>
                          )}
                        </div>

                        {user.role === 'admin' && onGoToAdmin && (
                          <>
                            <button
                              onClick={() => {
                                closeUserMenu();
                                onGoToAdmin();
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined !text-lg">dashboard</span>
                              {t('common.admin')}
                            </button>
                            <div className="my-1 border-t border-neutral-100 dark:border-neutral-800"></div>
                          </>
                        )}

                        <button
                          onClick={() => {
                            closeUserMenu();
                            onOpenProfile();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-primary-500 transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined !text-lg">person</span>
                          {t('common.profile')}
                        </button>

                        <button
                          onClick={() => {
                            closeUserMenu();
                            onViewOrders();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-primary-500 transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined !text-lg">receipt_long</span>
                          {t('common.myOrders')}
                        </button>

                        <div className="my-1 border-t border-neutral-100 dark:border-neutral-800"></div>

                        <button
                          onClick={() => {
                            closeUserMenu();
                            void logout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined !text-lg">logout</span>
                          {t('common.logout')}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Row 2: Centered Navigation Links (Desktop only) ═══ */}
      <div className="hidden lg:block bg-white/80 dark:bg-neutral-900/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-center gap-0">
            {navLinks.map((link) => {
              const active = isNavActive(link.to, link.key);

              if (link.hasMega) {
                return (
                  <div
                    key={link.key}
                    className="relative"
                    onMouseEnter={handleMegaMenuEnter}
                    onMouseLeave={handleMegaMenuLeave}
                  >
                    <Link
                      to={link.to}
                      className={`
                        relative px-6 py-3 text-[13px] font-bold uppercase tracking-wider transition-colors
                        ${active
                          ? 'text-primary-500'
                          : 'text-neutral-600 dark:text-neutral-300 hover:text-primary-500'
                        }
                      `}
                    >
                      {link.label}
                      <span className={`material-symbols-outlined !text-sm ml-0.5 align-middle transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180' : ''}`}>expand_more</span>
                      {active && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
                      )}
                    </Link>

                    {/* Mega Menu Dropdown */}
                    {isMegaMenuOpen && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
                        onMouseEnter={handleMegaMenuEnter}
                        onMouseLeave={handleMegaMenuLeave}
                      >
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-modal border border-neutral-100 dark:border-neutral-800 p-6 min-w-[480px] animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{t('common.categories', 'Danh mục sản phẩm')}</h3>
                          </div>
                          {categories.length === 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse"></div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {categories.map(cat => (
                                <Link
                                  key={cat.id}
                                  to={`/shop?categoryName=${encodeURIComponent(cat.name)}`}
                                  onClick={() => setIsMegaMenuOpen(false)}
                                  className="flex items-center px-3 py-2.5 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors group"
                                >
                                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-primary-500 transition-colors truncate">{cat.name}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                            <Link
                              to="/shop"
                              onClick={() => setIsMegaMenuOpen(false)}
                              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-500 text-sm font-bold hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors"
                            >
                              {t('common.viewAll', 'Xem tất cả sản phẩm')}
                              <span className="material-symbols-outlined !text-base">arrow_forward</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.key}
                  to={link.to}
                  className={`
                    relative px-6 py-3 text-[13px] font-bold uppercase tracking-wider transition-colors
                    ${active
                      ? 'text-primary-500'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-primary-500'
                    }
                  `}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
