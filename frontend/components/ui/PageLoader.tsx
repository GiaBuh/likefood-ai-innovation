
import React from 'react';

interface PageLoaderProps {
  message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ message }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900 animate-ping opacity-20" />
        <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-800 animate-pulse" />
        {/* Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/logo_likefood.png"
            alt="Loading"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover animate-pulse"
            draggable={false}
          />
        </div>
      </div>
      {/* Shimmer bar */}
      <div className="relative w-40 h-1.5 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-primary-400/60 to-transparent" />
      </div>
      {message && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium animate-pulse">{message}</p>
      )}
    </div>
  );
};

export default PageLoader;
