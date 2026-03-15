import React from 'react';
import { useTranslation } from 'react-i18next';
import SEO from '../ui/SEO';

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <SEO title={t('about.title')} description={t('about.storyText')} path="/about" />
      {/* Hero */}
      <section className="relative py-12 sm:py-16 lg:py-28 bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 dark:text-white mb-4 sm:mb-6">
              {t('about.title')}
            </h1>
            <div className="w-16 h-1 bg-primary-500 mx-auto rounded-full mb-6"></div>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {t('about.storyText')}
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-10 sm:py-16 lg:py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="p-6 sm:p-8 rounded-2xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900">
              <div className="w-14 h-14 rounded-xl bg-primary-500 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined !text-2xl text-white">flag</span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">{t('about.missionTitle')}</h2>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">{t('about.missionText')}</p>
            </div>
            <div className="p-6 sm:p-8 rounded-2xl bg-secondary-50 dark:bg-secondary-950/30 border border-secondary-100 dark:border-secondary-900">
              <div className="w-14 h-14 rounded-xl bg-secondary-500 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined !text-2xl text-white">visibility</span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">{t('about.visionTitle')}</h2>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">{t('about.visionText')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team / Story */}
      <section className="py-10 sm:py-16 lg:py-20 bg-neutral-50 dark:bg-neutral-800/50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mb-4">{t('about.storyTitle')}</h2>
            <div className="w-12 h-1 bg-primary-500 mx-auto rounded-full mb-8"></div>
            <div className="prose prose-lg dark:prose-invert mx-auto text-neutral-600 dark:text-neutral-300 leading-relaxed space-y-4">
              <p>{t('about.storyText')}</p>
              <p>{t('about.missionText')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-10 sm:py-16 lg:py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white mb-4">{t('about.contactTitle')}</h2>
            <div className="w-12 h-1 bg-primary-500 mx-auto rounded-full mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                <span className="material-symbols-outlined !text-3xl text-primary-500 mb-3">email</span>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Email</p>
                <p className="text-xs text-neutral-500 mt-1">info@likefood.vn</p>
              </div>
              <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                <span className="material-symbols-outlined !text-3xl text-primary-500 mb-3">phone</span>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Phone</p>
                <p className="text-xs text-neutral-500 mt-1">+84 123 456 789</p>
              </div>
              <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                <span className="material-symbols-outlined !text-3xl text-primary-500 mb-3">location_on</span>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Address</p>
                <p className="text-xs text-neutral-500 mt-1">TP. Hồ Chí Minh, Việt Nam</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
