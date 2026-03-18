import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyVnpayReturn } from '../../services/shopApi';

const VnpayReturnPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('Đang xác thực kết quả thanh toán VNPay...');

  const rawQuery = useMemo(() => location.search || '', [location.search]);

  useEffect(() => {
    const run = async () => {
      if (!rawQuery || rawQuery.length <= 1) {
        setIsSuccess(false);
        setMessage('Không nhận được dữ liệu trả về từ VNPay.');
        setLoading(false);
        return;
      }

      try {
        const result = await verifyVnpayReturn(rawQuery);
        setIsSuccess(Boolean(result.paid));
        setMessage(
          result.paid
            ? 'Thanh toán VNPay thành công.'
            : result.message || 'Thanh toán chưa hoàn tất. Bạn có thể thanh toán lại trong trang đơn hàng.'
        );
      } catch (error) {
        setIsSuccess(false);
        setMessage(error instanceof Error ? error.message : 'Không thể xác thực thanh toán VNPay.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [rawQuery]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 text-center shadow-lg">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
          <span className="material-symbols-outlined !text-3xl text-primary-500">
            {loading ? 'hourglass_top' : isSuccess ? 'check_circle' : 'error'}
          </span>
        </div>

        <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white">
          {loading ? 'Đang xử lý thanh toán VNPay' : isSuccess ? 'Thanh toán VNPay thành công' : 'Thanh toán VNPay chưa hoàn tất'}
        </h1>

        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">{message}</p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate('/shop')}
            className="flex-1 rounded-xl px-4 py-3 font-bold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Về trang chủ
          </button>
          <button
            onClick={() => navigate('/myorders')}
            className="flex-1 rounded-xl px-4 py-3 font-bold bg-gradient-to-r from-primary-500 to-primary-600 text-white"
          >
            Xem đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default VnpayReturnPage;
