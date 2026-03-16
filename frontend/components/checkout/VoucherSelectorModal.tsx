import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserVoucher } from '../../types';
import { fetchMyVouchers } from '../../services/voucherApi';
import { useToast } from '../../contexts/ToastContext';

interface VoucherSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'SHOP_DISCOUNT' | 'SHIPPING_DISCOUNT';
  subtotal: number;
  currentVoucher: UserVoucher | null;
  onSelect: (voucher: UserVoucher | null) => void;
}

const VoucherSelectorModal: React.FC<VoucherSelectorModalProps> = ({ isOpen, onClose, type, subtotal, currentVoucher, onSelect }) => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserVoucher | null>(currentVoucher);

  useEffect(() => {
    if (isOpen) {
      setSelected(currentVoucher);
      loadVouchers();
    }
  }, [isOpen, currentVoucher]);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const allVouchers = await fetchMyVouchers();
      const filtered = allVouchers.filter(v => v.status === 'SAVED' && v.voucher.type === type);
      setVouchers(filtered);
    } catch (error) {
      showError('Không thể tải danh sách voucher.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleApply = () => {
    onSelect(selected);
    onClose();
  };

  const isEligible = (v: UserVoucher) => subtotal >= v.voucher.minOrderValue;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 transition-all">
      <div className="bg-white dark:bg-neutral-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            {type === 'SHOP_DISCOUNT' ? 'Chọn Voucher Shop' : 'Chọn Voucher Vận Chuyển'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide space-y-4 bg-neutral-50/50 dark:bg-neutral-900">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined !text-5xl text-neutral-300 dark:text-neutral-700 mb-2">loyalty</span>
              <p className="text-neutral-500 dark:text-neutral-400">Bạn chưa có voucher nào cho mục này.</p>
            </div>
          ) : (
            vouchers.map(uv => {
              const eligible = isEligible(uv);
              return (
                <div 
                  key={uv.id} 
                  onClick={() => eligible && setSelected(uv)}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    eligible ? 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-neutral-800' : 'opacity-60 bg-neutral-100 dark:bg-neutral-800/50 border-transparent cursor-not-allowed'
                  } ${selected?.id === uv.id ? 'border-primary-500 shadow-sm shadow-primary-500/10' : 'border-transparent shadow-sm'}`}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    type === 'SHOP_DISCOUNT' ? 'bg-orange-100 text-orange-500' : 'bg-emerald-100 text-emerald-500'
                  }`}>
                    <span className="material-symbols-outlined !text-2xl">{type === 'SHOP_DISCOUNT' ? 'local_offer' : 'local_shipping'}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-neutral-900 dark:text-white">
                      {uv.voucher.discountType === 'PERCENT' ? `Giảm ${uv.voucher.discountValue}%` : `Giảm $${uv.voucher.discountValue}`}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Đơn tối thiểu ${uv.voucher.minOrderValue}</p>
                    {!eligible && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1">Chưa đủ điều kiện</p>
                    )}
                  </div>

                  {/* Radio */}
                  <div className="flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selected?.id === uv.id ? 'border-primary-500' : 'border-neutral-300 dark:border-neutral-600'
                    }`}>
                      {selected?.id === uv.id && <div className="w-3 h-3 bg-primary-500 rounded-full" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-3">
          <button onClick={() => setSelected(null)} className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800">
            Bỏ chọn
          </button>
          <button onClick={handleApply} className="flex-1 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherSelectorModal;
