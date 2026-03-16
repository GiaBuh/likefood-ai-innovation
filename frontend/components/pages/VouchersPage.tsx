import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Voucher, UserVoucher } from '../../types';
import { fetchActiveVouchers, fetchMyVouchers, claimVoucher } from '../../services/voucherApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const VouchersPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { showError, showSuccess } = useToast();
  
  const [activeVouchers, setActiveVouchers] = useState<Voucher[]>([]);
  const [myVouchers, setMyVouchers] = useState<UserVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch active vouchers (public)
      const visibleVouchers = await fetchActiveVouchers();
      setActiveVouchers(visibleVouchers);
      
      // 2. Fetch user's claimed vouchers (if logged in)
      if (isAuthenticated) {
        const claimed = await fetchMyVouchers();
        setMyVouchers(claimed);
      } else {
        setMyVouchers([]);
      }
    } catch (error) {
      showError('Không thể tải dữ liệu khuyến mãi.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (voucherId: string) => {
    if (!isAuthenticated) {
      // Prompt user to login via URL param or let App.tsx handle it since we don't have direct access here easily
      // We can use window.location or dispatch an event, but adding ?auth=login is easiest.
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('auth', 'login');
      window.history.pushState({}, '', currentUrl);
      // We force a storage event or just reload, but modern React Apps use navigate. 
      // Instead, we can throw an error or just tell user to click login on TopBar.
      showError('Vui lòng đăng nhập để lưu mã.');
      return;
    }

    setClaimingId(voucherId);
    try {
      await claimVoucher(voucherId);
      showSuccess('Lưu voucher thành công!');
      await loadData(); // Refresh the list
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Không thể lưu voucher.');
    } finally {
      setClaimingId(null);
    }
  };

  const isClaimed = (voucherId: string) => {
    return myVouchers.some(uv => uv.voucher.id === voucherId);
  };

  const getDiscountText = (v: Voucher) => {
    if (v.discountType === 'PERCENT') {
      return `Giảm ${v.discountValue}%`;
    }
    return `Giảm ${v.discountValue.toLocaleString('vi-VN')}đ`;
  };

  const shopVouchers = activeVouchers.filter(v => v.type === 'SHOP_DISCOUNT');
  const shippingVouchers = activeVouchers.filter(v => v.type === 'SHIPPING_DISCOUNT');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-neutral-500 font-medium">Đang tải mã khuyến mãi...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-32 min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-4">
            Kho <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600">Khuyến Mãi</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto text-lg">
            Săn ngay các mã giảm giá hấp dẫn và ưu đãi miễn phí vận chuyển để mua sắm trên LikeFood tiết kiệm hơn.
          </p>
        </div>

        {/* SHOP Vouchers */}
        {shopVouchers.length > 0 && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                <span className="material-symbols-outlined !text-xl">local_offer</span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Mã Giảm Giá Shop</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shopVouchers.map(v => (
                <div key={v.id} className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="flex bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4">
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-2xl font-black">{getDiscountText(v)}</h3>
                      <p className="text-orange-100 text-sm font-medium mt-1">Đơn Tối Thiểu {v.minOrderValue.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="writing-vertical text-orange-200 font-bold uppercase tracking-widest text-xs border-l border-orange-300 pl-3">LIKEFOOD</div>
                  </div>
                  
                  <div className="p-5 flex flex-col">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-block px-2.5 py-1 rounded bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold font-mono tracking-wider border border-orange-200 dark:border-orange-500/30">
                          MÃ: {v.code}
                        </span>
                        <span className="text-xs text-neutral-500 font-medium">HSD: {new Date(v.endTime).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 font-medium my-3">
                        {v.discountType === 'PERCENT' && v.maxDiscountAmount 
                          ? `Giảm tối đa ${v.maxDiscountAmount.toLocaleString('vi-VN')}đ` 
                          : 'Ưu đãi cực khủng cho đơn hàng mua sắm'}
                      </p>
                      
                      <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-1.5 mb-2 mt-4 relative overflow-hidden">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, (v.usageCount / v.usageLimit) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium text-right">Đã dùng {Math.floor((v.usageCount / v.usageLimit) * 100)}%</p>
                    </div>
                    
                    <button 
                      onClick={() => handleClaim(v.id)}
                      disabled={isClaimed(v.id) || claimingId === v.id || v.usageCount >= v.usageLimit}
                      className={`w-full mt-4 py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2
                        ${isClaimed(v.id) || v.usageCount >= v.usageLimit
                          ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                          : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md active:scale-[0.98]'
                        }
                      `}
                    >
                      {claimingId === v.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : isClaimed(v.id) ? (
                        <>Đã Lưu <span className="material-symbols-outlined !text-lg">check_circle</span></>
                      ) : v.usageCount >= v.usageLimit ? (
                        'Hết Lượt'
                      ) : (
                        'Lưu Mã'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHIPPING Vouchers */}
        {shippingVouchers.length > 0 && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center">
                <span className="material-symbols-outlined !text-xl">local_shipping</span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Miễn Phí Vận Chuyển</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shippingVouchers.map(v => (
                <div key={v.id} className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="flex bg-gradient-to-r from-emerald-400 to-emerald-500 text-white p-4">
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-2xl font-black">{getDiscountText(v)}</h3>
                      <p className="text-emerald-100 text-sm font-medium mt-1">Đơn Tối Thiểu {v.minOrderValue.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="writing-vertical text-emerald-200 font-bold uppercase tracking-widest text-xs border-l border-emerald-300 pl-3">SHIPPING</div>
                  </div>
                  
                  <div className="p-5 flex flex-col">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono tracking-wider border border-emerald-200 dark:border-emerald-500/30">
                          MÃ: {v.code}
                        </span>
                        <span className="text-xs text-neutral-500 font-medium">HSD: {new Date(v.endTime).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 font-medium my-3">
                        Phí vận chuyển sẽ được giảm trực tiếp vào đơn hàng.
                      </p>
                      
                      <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-1.5 mb-2 mt-4 relative overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, (v.usageCount / v.usageLimit) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium text-right">Đã dùng {Math.floor((v.usageCount / v.usageLimit) * 100)}%</p>
                    </div>
                    
                    <button 
                      onClick={() => handleClaim(v.id)}
                      disabled={isClaimed(v.id) || claimingId === v.id || v.usageCount >= v.usageLimit}
                      className={`w-full mt-4 py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2
                        ${isClaimed(v.id) || v.usageCount >= v.usageLimit
                          ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                          : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md active:scale-[0.98]'
                        }
                      `}
                    >
                      {claimingId === v.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : isClaimed(v.id) ? (
                        <>Đã Lưu <span className="material-symbols-outlined !text-lg">check_circle</span></>
                      ) : v.usageCount >= v.usageLimit ? (
                        'Hết Lượt'
                      ) : (
                        'Lưu Mã'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeVouchers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
            <span className="material-symbols-outlined !text-6xl text-neutral-300 dark:text-neutral-700 mb-4 block">loyalty</span>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Chưa có chương trình khuyến mãi nào</h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-sm">Hiện tại LikeFood chưa có mã giảm giá nào. Bạn vui lòng quay lại sau nhé!</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default VouchersPage;
