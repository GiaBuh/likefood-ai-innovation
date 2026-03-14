import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-neutral-900 text-neutral-300 py-16 border-t border-neutral-800 mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 md:gap-10">

          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 text-white group">
              <img src="/logo_likefood.png" alt="LikeFood Logo" className="h-12 w-12 rounded-full object-cover shadow-sm" />
              <span className="text-xl font-extrabold tracking-tight text-primary-500">LIKEFOOD</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 text-neutral-400">
              {t('footer.description')}
            </p>
            {/* Social Icons */}
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-primary-500 flex items-center justify-center transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-primary-500 flex items-center justify-center transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-primary-500 flex items-center justify-center transition-colors" aria-label="TikTok">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3 text-sm">
              <li><Link className="hover:text-primary-500 transition-colors" to="/shop">{t('common.shop')}</Link></li>
              <li><Link className="hover:text-primary-500 transition-colors" to="/about">{t('common.about')}</Link></li>
              <li><Link className="hover:text-primary-500 transition-colors" to="/blog">{t('common.blog')}</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="col-span-1">
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">{t('footer.customerService')}</h3>
            <ul className="space-y-3 text-sm">
              <li><a className="hover:text-primary-500 transition-colors" href="#">{t('footer.contactUs')}</a></li>
              <li><a className="hover:text-primary-500 transition-colors" href="#">{t('footer.returnPolicy')}</a></li>
              <li><a className="hover:text-primary-500 transition-colors" href="#">{t('footer.faq')}</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">{t('footer.stayConnected')}</h3>
            <p className="text-xs text-neutral-400 mb-3">{t('home.newsletter')}</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder={t('home.newsletterPlaceholder')}
                type="email"
              />
              <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shadow-button">
                {t('home.newsletterButton')}
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-500">{t('footer.copyright')}</p>
          <div className="flex gap-6 text-xs text-neutral-500">
            <a href="#" className="hover:text-primary-500 transition-colors">{t('footer.privacyPolicy')}</a>
            <a href="#" className="hover:text-primary-500 transition-colors">{t('footer.termsOfService')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
