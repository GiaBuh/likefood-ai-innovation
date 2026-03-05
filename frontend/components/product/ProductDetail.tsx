import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../../types';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onAddToCart, onBuyNow }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // State for selected variant (defaults to the one matching base price/weight or first one)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(() => {
    if (product.variants && product.variants.length > 0) {
      // Find the variant that matches the main product display price/weight if possible, otherwise first
      return product.variants.find(v => v.price === product.price) || product.variants[0];
    }
    // Fallback if no variants defined (legacy/error safety)
    return { id: 'default', weight: product.weight, price: product.price };
  });

  // Reset selected variant when product changes
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants.find(v => v.price === product.price) || product.variants[0]);
    } else {
      setSelectedVariant({ id: 'default', weight: product.weight, price: product.price });
    }
    setQuantity(1);
    setActiveImageIndex(0);
  }, [product]);

  // Use the 'images' array if it exists, otherwise fallback to single 'image' wrapped in array
  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAddToCart = () => {
    // Create a product object that represents this specific selected variant
    const productToAdd = {
      ...product,
      price: selectedVariant.price,
      weight: selectedVariant.weight,
      variantId: selectedVariant.id,
    };
    onAddToCart(productToAdd, quantity);
  };

  const handleBuyNow = () => {
    const productToAdd = {
      ...product,
      price: selectedVariant.price,
      weight: selectedVariant.weight,
      variantId: selectedVariant.id,
    };
    onBuyNow(productToAdd, quantity);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Navigation & Breadcrumbs */}
      <div className="mb-6 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 hover:text-primary transition-colors font-semibold"
        >
          <span className="material-symbols-outlined !text-lg">arrow_back</span>
          Back to Shop
        </button>
        <span>/</span>
        <span className="text-stone-900 dark:text-stone-200 font-medium truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div 
            className="relative aspect-[4/5] sm:aspect-square w-full rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 cursor-zoom-in group shadow-sm border border-stone-200 dark:border-stone-700"
            onClick={() => setIsLightboxOpen(true)}
          >
            <img 
              src={images[activeImageIndex]} 
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/60 backdrop-blur text-stone-700 dark:text-white p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined">fullscreen</span>
            </div>
            {product.isUsShip && (
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-secondary/90 backdrop-blur-sm rounded-lg text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1 shadow-md">
                <span className="material-symbols-outlined !text-sm">flight_takeoff</span>
                US Ship
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 transition-all snap-start ${
                    activeImageIndex === idx 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-transparent hover:border-stone-300 dark:hover:border-stone-600 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="text-primary font-bold text-sm uppercase tracking-wider">{product.category}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">${selectedVariant.price.toFixed(2)}</span>
            <div className="h-6 w-px bg-stone-300 dark:bg-stone-700"></div>
            <div className="flex items-center gap-1 text-yellow-500">
              <span className="material-symbols-outlined fill-current !text-xl">star</span>
              <span className="material-symbols-outlined fill-current !text-xl">star</span>
              <span className="material-symbols-outlined fill-current !text-xl">star</span>
              <span className="material-symbols-outlined fill-current !text-xl">star</span>
              <span className="material-symbols-outlined fill-current !text-xl">star_half</span>
              <span className="text-stone-500 dark:text-stone-400 text-sm ml-1 font-medium">(4.8)</span>
            </div>
          </div>

          {/* Product Specifications: Weight & Packaging */}
          <div className="space-y-6 mb-8">
             {/* Weight Options Selector */}
             <div>
                <span className="block text-xs text-stone-500 dark:text-stone-400 uppercase font-bold mb-2">Select Weight</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants && product.variants.length > 0 ? (
                    product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 rounded-lg border-2 font-bold text-sm transition-all ${
                          selectedVariant.id === variant.id
                            ? 'border-primary bg-primary text-white shadow-md'
                            : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-700 dark:text-stone-300 hover:border-primary/50'
                        }`}
                      >
                        {variant.weight}
                      </button>
                    ))
                  ) : (
                    <span className="px-4 py-2 rounded-lg border-2 border-primary bg-primary text-white font-bold text-sm shadow-md">{product.weight}</span>
                  )}
                </div>
             </div>

             {/* Packaging Info */}
             <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 inline-block w-full">
                <span className="block text-xs text-stone-500 dark:text-stone-400 uppercase font-bold mb-1">Quy Cách (Packaging)</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-stone-400">package_2</span>
                  <p className="font-bold text-slate-900 dark:text-white">{product.packaging}</p>
                </div>
             </div>
          </div>

          <div className="prose prose-stone dark:prose-invert max-w-none mb-8">
            <p className="text-lg leading-relaxed text-stone-600 dark:text-stone-300">
              {product.description}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-8 text-sm text-stone-500 dark:text-stone-400 font-medium">
            <span className="material-symbols-outlined !text-lg">location_on</span>
            <span>Origin: {product.location}, Vietnam</span>
          </div>

          {/* Actions */}
          <div className="mt-auto space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-800">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 text-stone-600 dark:text-stone-300 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined !text-lg">remove</span>
                </button>
                <span className="w-12 text-center font-bold text-slate-900 dark:text-white">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 text-stone-600 dark:text-stone-300 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined !text-lg">add</span>
                </button>
              </div>
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold text-lg py-3 px-8 rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                Add - ${(selectedVariant.price * quantity).toFixed(2)}
              </button>
            </div>
            <button 
              onClick={handleBuyNow}
              className="w-full py-3 rounded-xl border-2 border-stone-200 dark:border-stone-700 font-bold text-slate-700 dark:text-white hover:border-primary hover:text-primary transition-colors"
            >
              Buy Now
            </button>
          </div>
          
          <div className="mt-8 pt-8 border-t border-stone-200 dark:border-stone-700 grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center text-center p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <span className="material-symbols-outlined text-primary mb-2 text-2xl">verified_user</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Authentic Guarantee</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <span className="material-symbols-outlined text-primary mb-2 text-2xl">local_shipping</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Fast Shipping</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-all z-20"
          >
            <span className="material-symbols-outlined !text-3xl">close</span>
          </button>
          
          <div className="relative w-full h-full max-w-5xl max-h-screen flex items-center justify-center">
            <img 
              src={images[activeImageIndex]} 
              alt={product.name} 
              className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
            />
            
            {images.length > 1 && (
              <>
                <button 
                  onClick={handlePrevImage}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
                >
                  <span className="material-symbols-outlined !text-3xl">chevron_left</span>
                </button>
                <button 
                  onClick={handleNextImage}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
                >
                  <span className="material-symbols-outlined !text-3xl">chevron_right</span>
                </button>
              </>
            )}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-2 h-2 rounded-full transition-all ${activeImageIndex === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;