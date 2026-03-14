import React from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { t } = useTranslation();

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

  return (
    <div
      className="group flex flex-col cursor-pointer bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-neutral-100 dark:border-neutral-700"
      onClick={() => onClick && onClick(product)}
    >
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-700">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>

        <button className="absolute bottom-3 right-3 p-2.5 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 text-primary-500 hover:bg-primary-500 hover:text-white z-10">
          <span className="material-symbols-outlined !text-lg">visibility</span>
        </button>

        {product.isUsShip && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-secondary-500/90 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1 shadow-sm">
            <span className="material-symbols-outlined !text-xs">flight_takeoff</span>
            {t('product.usShipping')}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-primary-500 mb-1 truncate">{product.categoryName || product.category}</p>
        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white group-hover:text-primary-500 transition-colors leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex justify-between items-center mt-2">
          <span className="text-base font-bold text-primary-500 whitespace-nowrap">{getPriceDisplay()}</span>
        </div>
        {product.location && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined !text-sm">location_on</span> {product.location}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;