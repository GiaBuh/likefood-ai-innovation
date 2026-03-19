import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HERO_IMAGE_URL } from '../../constants';

const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full px-4 pt-6 pb-6 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900 min-h-[320px] sm:min-h-[450px] md:min-h-0 md:aspect-[21/9] flex items-center shadow-card-hover">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_IMAGE_URL}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/90 via-neutral-900/60 to-transparent"></div>
        </div>
        <div className="relative px-6 py-8 sm:px-10 md:px-16 flex flex-col items-start gap-4 md:gap-6 max-w-2xl">
          <span className="inline-flex items-center rounded-lg bg-primary-500/90 backdrop-blur-sm px-3 py-1.5 text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider shadow-lg">
            <span className="material-symbols-outlined !text-sm mr-1">verified</span>
            {t('landing.valueAuthentic')}
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
            {t('home.heroTitle')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-300">
              {t('home.heroHighlight')}
            </span>
          </h1>
          <p className="text-neutral-200 text-base sm:text-lg md:text-xl font-medium max-w-lg leading-relaxed">
            {t('home.heroDescription')}
          </p>
          <div className="flex gap-4 mt-2">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-6 py-3 sm:px-8 sm:py-3.5 text-sm sm:text-base font-bold text-white shadow-button hover:bg-primary-600 transition-all transform hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined mr-2 !text-lg">storefront</span>
              {t('home.heroButton')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;