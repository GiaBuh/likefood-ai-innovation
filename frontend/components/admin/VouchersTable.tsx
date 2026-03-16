import React from 'react';
import { Voucher } from '../../types';

interface VouchersTableProps {
  vouchers: Voucher[];
  isLoading: boolean;
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
}

const getDiscountText = (voucher: Voucher) => {
  if (voucher.discountType === 'PERCENT') {
    return `${voucher.discountValue}% (Tối đa ${voucher.maxDiscountAmount?.toLocaleString('vi-VN')}đ)`;
  }
  return `${voucher.discountValue.toLocaleString('vi-VN')}đ`;
};

const VouchersTable: React.FC<VouchersTableProps> = ({ vouchers, isLoading, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
        <span className="material-symbols-outlined mb-2 text-4xl text-neutral-400">loyalty</span>
        <p className="text-neutral-500 dark:text-neutral-400">Chưa có voucher nào.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-semibold">Mã Voucher</th>
              <th className="px-6 py-4 font-semibold">Loại</th>
              <th className="px-6 py-4 font-semibold">Mức giảm</th>
              <th className="px-6 py-4 font-semibold">Đơn tối thiểu</th>
              <th className="px-6 py-4 font-semibold">Đã dùng / Giới hạn</th>
              <th className="px-6 py-4 font-semibold">Thời gian</th>
              <th className="px-6 py-4 font-semibold">Trạng thái</th>
              <th className="px-6 py-4 font-semibold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {vouchers.map((voucher) => (
              <tr key={voucher.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-neutral-900 dark:text-white">{voucher.code}</div>
                  <div className="text-xs text-neutral-500">ID: {voucher.id}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    voucher.type === 'SHOP_DISCOUNT' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                  }`}>
                    {voucher.type === 'SHOP_DISCOUNT' ? 'Giảm giá Shop' : 'Miễn phí vận chuyển'}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                  {getDiscountText(voucher)}
                </td>
                <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                  {voucher.minOrderValue.toLocaleString('vi-VN')}đ
                </td>
                <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                  {voucher.usageCount} / {voucher.usageLimit}
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-neutral-600 dark:text-neutral-300">
                    Bắt đầu: {voucher.startTime ? new Date(voucher.startTime).toLocaleString('vi-VN') : 'K/xác định'}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-300">
                    Kết thúc: {voucher.endTime ? new Date(voucher.endTime).toLocaleString('vi-VN') : 'K/xác định'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    voucher.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${voucher.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {voucher.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(voucher)}
                      className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 transition-colors"
                      title="Sửa"
                    >
                      <span className="material-symbols-outlined !text-xl">edit</span>
                    </button>
                    <button
                      onClick={() => onDelete(voucher)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                      title="Xóa"
                    >
                      <span className="material-symbols-outlined !text-xl">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VouchersTable;
