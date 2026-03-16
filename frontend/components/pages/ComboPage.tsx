import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getPublishedCombos, PublishedCombo, resolveImageUrl } from '../../services/shopApi';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../../contexts/ShopContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFlyToCart } from '../../contexts/FlyToCartContext';
import SEO from '../ui/SEO';
import Skeleton from '../ui/Skeleton';

const ComboPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addComboToCart } = useShop();
  const { isAuthenticated } = useAuth();
  const { triggerFly } = useFlyToCart();
  const [combos, setCombos] = useState<PublishedCombo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCombo, setSelectedCombo] = useState<PublishedCombo | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const data = await getPublishedCombos();
        setCombos(data);
      } catch (err) {
        console.error('Failed to fetch combos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCombos();
  }, []);

  const getComboItemNames = (combo: PublishedCombo): string[] => {
    // Use comboItems if available (new structure)
    if (combo.comboItems && combo.comboItems.length > 0) {
      return combo.comboItems.map(ci => ci.product?.name || 'Sản phẩm');
    }
    // Fallback to legacy items JSON string
    if (combo.items) {
      try { return JSON.parse(combo.items); } catch { return []; }
    }
    return [];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="min-h-screen">
      <SEO title="Combo Deals | LIKEFOOD" description="Khám phá các combo đặc biệt được AI tạo riêng cho bạn" path="/combo" />

      {/* Hero */}
      <section className="relative py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200/30 dark:bg-pink-900/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
              <span className="material-symbols-outlined !text-lg text-purple-600 dark:text-purple-400">auto_awesome</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">AI-Powered Combos</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 dark:text-white mb-4">
              Combo <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Deals</span> Đặc Biệt
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mb-6" />
            <p className="text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Những combo được AI tạo thông minh, kết hợp các sản phẩm tuyệt vời với giá ưu đãi đặc biệt
            </p>
          </div>
        </div>
      </section>

      {/* Combo Grid */}
      <section className="py-10 sm:py-16 lg:py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-3 w-20 rounded-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : combos.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined !text-4xl text-neutral-400">takeout_dining</span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Chưa có combo nào</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6">Combo mới sẽ sớm được cập nhật, hãy quay lại sau nhé!</p>
              <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
                <span className="material-symbols-outlined !text-lg">storefront</span>
                Khám phá cửa hàng
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combos.map((combo) => {
                const itemNames = getComboItemNames(combo);
                return (
                  <div
                    key={combo.id}
                    onClick={() => setSelectedCombo(combo)}
                    className="group rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    {/* Banner */}
                    <div className="relative h-48 bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                      {combo.imageUrl ? (
                        <img src={combo.imageUrl} alt={combo.comboName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                          <span className="text-4xl">🎁</span>
                        </div>
                      )}
                      {/* Discount Badge */}
                      <div className="absolute top-3 right-3 bg-red-500 text-white font-black text-lg px-3 py-1.5 rounded-full transform rotate-6 shadow-lg border-2 border-white">
                        -{combo.discountPercentage}%
                      </div>
                      {/* Hashtag */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                          {combo.hashtag}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-1 group-hover:text-purple-500 transition-colors">
                        {combo.comboName}
                      </h3>
                      <p className="text-pink-500 text-sm font-bold mb-3">"{combo.slogan}"</p>

                      {/* Items Pills */}
                      {itemNames.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {itemNames.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md text-xs">
                              {item}
                            </span>
                          ))}
                          {itemNames.length > 3 && (
                            <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-md text-xs">
                              +{itemNames.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Price */}
                      {combo.comboPrice != null && combo.comboPrice > 0 && (
                        <p className="text-lg font-black text-purple-600 dark:text-purple-400 mb-2">
                          {formatPrice(combo.comboPrice)}
                        </p>
                      )}

                      <p className="text-neutral-500 dark:text-neutral-400 text-sm line-clamp-2">{combo.description}</p>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                          {combo.createdAt ? new Date(combo.createdAt).toLocaleDateString('vi-VN') : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 text-purple-500 text-sm font-bold group-hover:translate-x-1 transition-transform">
                          Xem chi tiết
                          <span className="material-symbols-outlined !text-lg">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Combo Detail Modal */}
      {selectedCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedCombo(null)}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner */}
            <div className="relative h-56 bg-neutral-200 dark:bg-neutral-800">
              {selectedCombo.imageUrl ? (
                <img src={selectedCombo.imageUrl} alt={selectedCombo.comboName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                  <span className="text-6xl">🎁</span>
                </div>
              )}
              <div className="absolute top-4 right-4 bg-red-500 text-white font-black text-xl px-4 py-2 rounded-full transform rotate-12 shadow-lg border-2 border-white">
                -{selectedCombo.discountPercentage}%
              </div>
              <button
                onClick={() => setSelectedCombo(null)}
                className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
              >
                <span className="material-symbols-outlined !text-lg">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full uppercase">
                  {selectedCombo.hashtag}
                </span>
                {selectedCombo.source && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
                    {selectedCombo.source === 'AI' ? '🤖 AI' : '✋ Thủ công'}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-1">{selectedCombo.comboName}</h2>
              <p className="text-pink-500 font-bold mb-4">"{selectedCombo.slogan}"</p>

              {/* Combo Price */}
              {selectedCombo.comboPrice != null && selectedCombo.comboPrice > 0 && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl mb-6">
                  <span className="material-symbols-outlined !text-2xl text-purple-600 dark:text-purple-400">local_offer</span>
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Giá combo</p>
                    <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{formatPrice(selectedCombo.comboPrice)}</p>
                  </div>
                </div>
              )}

              <p className="text-neutral-600 dark:text-neutral-300 text-sm whitespace-pre-wrap mb-6">{selectedCombo.description}</p>

              {/* Products in Combo */}
              <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                Sản phẩm trong Combo ({getComboItemNames(selectedCombo).length})
              </h4>
              <div className="space-y-2 mb-6">
                {selectedCombo.comboItems && selectedCombo.comboItems.length > 0 ? (
                  selectedCombo.comboItems.map((ci, idx) => (
                    <div key={ci.id || idx} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex-shrink-0">
                        {ci.product?.thumbnailKey ? (
                          <img src={resolveImageUrl(ci.product.thumbnailKey)} alt={ci.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-lg">🍜</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-900 dark:text-white text-sm truncate">{ci.product?.name || 'Sản phẩm'}</p>
                        {ci.variant && (
                          <p className="text-xs text-neutral-500">{ci.variant.weightValue} {ci.variant.weightUnit} • {ci.variant.price ? formatPrice(ci.variant.price) : ''}</p>
                        )}
                      </div>
                      <span className="text-xs font-bold text-neutral-400">x{ci.quantity}</span>
                    </div>
                  ))
                ) : (
                  getComboItemNames(selectedCombo).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">🍜</span>
                      </div>
                      <span className="font-bold text-neutral-900 dark:text-white text-sm">{item}</span>
                    </div>
                  ))
                )}
              </div>

              {addedToCart ? (
                <div className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-xl font-bold">
                  <span className="material-symbols-outlined !text-lg">check_circle</span>
                  Đã thêm vào giỏ hàng!
                </div>
              ) : (
                <button
                  onClick={async (e) => {
                    if (!isAuthenticated) {
                      setSelectedCombo(null);
                      navigate('/shop?auth=login');
                      return;
                    }
                    if (!selectedCombo) return;
                    // Trigger fly animation
                    const btn = e.currentTarget as HTMLElement;
                    const rect = btn.getBoundingClientRect();
                    triggerFly(selectedCombo.imageUrl || '', rect);
                    setAddingToCart(true);
                    try {
                      await addComboToCart(selectedCombo.id, 1);
                      setAddedToCart(true);
                      setTimeout(() => {
                        setAddedToCart(false);
                        setSelectedCombo(null);
                      }, 1500);
                    } catch (err) {
                      console.error('Failed to add combo to cart:', err);
                    } finally {
                      setAddingToCart(false);
                    }
                  }}
                  disabled={addingToCart}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition-all ${
                    addingToCart
                      ? 'bg-neutral-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-xl hover:-translate-y-0.5'
                  }`}
                >
                  <span className="material-symbols-outlined !text-lg">add_shopping_cart</span>
                  {addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComboPage;
