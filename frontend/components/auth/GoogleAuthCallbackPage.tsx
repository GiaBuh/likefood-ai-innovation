import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface GoogleAuthCallbackPageProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

const GoogleAuthCallbackPage: React.FC<GoogleAuthCallbackPageProps> = ({ onSuccess, onError }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasCalledRef = useRef(false);

  // Fallback: hard redirect khi success (Navigate có thể không chạy trong một số trường hợp)
  useEffect(() => {
    if (status === 'success') {
      const id = setTimeout(() => {
        window.location.replace('/');
      }, 50);
      return () => clearTimeout(id);
    }
  }, [status]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setErrorMessage('Không nhận được mã xác thực.');
      onError?.('Không nhận được mã xác thực.');
      return;
    }

    // Code dùng 1 lần. Tránh gọi nhiều lần do Strict Mode / re-render
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    let cancelled = false;

    loginWithGoogle(code)
      .then(() => {
        if (cancelled) return;
        onSuccess?.();
        // Redirect đã thực hiện trong loginWithGoogleCallback
        setStatus('success');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        hasCalledRef.current = false;
        setStatus('error');
        const msg = err?.message || 'Đăng nhập Google thất bại.';
        setErrorMessage(msg);
        onError?.(msg);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, loginWithGoogle, navigate, onSuccess, onError]);

  if (status === 'success') {
    return <Navigate to="/" replace />;
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6">
        <p className="text-center text-red-600 dark:text-red-400">{errorMessage}</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="rounded-xl bg-primary px-6 py-2 text-white font-semibold hover:bg-primary-dark transition-colors"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6">
      <span className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-stone-600 dark:text-stone-400">Đang đăng nhập bằng Google...</p>
    </div>
  );
};

export default GoogleAuthCallbackPage;
