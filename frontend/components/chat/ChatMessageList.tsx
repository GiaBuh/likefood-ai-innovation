import React from 'react';
import type { Message, ChatAction } from './chatTypes';

type ChatMessageListProps = {
  messages: Message[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onActionClick: (action: ChatAction) => void;
};

const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const MAX_VISIBLE_ACTIONS = 3;

const normalizeBotText = (text: string, formatProfile?: Message['formatProfile']): string[] => {
  if (!text) return [];
  const rawLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (rawLines.length > 1) return rawLines;

  const oneLine = rawLines[0] ?? text.trim();
  if (!oneLine) return [];

  const sentences = oneLine.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 1) return [oneLine];

  if (formatProfile === 'simple_cta') return [oneLine];
  return sentences;
};

const dedupeActions = (actions: ChatAction[]): ChatAction[] => {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = `${action.type}:${action.productId || '-'}:${action.label.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isTyping,
  messagesEndRef,
  onActionClick,
}) => {
  const [expandedActionMessageIds, setExpandedActionMessageIds] = React.useState<Record<string, boolean>>({});

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center text-xs text-stone-400 my-4">Today</div>

        {messages.map((msg) => {
          const sortedActions = dedupeActions([...(msg.actions || [])]);
          const maxVisibleActions = MAX_VISIBLE_ACTIONS;
          const isExpanded = Boolean(expandedActionMessageIds[msg.id]);
          const visibleActions = isExpanded ? sortedActions : sortedActions.slice(0, maxVisibleActions);
          const hiddenActionCount = sortedActions.length - visibleActions.length;
          const botLines = msg.sender === 'bot' ? normalizeBotText(msg.text, msg.formatProfile) : [msg.text];

          return (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] md:max-w-[82%] p-3 rounded-2xl text-sm shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white dark:bg-stone-800 text-slate-700 dark:text-stone-200 rounded-tl-none border border-stone-100 dark:border-stone-700 leading-6'
                }`}
              >
                {msg.sender === 'bot' ? (
                  <div className="space-y-1.5">
                    {botLines.map((line, idx) => {
                      const isBulletLike =
                        line.startsWith('•') ||
                        line.startsWith('-') ||
                        (idx > 0 && line.length > 24 && msg.formatProfile !== 'simple_cta');
                      return (
                        <p key={`${msg.id}-line-${idx}`} className="whitespace-pre-wrap break-words">
                          {isBulletLike ? (line.startsWith('•') || line.startsWith('-') ? line : `• ${line}`) : line}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                )}

                {visibleActions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {visibleActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => onActionClick(action)}
                        className="px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                        type="button"
                      >
                        {action.label}
                      </button>
                    ))}
                    {hiddenActionCount > 0 && (
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-full text-xs bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600 transition-colors"
                        onClick={() =>
                          setExpandedActionMessageIds((prev) => ({
                            ...prev,
                            [msg.id]: true,
                          }))
                        }
                      >
                        {`Xem them (${hiddenActionCount})`}
                      </button>
                    )}
                  </div>
                )}
                <p
                  className={`text-[10px] mt-1.5 text-right ${
                    msg.sender === 'user' ? 'text-green-100' : 'text-stone-400'
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}

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
};
