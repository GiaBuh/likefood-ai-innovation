import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { useShop } from '../../contexts/ShopContext';
import { fetchProductById } from '../../services/shopApi';
import ProductDetail from './ProductDetail';

interface ProductPageProps {
  onAddToCart?: (product: Product, quantity: number) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
}

const ProductPage: React.FC<ProductPageProps> = ({ onAddToCart, onBuyNow }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart } = useShop();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const found = products.find((p) => String(p.id) === String(id));
    if (found) {
      setProduct(found);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetchProductById(id)
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
  }, [id, products]);

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
        <h2 className="text-xl font-bold text-slate-700 dark:text-stone-300 mb-4">Sản phẩm không tìm thấy</h2>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductDetail
        product={product}
        onBack={handleBack}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
    </div>
  );
};

export default ProductPage;
