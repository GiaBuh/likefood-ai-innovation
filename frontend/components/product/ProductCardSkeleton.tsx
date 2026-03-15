
import React from 'react';
import Skeleton from '../ui/Skeleton';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-3">
      {/* Image Skeleton with Logo */}
      <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-stone-700/40 to-transparent" />
        {/* Logo watermark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/logo_likefood.png"
            alt=""
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain opacity-[0.12] dark:opacity-[0.08] grayscale"
            draggable={false}
          />
        </div>
      </div>
      
      <div>
        {/* Title Lines */}
        <div className="flex flex-col gap-1.5 mb-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Price Skeleton */}
        <div className="flex justify-between items-center mt-1 mb-2">
          <Skeleton className="h-5 w-1/3" />
        </div>
        
        {/* Location Skeleton */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
