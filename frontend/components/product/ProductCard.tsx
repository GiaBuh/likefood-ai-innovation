import React from 'react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  // Logic to determine price display (Range vs Single)
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
      className="group flex flex-col gap-3 cursor-pointer" 
      onClick={() => onClick && onClick(product)}
    >
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
          style={{ backgroundImage: `url('${product.image}')` }}
        />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors"></div>
        
        <button className="absolute bottom-3 right-3 p-2 bg-white dark:bg-stone-800 rounded-full shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 text-primary hover:bg-primary hover:text-white cursor-pointer z-10">
          <span className="material-symbols-outlined">visibility</span>
        </button>
        
        {product.isUsShip && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-secondary/90 backdrop-blur-sm rounded text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1 shadow-sm">
            <span className="material-symbols-outlined !text-xs">flight_takeoff</span>
            US Ship
          </div>
        )}
      </div>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-tight line-clamp-2">
            {product.name}
          </h3>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm font-bold text-primary whitespace-nowrap">{getPriceDisplay()}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-stone-400 mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined !text-sm">location_on</span> {product.location}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;