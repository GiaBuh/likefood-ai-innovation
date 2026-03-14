
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { fetchProductsWithQuery } from '../../services/shopApi';
import { Product } from '../../types';
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
  const defaultAvatarUrl =
    ((import.meta as any).env?.VITE_DEFAULT_AVATAR_URL as string) ||
    `${(((import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL as string) || '').replace(/\/+$/, '')}/avatars/avatar-default.svg`;
  const { user, logout } = useAuth();
  const { cart, removeFromCart } = useShop();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchProducts, setSearchProducts] = useState<Product[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
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
      className="fixed top-0 left-0 right-0 z-40 w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-card transition-all duration-300"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Mobile Search Overlay Mode */}
        <div className={`h-20 items-center gap-2 ${isMobileSearchOpen ? 'flex md:hidden' : 'hidden'}`}>
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

        {/* Standard Header View */}
        <div className={`h-20 items-center justify-between gap-4 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center gap-2 md:gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity"
              aria-label="Go to Home"
            >
              <img src="/logo_likefood.png" alt="LikeFood Logo" className="h-11 w-11 rounded-full object-cover shadow-sm" />
              <span className="font-display font-extrabold text-2xl tracking-tight text-primary-500">
                LIKEFOOD
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link to="/" className="px-3 py-2 rounded-lg text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors">
                {t('common.home')}
              </Link>
              <Link to="/shop" className="px-3 py-2 rounded-lg text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors">
                {t('common.shop')}
              </Link>
              <Link to="/about" className="px-3 py-2 rounded-lg text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors">
                {t('common.about')}
              </Link>
              <Link to="/blog" className="px-3 py-2 rounded-lg text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors">
                {t('common.blog')}
              </Link>
            </nav>
          </div>

          <div className="flex flex-1 justify-end gap-2 md:gap-3 items-center">
            {/* Desktop Search */}
            <div className="hidden sm:flex max-w-md flex-1">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500 transition-colors">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all sm:text-sm"
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

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Dark Mode Toggle */}
            <button
              onClick={() => {
                const html = document.documentElement;
                html.classList.toggle('dark');
                localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
              }}
              className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
              title={t('common.darkMode')}
            >
              <span className="material-symbols-outlined !text-lg block dark:hidden">dark_mode</span>
              <span className="material-symbols-outlined !text-lg hidden dark:block">light_mode</span>
            </button>

            {/* Action Area */}
            <div className="flex items-center gap-1.5">
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
                      onClick={onOpenMobileCart}
                      className="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <span className="material-symbols-outlined">shopping_basket</span>
                      {totalItems > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white shadow-sm">
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
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 hidden sm:block ring-2 ring-transparent group-hover:ring-primary-500/20 transition-all">
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
                      <span className="material-symbols-outlined sm:hidden">account_circle</span>
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
    </header>
  );
};

export default Header;
