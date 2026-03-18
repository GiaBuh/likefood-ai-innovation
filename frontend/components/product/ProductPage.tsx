import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Product } from '../../types';
import { useShop } from '../../contexts/ShopContext';
import { fetchProductBySlug } from '../../services/shopApi';
import ProductDetail from './ProductDetail';
import ReviewSection from './ReviewSection';
import SEO from '../ui/SEO';

interface ProductPageProps {
  onAddToCart?: (product: Product, quantity: number) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
}

const ProductPage: React.FC<ProductPageProps> = ({ onAddToCart, onBuyNow }) => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, addToCart } = useShop();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    // Try to find by slug in context first
    const found = products.find((p) => p.slug === slug);
    if (found) {
      setProduct(found);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetchProductBySlug(slug)
      .then((p) => {
        if (!cancelled) {
          setProduct(p || null);
          setNotFound(!p);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, products]);

  const handleBack = () => navigate('/');
  const handleAddToCart = onAddToCart ?? ((p: Product, qty: number) => addToCart(p, qty));
  const handleBuyNow = onBuyNow ?? ((p: Product, qty: number) => {
    addToCart(p, qty);
    navigate('/checkout');
  });

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-xl font-bold text-neutral-700 dark:text-neutral-300 mb-4">{t('common.noResults')}</h2>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600"
        >
          {t('common.home')}
        </button>
      </div>
    );
  }

  const relatedProducts = product
    ? products.filter(p => p.category === product.category && String(p.id) !== String(product.id)).slice(0, 6)
    : [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO
        title={`${product.name} | LikeFood`}
        description={product.description?.slice(0, 160) || product.name}
        path={`/product/${product.slug || product.id}`}
      />
      <ProductDetail
        product={product}
        onBack={handleBack}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      {/* Review Section */}
      <ReviewSection productId={String(product.id)} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-700">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">{t('product.relatedProducts')}</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {relatedProducts.map(rp => (
              <Link
                key={rp.id}
                to={`/product/${rp.slug || rp.id}`}
                className="flex-shrink-0 w-48 group snap-start"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-3">
                  <img
                    src={rp.image}
                    alt={rp.name}
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-2 group-hover:text-primary-500 transition-colors">{rp.name}</h3>
                <p className="text-sm font-bold text-primary-500 mt-1">${rp.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
