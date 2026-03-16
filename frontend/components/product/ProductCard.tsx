import React from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { t } = useTranslation();
  // Get best discount from variants
  const getDiscount = () => {
    if (!product.variants?.length) return null;
    const discounts = product.variants
      .map(v => v.discountPercent)
      .filter((d): d is number => d != null && d > 0);
    return discounts.length > 0 ? Math.max(...discounts) : null;
  };

  const getPriceDisplay = () => {
    if (product.variants && product.variants.length > 1) {
      const prices = product.variants.map(v => v.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      if (minPrice !== maxPrice) {
        return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
      }
    }
    return `$${product.price.toFixed(2)}`;
  };

  const getOriginalPrice = () => {
    if (!product.variants?.length) return null;
    const variant = product.variants.find(v => v.originalPrice && v.originalPrice > v.price);
    if (variant?.originalPrice) return `$${variant.originalPrice.toFixed(2)}`;
    return null;
  };

  const formatSold = (count?: number) => {
    if (!count || count === 0) return null;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return String(count);
  };

  const discount = getDiscount();
  const originalPrice = getOriginalPrice();
  const soldText = formatSold(product.totalSoldCount);

  return (
    <div
      className="group flex flex-col cursor-pointer bg-white dark:bg-neutral-800 rounded-sm overflow-hidden border border-neutral-100 dark:border-neutral-700 hover:border-primary/30 hover:shadow-lg transition-all duration-200"
      onClick={() => onClick && onClick(product)}
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
        />

        {/* Discount Badge */}
        {discount && discount > 0 && (
          <div className="absolute top-0 right-0 bg-primary text-white text-[11px] font-bold px-2 py-1 rounded-bl-lg">
            -{discount}%
          </div>
        )}

        {/* Best Seller Badge */}
        {product.bestSeller && (
          <div className="absolute top-2 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-r uppercase tracking-wide">
            {t('shop.bestSeller')}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col flex-grow">
        {/* Product Name */}
        <h3 className="text-[13px] text-neutral-800 dark:text-neutral-200 leading-snug line-clamp-2 min-h-[2.4rem] mb-2">
          {product.name}
        </h3>

        {/* Star Rating */}
        {product.averageRating != null && product.averageRating > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
              {product.averageRating}
            </span>
          </div>
        )}

        {/* Price Row */}
        <div className="mt-auto flex items-center justify-between gap-1">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold text-primary whitespace-nowrap">
              {getPriceDisplay()}
            </span>
            {originalPrice && (
              <span className="text-[11px] text-neutral-400 line-through whitespace-nowrap">
                {originalPrice}
              </span>
            )}
          </div>
          {soldText && (
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap flex-shrink-0">
              {t('shop.sold')} {soldText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;