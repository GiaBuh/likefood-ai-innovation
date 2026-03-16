import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useShop } from '../../contexts/ShopContext';
import SEO from '../ui/SEO';
import PageLoader from '../ui/PageLoader';
import Hero from '../home/Hero';
import CategoryGrid from '../home/CategoryGrid';
import FlashSale from '../home/FlashSale';
import BestSellers from '../home/BestSellers';
import TodaySuggestions from '../home/TodaySuggestions';

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { products, isLoadingProducts } = useShop();
  const featuredProducts = products.filter(p => p.status === 'Active').slice(0, 8);

  if (isLoadingProducts) {
    return (
      <div className="min-h-screen">
        <SEO title={t('landing.heroTitle')} description={t('landing.heroSubtitle')} path="/" />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEO title={t('landing.heroTitle')} description={t('landing.heroSubtitle')} path="/" />

      {/* Hero Section */}
      <Hero />

      {/* Category Grid */}
      <CategoryGrid />

      {/* Flash Sale */}
      <FlashSale />

      {/* Best Sellers */}
      <BestSellers />

      {/* Featured Products Preview */}
      {featuredProducts.length > 0 && (
        <section className="py-10 sm:py-16 lg:py-20 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">{t('home.featuredProducts')}</h2>
                <div className="w-12 h-1 bg-primary-500 rounded-full mt-3"></div>
              </div>
              <Link to="/shop" className="text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1 transition-colors">
                {t('common.viewAll')}
                <span className="material-symbols-outlined !text-lg">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.slug || product.id}`} className="group bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-neutral-100 dark:border-neutral-700">
                  <div className="aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-primary-500 mb-1">{product.categoryName || product.category}</p>
                    <h3 className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-2 mb-2">{product.name}</h3>
                    <p className="font-bold text-lg text-primary-500">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Today Suggestions */}
      <TodaySuggestions />
    </div>
  );
};

export default LandingPage;
