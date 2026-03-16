import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserVoucher } from '../../types';
import { fetchMyVouchers } from '../../services/voucherApi';
import { useToast } from '../../contexts/ToastContext';

const VoucherWalletTab: React.FC = () => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const data = await fetchMyVouchers();
      setVouchers(data);
    } catch (error) {
      showError('Không thể tải Ví Voucher.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SAVED': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-600">Khả dụng</span>;
      case 'USED': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-500">Đã dùng</span>;
      case 'EXPIRED': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-500">Hết hạn</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className="text-center py-10">
        <span className="material-symbols-outlined !text-5xl text-neutral-300 dark:text-neutral-700 mb-2">account_balance_wallet</span>
        <p className="text-neutral-500 dark:text-neutral-400">Ví Voucher của bạn đang trống.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-6 pb-6 animate-in fade-in slide-in-from-bottom-2">
      {vouchers.map(uv => (
        <div 
          key={uv.id} 
          className={`flex items-center gap-4 p-4 rounded-xl border ${uv.status === 'SAVED' ? 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700' : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-700/50 opacity-70'}`}
        >
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            uv.voucher.type === 'SHOP_DISCOUNT' ? 'bg-orange-100 text-orange-500' : 'bg-emerald-100 text-emerald-500'
          } ${uv.status !== 'SAVED' && 'grayscale'}`}>
            <span className="material-symbols-outlined !text-2xl">
              {uv.voucher.type === 'SHOP_DISCOUNT' ? 'local_offer' : 'local_shipping'}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-neutral-900 dark:text-white truncate">
                {uv.voucher.type === 'SHOP_DISCOUNT' ? 'Voucher Shop' : 'Voucher Vận Chuyển'}
              </span>
              {getStatusBadge(uv.status)}
            </div>
            <p className="text-sm font-semibold text-primary-500">
              {uv.voucher.discountType === 'PERCENT' ? `Giảm ${uv.voucher.discountValue}%` : `Giảm $${uv.voucher.discountValue}`}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Đơn tối thiểu ${uv.voucher.minOrderValue}</p>
          </div>
          
        </div>
      ))}
    </div>
  );
};

export default VoucherWalletTab;
