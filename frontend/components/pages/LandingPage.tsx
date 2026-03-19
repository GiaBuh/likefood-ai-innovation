import React from 'react';
import { useTranslation } from 'react-i18next';
import { useShop } from '../../contexts/ShopContext';
import SEO from '../ui/SEO';
import PageLoader from '../ui/PageLoader';
import Hero from '../home/Hero';
import CategoryGrid from '../home/CategoryGrid';
import FlashSale from '../home/FlashSale';
import TodaySuggestions from '../home/TodaySuggestions';
import TrendSection from '../home/TrendSection';

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { isLoadingProducts } = useShop();

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

      {/* Trending on TikTok */}
      <TrendSection />

      {/* Category Grid */}
      <CategoryGrid />

      {/* Flash Sale */}
      <FlashSale />

      {/* Today Suggestions */}
      <TodaySuggestions />
    </div>
  );
};

export default LandingPage;
