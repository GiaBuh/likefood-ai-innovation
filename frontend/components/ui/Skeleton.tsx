
import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div 
      className={`relative overflow-hidden bg-stone-200 dark:bg-stone-800 rounded-lg ${className}`}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-stone-700/40 to-transparent" />
    </div>
  );
};

export default Skeleton;