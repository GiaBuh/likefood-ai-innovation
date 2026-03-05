import React from 'react';
import type { Message, ChatAction } from './chatTypes';

type ChatMessageListProps = {
  messages: Message[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onActionClick: (action: ChatAction) => void;
};

const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isTyping,
  messagesEndRef,
  onActionClick,
}) => (
  <>
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="text-center text-xs text-stone-400 my-4">Today</div>

      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
              msg.sender === 'user'
                ? 'bg-primary text-white rounded-tr-none'
                : 'bg-white dark:bg-stone-800 text-slate-700 dark:text-stone-200 rounded-tl-none border border-stone-100 dark:border-stone-700'
            }`}
          >
            <p>{msg.text}</p>
            {msg.actions && msg.actions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {msg.actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => onActionClick(action)}
                    className="px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                    type="button"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            <p
              className={`text-[10px] mt-1 text-right ${
                msg.sender === 'user' ? 'text-green-100' : 'text-stone-400'
              }`}
            >
              {formatTime(msg.timestamp)}
            </p>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-white dark:bg-stone-800 p-3 rounded-2xl rounded-tl-none border border-stone-100 dark:border-stone-700 shadow-sm flex gap-1">
            <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-75"></span>
            <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-150"></span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  </>
);
