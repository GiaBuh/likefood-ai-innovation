import React from 'react';
import { useTranslation } from 'react-i18next';

type ChatMenuViewProps = {
  onSelectAdmin: () => void;
  onSelectAi: () => void;
};

export const ChatMenuView: React.FC<ChatMenuViewProps> = ({ onSelectAdmin, onSelectAi }) => {
  const { t } = useTranslation();
  return (
  <div className="flex-1 p-6 flex flex-col justify-center gap-4">
    <p className="text-center text-stone-600 dark:text-stone-300 mb-2 font-medium">
      {t('chat.title')}
    </p>

    <button
      onClick={onSelectAdmin}
      className="group relative flex items-center gap-4 p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-primary dark:hover:border-primary shadow-sm hover:shadow-md transition-all text-left"
    >
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
        <span className="material-symbols-outlined text-2xl">support_agent</span>
      </div>
      <div>
        <h4 className="font-bold text-neutral-900 dark:text-white">{t('chat.adminSupport')}</h4>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('chat.adminDescription')}</p>
      </div>
      <span className="absolute right-4 text-stone-300 group-hover:text-primary transition-colors">
        <span className="material-symbols-outlined">chevron_right</span>
      </span>
    </button>

    <button
      onClick={onSelectAi}
      className="group relative flex items-center gap-4 p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-sm hover:shadow-md transition-all text-left"
    >
      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        <span className="material-symbols-outlined text-2xl">smart_toy</span>
      </div>
      <div>
        <h4 className="font-bold text-neutral-900 dark:text-white">{t('chat.aiAssistant')}</h4>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('chat.aiDescription')}</p>
      </div>
      <span className="absolute right-4 text-stone-300 group-hover:text-indigo-600 transition-colors">
        <span className="material-symbols-outlined">chevron_right</span>
      </span>
    </button>
  </div>
  );
};
