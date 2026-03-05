
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { fetchProductsWithQuery } from '../../services/shopApi';
import { Product } from '../../types';

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
  const defaultAvatarUrl =
    ((import.meta as any).env?.VITE_DEFAULT_AVATAR_URL as string) ||
    `${(((import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL as string) || '').replace(/\/+$/, '')}/avatars/avatar-default.svg`;
  // Use Contexts
  const { user, logout } = useAuth();
  const { cart, removeFromCart } = useShop();

  // State for mobile click interaction
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchProducts, setSearchProducts] = useState<Product[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Count unique items (length of array) instead of total quantity
  const totalItems = cart.length;

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const recentItems = cart.slice().reverse().slice(0, 3); // Get last 3 added items

  const toggleUserMenu = () => {
    // Only toggle on mobile. On desktop, CSS hover handles it.
    if (window.innerWidth < 1024) {
      setIsUserMenuOpen(!isUserMenuOpen);
    }
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  // Focus input when mobile search opens
  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  // Fetch search results only when user is typing (dropdown shows only when searching)
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

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 w-full bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-green-100 dark:border-stone-800 shadow-sm transition-all duration-300"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Mobile Search Overlay Mode */}
        <div className={`h-20 items-center gap-2 ${isMobileSearchOpen ? 'flex md:hidden' : 'hidden'}`}>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              ref={searchInputRef}
              className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl bg-stone-100 dark:bg-stone-800 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-primary transition-all"
              placeholder="Search for delicacies..."
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
            />
            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full pt-2 z-50 mt-1">
                <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-800 overflow-hidden max-h-72 overflow-y-auto">
                  <div className="p-3 border-b border-stone-100 dark:border-stone-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Search results</h3>
                  </div>
                  {isLoadingSearch ? (
                    <div className="p-6 text-center text-stone-500 dark:text-stone-400 text-sm">Loading...</div>
                  ) : searchProducts.length === 0 ? (
                    <div className="p-6 text-center text-stone-500 dark:text-stone-400 text-sm">No products found</div>
                  ) : (
                    <div className="divide-y divide-stone-100 dark:divide-stone-800">
                      {searchProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            onOpenProduct?.(String(product.id));
                            setIsMobileSearchOpen(false);
                            onSearchQueryChange('');
                          }}
                          className="w-full flex gap-4 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors text-left"
                        >
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700">
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">{product.name}</h4>
                            <p className="text-xs text-stone-500 dark:text-stone-400">{product.categoryName || product.category}</p>
                            <p className="text-sm font-bold text-primary">${product.price.toFixed(2)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-2 text-stone-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white font-medium whitespace-nowrap"
          >
            Cancel
          </button>
        </div>

        {/* Standard Header View */}
        <div className={`h-20 items-center justify-between gap-4 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center gap-2 md:gap-12">
            <Link
              to="/"
              className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
              aria-label="Go to Home"
            >
              {/* Logo PNG Image on the Left */}
              <img src="/logo_likefood.png" alt="LikeFood Logo" className="h-12 w-12 rounded-full object-cover drop-shadow-sm" />
              {/* Brand Name on the Right */}
              <span className="font-display font-extrabold text-2xl tracking-tight text-primary">
                LIKEFOOD
              </span>
            </Link>
          </div>

          <div className="flex flex-1 justify-end gap-2 md:gap-4 items-center">
            {/* Desktop Search */}
            <div className="hidden sm:flex max-w-md flex-1">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 border-none rounded-lg bg-green-50/50 dark:bg-stone-800 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-primary/50 transition-all sm:text-sm"
                  placeholder="Search for delicacies..."
                  type="text"
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                />
                {searchQuery.trim() && (
                  <div className="absolute left-0 right-0 top-full pt-2 z-50">
                    <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-800 overflow-hidden max-h-80 overflow-y-auto">
                      <div className="p-3 border-b border-stone-100 dark:border-stone-800">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Search results</h3>
                      </div>
                      {isLoadingSearch ? (
                        <div className="p-6 text-center text-stone-500 dark:text-stone-400 text-sm">Loading...</div>
                      ) : searchProducts.length === 0 ? (
                        <div className="p-6 text-center text-stone-500 dark:text-stone-400 text-sm">No products found</div>
                      ) : (
                        <div className="divide-y divide-stone-100 dark:divide-stone-800">
                          {searchProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                onOpenProduct?.(String(product.id));
                                onSearchQueryChange('');
                              }}
                              className="w-full flex gap-4 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors text-left"
                            >
                              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700">
                                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">{product.name}</h4>
                                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{product.categoryName || product.category}</p>
                                <p className="text-sm font-bold text-primary mt-1">${product.price.toFixed(2)}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Area */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-2 rounded-lg text-slate-700 hover:bg-green-50 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors sm:hidden"
              >
                <span className="material-symbols-outlined">search</span>
              </button>

              {!user ? (
                // GUEST VIEW: Login & Register Buttons
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenLogin}
                    className="px-3 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap"
                  >
                    Login
                  </button>
                  <button
                    onClick={onOpenRegister}
                    className="px-3 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm shadow-green-500/20 whitespace-nowrap"
                  >
                    Register
                  </button>
                </div>
              ) : (
                // LOGGED IN VIEW: Cart & User Menu
                <>
                  {/* Cart Button & Dropdown */}
                  <div className="relative group">
                    <button
                      onClick={onOpenMobileCart}
                      className="relative p-2 rounded-lg text-slate-700 hover:bg-green-50 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
                    >
                      <span className="material-symbols-outlined">shopping_basket</span>
                      {totalItems > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
                          {totalItems > 9 ? '9+' : totalItems}
                        </span>
                      )}
                    </button>

                    {/* Desktop Hover Dropdown */}
                    <div className="hidden lg:block absolute right-0 top-full pt-2 w-96 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-800 overflow-hidden">
                        <div className="p-4 border-b border-stone-100 dark:border-stone-800">
                          <h3 className="font-bold text-slate-900 dark:text-white">Shopping Cart ({totalItems})</h3>
                        </div>

                        {cart.length === 0 ? (
                          <div className="p-8 text-center text-stone-500 dark:text-stone-400">
                            <span className="material-symbols-outlined !text-4xl mb-2 opacity-50">shopping_cart_off</span>
                            <p className="text-sm">Your cart is empty</p>
                          </div>
                        ) : (
                          <>
                            <div className="max-h-80 overflow-y-auto scrollbar-hide">
                              {recentItems.map((item) => (
                                <div key={item.backendCartItemId ?? item.cartId ?? item.id} className="flex gap-4 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors border-b border-stone-50 dark:border-stone-800/50 last:border-0">
                                  {/* Image */}
                                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="h-full w-full object-cover object-center"
                                    />
                                  </div>

                                  {/* Info Column */}
                                  <div className="flex flex-1 flex-col justify-center gap-1 py-1">
                                    <div>
                                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1"><a href="#">{item.name}</a></h3>
                                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">{item.category}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <p className="text-xs text-stone-500 dark:text-stone-400">
                                        Weight: <span className="font-bold text-slate-700 dark:text-stone-300">{item.weight}</span>
                                      </p>
                                      <p className="text-xs text-stone-500 dark:text-stone-400">
                                        Qty: <span className="font-bold text-slate-700 dark:text-stone-300">{item.quantity}</span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Price & Action Column */}
                                  <div className="flex flex-col justify-between items-end py-1">
                                    <p className="text-sm font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromCart(item.backendCartItemId ?? item.cartId ?? item.id);
                                      }}
                                      className="text-stone-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
                                      title="Remove item"
                                    >
                                      <span className="material-symbols-outlined !text-lg">delete</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {cart.length > 3 && (
                                <div className="p-2 text-center text-xs text-stone-500 border-t border-stone-100 dark:border-stone-800">
                                  and {cart.length - 3} more items...
                                </div>
                              )}
                            </div>
                            <div className="p-4 bg-stone-50 dark:bg-stone-900/50 border-t border-stone-100 dark:border-stone-800">
                              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white mb-4">
                                <p>Subtotal</p>
                                <p>${totalPrice.toFixed(2)}</p>
                              </div>
                              <button
                                onClick={onCheckout}
                                className="w-full flex items-center justify-center rounded-lg border border-transparent bg-primary px-6 py-3 text-base font-bold text-white shadow-sm hover:bg-primary-dark transition-colors"
                              >
                                Checkout Now
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
                      className="p-2 rounded-lg text-slate-700 hover:bg-green-50 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 hidden sm:block ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
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
                      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-800 overflow-hidden py-2">
                        <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 mb-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{user.email}</p>
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
                              Admin Dashboard
                            </button>
                            <div className="my-1 border-t border-stone-100 dark:border-stone-800"></div>
                          </>
                        )}

                        <button
                          onClick={() => {
                            closeUserMenu();
                            onOpenProfile();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-primary transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined !text-lg">person</span>
                          Personal Info
                        </button>

                        <button
                          onClick={() => {
                            closeUserMenu();
                            onViewOrders();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-primary transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined !text-lg">receipt_long</span>
                          Order History
                        </button>

                        <div className="my-1 border-t border-stone-100 dark:border-stone-800"></div>

                        <button
                          onClick={() => {
                            closeUserMenu();
                            void logout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined !text-lg">logout</span>
                          Logout
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
