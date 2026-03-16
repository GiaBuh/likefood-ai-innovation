import React, { useState } from 'react';
import { Voucher } from '../../types';

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voucherData: Omit<Voucher, 'id' | 'usageCount'>) => Promise<void>;
  initialData?: Voucher | null;
}

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<Voucher, 'id' | 'usageCount'>>({
    code: '',
    type: 'SHOP_DISCOUNT',
    discountType: 'FIXED_AMOUNT',
    discountValue: 0,
    maxDiscountAmount: 0,
    minOrderValue: 0,
    usageLimit: 100,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
  });

  React.useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        code: initialData.code,
        type: initialData.type,
        discountType: initialData.discountType,
        discountValue: initialData.discountValue,
        maxDiscountAmount: initialData.maxDiscountAmount || 0,
        minOrderValue: initialData.minOrderValue,
        usageLimit: initialData.usageLimit,
        startTime: initialData.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : '',
        endTime: initialData.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : '',
        isActive: initialData.isActive,
      });
    } else if (isOpen && !initialData) {
      setFormData({
        code: '',
        type: 'SHOP_DISCOUNT',
        discountType: 'FIXED_AMOUNT',
        discountValue: 0,
        maxDiscountAmount: 0,
        minOrderValue: 0,
        usageLimit: 100,
        startTime: new Date().toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        isActive: true,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Convert datetime-local strings back to proper ISO strings with UTC
      const submitData = { ...formData };
      if (submitData.startTime) submitData.startTime = new Date(submitData.startTime).toISOString();
      if (submitData.endTime) submitData.endTime = new Date(submitData.endTime).toISOString();
      
      await onSave(submitData);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Lỗi khi lưu voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {initialData ? 'Cập Nhật Voucher' : 'Thêm Voucher Mới'}
          </h2>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Mã Voucher *</label>
              <input
                type="text"
                name="code"
                required
                value={formData.code}
                onChange={handleChange}
                placeholder="Ví dụ: TET2026"
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 uppercase"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Loại Voucher</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="SHOP_DISCOUNT">Giảm giá Shop</option>
                <option value="SHIPPING_DISCOUNT">Miễn phí vận chuyển</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Loại Giảm Giá</label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                <option value="PERCENT">Phần trăm (%)</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Mức Giảm Giá *</label>
              <input
                type="number"
                name="discountValue"
                required
                min="0"
                value={formData.discountValue}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            {formData.discountType === 'PERCENT' && (
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Giảm Tối Đa (VNĐ)</label>
                <input
                  type="number"
                  name="maxDiscountAmount"
                  min="0"
                  value={formData.maxDiscountAmount || 0}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            )}

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Đơn Tối Thiểu (VNĐ) *</label>
              <input
                type="number"
                name="minOrderValue"
                required
                min="0"
                value={formData.minOrderValue}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Số Lượng Giới Hạn *</label>
              <input
                type="number"
                name="usageLimit"
                required
                min="1"
                value={formData.usageLimit}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="col-span-2 sm:col-span-1"></div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Thời Gian Bắt Đầu</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Thời Gian Kết Thúc</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="col-span-2 flex items-center mt-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Kích hoạt ngay
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Đang lưu...
                </>
              ) : (initialData ? 'Cập Nhật' : 'Lưu Voucher')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
