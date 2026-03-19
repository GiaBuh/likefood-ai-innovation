import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyVnpayReturn, VnpayReturnResponse } from '../../services/shopApi';

const VnpayReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<VnpayReturnResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const queryString = searchParams.toString();
        if (!queryString) {
          setError('Missing payment parameters');
          setLoading(false);
          return;
        }
        const res = await verifyVnpayReturn(queryString);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">Đang xác minh thanh toán...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined !text-6xl text-red-400">error</span>
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Lỗi xác minh</h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">{error}</p>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
        >
          Xem đơn hàng
        </button>
      </div>
    );
  }

  const isPaid = result?.paid === true;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-500">
      {isPaid ? (
        <>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-500/30">
            <span className="material-symbols-outlined !text-4xl text-white">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">Thanh toán thành công!</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">
            Đơn hàng <strong>{result?.paymentRef}</strong> đã được thanh toán qua VNPay.
          </p>
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center shadow-xl shadow-red-500/30">
            <span className="material-symbols-outlined !text-4xl text-white">cancel</span>
          </div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Thanh toán chưa thành công</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">
            {result?.message || 'Thanh toán VNPay không thành công. Bạn có thể thử lại từ trang đơn hàng.'}
          </p>
        </>
      )}
      <button
        onClick={() => navigate('/orders')}
        className="mt-4 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary-500/20"
      >
        Xem đơn hàng
      </button>
    </div>
  );
};

export default VnpayReturnPage;
