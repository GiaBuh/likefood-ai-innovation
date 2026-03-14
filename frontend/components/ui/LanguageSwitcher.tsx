import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('vi') ? 'vi' : 'en';

  const toggleLanguage = () => {
    const newLang = currentLang === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
                 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                 text-neutral-700 dark:text-neutral-300 transition-all duration-200"
      aria-label="Switch language"
      title={currentLang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    >
      <span className={`transition-opacity ${currentLang === 'vi' ? 'opacity-100 font-bold' : 'opacity-50'}`}>
        VI
      </span>
      <span className="text-neutral-400">/</span>
      <span className={`transition-opacity ${currentLang === 'en' ? 'opacity-100 font-bold' : 'opacity-50'}`}>
        EN
      </span>
    </button>
  );
};

export default LanguageSwitcher;
