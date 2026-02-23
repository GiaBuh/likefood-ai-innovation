
import React from 'react';
import Skeleton from '../ui/Skeleton';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-3">
      {/* Image Skeleton */}
      <Skeleton className="w-full aspect-[4/5] rounded-xl" />
      
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
