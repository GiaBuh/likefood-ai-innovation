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
      <div className="relative w-full aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Hover Action Buttons */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
          <button className="p-3 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-full shadow-xl text-primary-500 hover:bg-primary hover:text-white transition-colors transform hover:scale-110 active:scale-95">
            <span className="material-symbols-outlined !text-xl">visibility</span>
          </button>
          <button className="p-3 bg-primary text-white backdrop-blur-sm rounded-full shadow-xl hover:bg-primary-600 transition-colors transform hover:scale-110 active:scale-95">
            <span className="material-symbols-outlined !text-xl">shopping_cart</span>
          </button>
        </div>

        {product.isUsShip && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-secondary/90 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1 shadow-sm">
            <span className="material-symbols-outlined !text-xs">flight_takeoff</span>
            {t('product.usShipping')}
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <p className="text-xs font-bold text-primary-500 mb-1.5 uppercase tracking-wide truncate">{product.categoryName || product.category}</p>
        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white group-hover:text-primary transition-colors leading-tight line-clamp-2 min-h-[2.5rem] mb-3">
          {product.name}
        </h3>
        
        <div className="mt-auto flex justify-between items-end">
          <div className="flex flex-col">
             <span className="text-xs text-neutral-400 font-medium mb-0.5">Giá từ</span>
             <span className="text-lg font-black text-primary-600 dark:text-primary-400 whitespace-nowrap">{getPriceDisplay()}</span>
          </div>
          
          {product.location && (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
              <span className="material-symbols-outlined !text-[14px]">location_on</span>
              <span className="truncate max-w-[80px]">{product.location}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;