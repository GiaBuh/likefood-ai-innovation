import React from 'react';

type ChatMenuViewProps = {
  onSelectAdmin: () => void;
  onSelectAi: () => void;
};

export const ChatMenuView: React.FC<ChatMenuViewProps> = ({ onSelectAdmin, onSelectAi }) => (
  <div className="flex-1 p-6 flex flex-col justify-center gap-4">
    <p className="text-center text-stone-600 dark:text-stone-300 mb-2 font-medium">
      Please select a support option:
    </p>

    <button
      onClick={onSelectAdmin}
      className="group relative flex items-center gap-4 p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-primary dark:hover:border-primary shadow-sm hover:shadow-md transition-all text-left"
    >
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
        <span className="material-symbols-outlined text-2xl">support_agent</span>
      </div>
      <div>
        <h4 className="font-bold text-slate-900 dark:text-white">Chat with Admin</h4>
        <p className="text-xs text-stone-500 dark:text-stone-400">Order issues, shipping, returns</p>
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
        <h4 className="font-bold text-slate-900 dark:text-white">Chat with AI</h4>
        <p className="text-xs text-stone-500 dark:text-stone-400">Recipes, product info, tips</p>
      </div>
      <span className="absolute right-4 text-stone-300 group-hover:text-indigo-600 transition-colors">
        <span className="material-symbols-outlined">chevron_right</span>
      </span>
    </button>
  </div>
);
