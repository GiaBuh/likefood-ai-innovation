import React from 'react';

type ChatInputProps = {
  inputText: string;
  onInputChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  disabled?: boolean;
};

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  onInputChange,
  onSubmit,
  disabled = false,
}) => (
  <form
    onSubmit={onSubmit}
    className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800"
  >
    <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-full px-4 py-2 border border-transparent focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      <input
        type="text"
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white placeholder-stone-400 p-0"
      />
      <button
        type="submit"
        disabled={!inputText.trim() || disabled}
        className="text-primary hover:text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="material-symbols-outlined !text-xl">send</span>
      </button>
    </div>
  </form>
);
