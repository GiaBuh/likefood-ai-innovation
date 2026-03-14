import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useShop } from '../../contexts/ShopContext';
import SEO from '../ui/SEO';

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { products } = useShop();
  const featuredProducts = products.filter(p => p.status === 'Active').slice(0, 8);

  return (
    <div className="min-h-screen">
      <SEO title={t('landing.heroTitle')} description={t('landing.heroSubtitle')} path="/" />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 py-20 lg:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary-500/10 blur-3xl"></div>
        </div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full text-sm font-semibold mb-6">
              <span className="material-symbols-outlined !text-base mr-1.5">local_shipping</span>
              {t('landing.valueShipping')}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 dark:text-white leading-tight mb-6">
              {t('landing.heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 mb-10 max-w-xl mx-auto">
              {t('landing.heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop" className="inline-flex items-center justify-center px-8 py-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-all duration-200 shadow-button text-lg">
                {t('landing.heroButton')}
                <span className="material-symbols-outlined ml-2">arrow_forward</span>
              </Link>
              <Link to="/about" className="inline-flex items-center justify-center px-8 py-4 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:border-primary-500 hover:text-primary-500 transition-all duration-200 text-lg">
                {t('about.storyTitle')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-neutral-900 dark:text-white mb-4">
            {t('landing.brandValues')}
          </h2>
          <div className="w-16 h-1 bg-primary-500 mx-auto rounded-full mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: 'verified', title: t('landing.valueAuthentic'), desc: t('landing.valueAuthenticDesc'), color: 'primary' },
              { icon: 'shield', title: t('landing.valueQuality'), desc: t('landing.valueQualityDesc'), color: 'secondary' },
              { icon: 'rocket_launch', title: t('landing.valueShipping'), desc: t('landing.valueShippingDesc'), color: 'accent' },
            ].map((value, idx) => (
              <div key={idx} className="group text-center p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-800 hover:shadow-card-hover transition-all duration-300 border border-transparent hover:border-primary-200 dark:hover:border-primary-800">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-${value.color}-50 dark:bg-${value.color}-950 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <span className={`material-symbols-outlined !text-3xl text-${value.color}-500`}>{value.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{value.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Preview */}
      {featuredProducts.length > 0 && (
        <section className="py-20 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white">{t('home.featuredProducts')}</h2>
                <div className="w-12 h-1 bg-primary-500 rounded-full mt-3"></div>
              </div>
              <Link to="/shop" className="text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1 transition-colors">
                {t('common.viewAll')}
                <span className="material-symbols-outlined !text-lg">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`} className="group bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-neutral-100 dark:border-neutral-700">
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

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-neutral-900 dark:text-white mb-4">
            {t('landing.testimonials')}
          </h2>
          <div className="w-16 h-1 bg-primary-500 mx-auto rounded-full mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Nguyễn Thị Mai', location: 'California, US', text: 'Sản phẩm rất tươi ngon, đóng gói cẩn thận. Nhận được đúng như mong đợi!', rating: 5 },
              { name: 'Trần Văn Hùng', location: 'Texas, US', text: 'Dịch vụ xuất sắc! Giao hàng nhanh và sản phẩm chất lượng tuyệt vời.', rating: 5 },
              { name: 'Lê Thanh Hoa', location: 'Virginia, US', text: 'Cuối cùng cũng tìm được nơi bán đặc sản Việt Nam chính gốc tại Mỹ. Rất hài lòng!', rating: 5 },
            ].map((review, idx) => (
              <div key={idx} className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-700">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined !text-lg text-accent-300" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 mb-4 italic leading-relaxed">"{review.text}"</p>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white text-sm">{review.name}</p>
                  <p className="text-xs text-neutral-500">{review.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">{t('landing.exploreProducts')}</h2>
          <p className="text-primary-100 text-lg mb-8">{t('landing.heroSubtitle')}</p>
          <Link to="/shop" className="inline-flex items-center px-8 py-4 bg-white text-primary-500 font-bold rounded-xl hover:bg-primary-50 transition-colors shadow-button text-lg">
            {t('common.shop')}
            <span className="material-symbols-outlined ml-2">storefront</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
