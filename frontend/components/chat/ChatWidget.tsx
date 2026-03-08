import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { User, Product, ProductVariant } from '../../types';
import { useShop } from '../../contexts/ShopContext';
import { useToast } from '../../contexts/ToastContext';
import { getMyChatMessages, sendChatMessageAsUser } from '../../services/shopApi';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import {
  createDefaultAdminMessages,
  createDefaultAiMessages,
  serializeMessages,
  deserializeMessages,
  getStorageKeyForUser,
} from './chatStorage';
import type { ChatView, Message, PersistedChatState } from './chatTypes';
import { useChatAi } from './useChatAi';
import { ChatMenuView } from './ChatMenuView';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';

interface ChatWidgetProps {
  user: User | null;
  onOpenLogin: () => void;
  onGoToCheckout: () => void;
  onGoToOrders: () => void;
  onOpenProduct: (productId: string) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  user,
  onOpenLogin,
  onGoToCheckout,
  onGoToOrders,
  onOpenProduct,
}) => {
  const { products, addToCart } = useShop();
  const { showError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<ChatView>('menu');
  const [isHovered, setIsHovered] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiStage, setAiStage] = useState('idle');
  const [chatLanguage, setChatLanguage] = useState<'vi' | 'en' | null>(null);
  const [aiContext, setAiContext] = useState<{ awaiting?: string; selectedProductId?: string; selectedVariantId?: string }>({ awaiting: 'NONE' });
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [pendingVariant, setPendingVariant] = useState<ProductVariant | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);
  const [adminMessages, setAdminMessages] = useState<Message[]>(() => createDefaultAdminMessages());
  const [aiMessages, setAiMessages] = useState<Message[]>(() => createDefaultAiMessages());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasHydratedChatRef = useRef(false);
  const lastStorageKeyRef = useRef<string | null>(null);

  const currentMessages = activeView === 'admin' ? adminMessages : aiMessages;

  const { handleActionClick, sendAiMessage, detectLanguage } = useChatAi({
    products,
    addToCart,
    aiMessages,
    setAiMessages,
    aiStage,
    setAiStage,
    pendingProduct,
    setPendingProduct,
    pendingVariant,
    setPendingVariant,
    pendingQuantity,
    setPendingQuantity,
    aiContext,
    setAiContext,
    chatLanguage,
    setChatLanguage,
    setIsTyping,
    onOpenProduct,
    onGoToCheckout,
    onGoToOrders,
  });

  useEffect(() => {
    if (isOpen && activeView !== 'menu') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adminMessages, aiMessages, isOpen, activeView, isTyping]);

  useEffect(() => {
    const storageKey = getStorageKeyForUser(user);
    if (!user) {
      if (lastStorageKeyRef.current) localStorage.removeItem(lastStorageKeyRef.current);
      lastStorageKeyRef.current = null;
      hasHydratedChatRef.current = false;
      setActiveView('menu');
      setAdminMessages(createDefaultAdminMessages());
      setAiMessages(createDefaultAiMessages());
      setChatLanguage(null);
      setAiContext({ awaiting: 'NONE' });
      return;
    }
    if (!storageKey) {
      hasHydratedChatRef.current = true;
      return;
    }
    lastStorageKeyRef.current = storageKey;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setActiveView('menu');
        setAdminMessages(createDefaultAdminMessages());
        setAiMessages(createDefaultAiMessages());
        setChatLanguage(null);
        setAiContext({ awaiting: 'NONE' });
        hasHydratedChatRef.current = true;
        return;
      }
      const parsed = JSON.parse(raw) as PersistedChatState;
      setActiveView(parsed.activeView || 'menu');
      setAdminMessages(deserializeMessages(parsed.adminMessages, createDefaultAdminMessages()));
      setAiMessages(deserializeMessages(parsed.aiMessages, createDefaultAiMessages()));
      setChatLanguage(parsed.chatLanguage || null);
      setAiContext(parsed.aiContext || { awaiting: 'NONE' });
      hasHydratedChatRef.current = true;
    } catch {
      setActiveView('menu');
      setAdminMessages(createDefaultAdminMessages());
      setAiMessages(createDefaultAiMessages());
      setChatLanguage(null);
      setAiContext({ awaiting: 'NONE' });
      hasHydratedChatRef.current = true;
    }
  }, [user]);

  useEffect(() => {
    if (!user || activeView !== 'admin') return;
    getMyChatMessages()
      .then((list) => {
        if (list.length > 0) {
          const msgs: Message[] = list.map((m) => ({
            id: m.id,
            text: m.content,
            sender: m.sender === 'admin' ? 'bot' : 'user',
            timestamp: new Date(m.createdAt),
          }));
          setAdminMessages(msgs);
        }
      })
      .catch(() => {});
  }, [user, activeView]);

  const handleWsMessage = useCallback((msg: { id: string; content: string; sender: string; createdAt: string }) => {
    setAdminMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      if (msg.sender === 'user') {
        const idx = prev.findIndex(
          (m) =>
            m.sender === 'user' &&
            m.text === msg.content &&
            /^\d+$/.test(m.id) &&
            Math.abs(new Date(msg.createdAt).getTime() - m.timestamp.getTime()) < 5000
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], id: msg.id, timestamp: new Date(msg.createdAt) };
          return next;
        }
      }
      return [
        ...prev,
        {
          id: msg.id,
          text: msg.content,
          sender: msg.sender === 'admin' ? 'bot' : 'user',
          timestamp: new Date(msg.createdAt),
        },
      ];
    });
  }, []);
  useChatWebSocket(user ? user.id : null, handleWsMessage);

  useEffect(() => {
    if (!user || !hasHydratedChatRef.current) return;
    const storageKey = getStorageKeyForUser(user);
    if (!storageKey || activeView === 'admin') return;
    const payload: PersistedChatState = {
      activeView,
      adminMessages: serializeMessages(adminMessages),
      aiMessages: serializeMessages(aiMessages),
      chatLanguage,
      aiContext,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [user, activeView, adminMessages, aiMessages, chatLanguage, aiContext]);

  const toggleChat = () => setIsOpen(!isOpen);
  const handleBackToMenu = () => setActiveView('menu');

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    if (activeView === 'admin') {
      const textToSend = inputText;
      setAdminMessages((prev) => [...prev, newMessage]);
      setInputText('');
      setIsTyping(true);
      sendChatMessageAsUser(textToSend)
        .then((created) => {
          setAdminMessages((prev) =>
            prev.map((m) => (m.id === newMessage.id ? { ...m, id: created.id } : m))
          );
        })
        .catch((err) => {
          showError(err instanceof Error ? err.message : 'Không gửi được tin nhắn. Vui lòng thử lại.');
        })
        .finally(() => setIsTyping(false));
      return;
    }

    setChatLanguage(detectLanguage(newMessage.text));
    setAiMessages((prev) => [...prev, newMessage]);
    setIsTyping(true);
    setInputText('');
    sendAiMessage(newMessage.text, [...aiMessages, newMessage], detectLanguage(newMessage.text));
  };

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'admin': return 'Customer Support';
      case 'ai': return 'AI Assistant';
      default: return 'Help Center';
    }
  };

  const getHeaderIcon = () => {
    switch (activeView) {
      case 'admin': return 'support_agent';
      case 'ai': return 'smart_toy';
      default: return 'help';
    }
  };

  const onActionClick = activeView === 'ai' ? handleActionClick : () => {};

  return (
    <div className="fixed bottom-6 right-6 z-[50] flex flex-col items-end pointer-events-none">
      <div
        className={`mb-4 w-[350px] max-w-[calc(100vw-3rem)] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-10 pointer-events-none'
        }`}
        style={{ height: '500px', maxHeight: '80vh' }}
      >
        <div className={`p-4 flex items-center justify-between transition-colors duration-300 ${activeView === 'ai' ? 'bg-indigo-600' : 'bg-primary'}`}>
          <div className="flex items-center gap-3">
            {activeView !== 'menu' && (
              <button
                onClick={handleBackToMenu}
                className="mr-1 hover:bg-white/20 p-1 rounded-full transition-colors text-white"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
            )}
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="material-symbols-outlined text-white">{getHeaderIcon()}</span>
              </div>
              {activeView !== 'menu' && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{getHeaderTitle()}</h3>
              {activeView !== 'menu' && (
                <p className="text-white/80 text-xs flex items-center gap-1">Online</p>
              )}
            </div>
          </div>
          <button
            onClick={toggleChat}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-72px)] bg-stone-50 dark:bg-stone-950">
          {activeView === 'menu' && (
            <ChatMenuView onSelectAdmin={() => setActiveView('admin')} onSelectAi={() => setActiveView('ai')} />
          )}

          {activeView !== 'menu' &&
            (user ? (
              <>
                <ChatMessageList
                  messages={currentMessages}
                  isTyping={isTyping}
                  messagesEndRef={messagesEndRef}
                  onActionClick={onActionClick}
                />
                <ChatInput
                  inputText={inputText}
                  onInputChange={setInputText}
                  onSubmit={handleSendMessage}
                  disabled={isTyping}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl text-stone-400">lock</span>
                </div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Login Required</h4>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">
                  Please sign in to your account to chat with {activeView === 'ai' ? 'our AI' : 'support'}.
                </p>
                <button
                  onClick={onOpenLogin}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-lg shadow-green-500/20 transition-all"
                >
                  Login to Chat
                </button>
              </div>
            ))}
        </div>
      </div>

      <button
        onClick={toggleChat}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="pointer-events-auto group relative flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all duration-300 z-50"
      >
        <span className={`material-symbols-outlined text-2xl transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0 absolute' : 'opacity-100'}`}>
          chat_bubble
        </span>
        <span className={`material-symbols-outlined text-2xl transition-all duration-300 ${isOpen ? 'opacity-100' : '-rotate-90 opacity-0 absolute'}`}>
          close
        </span>
        <div
          className={`absolute right-full mr-4 bg-white dark:bg-stone-800 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg shadow-md text-sm font-bold whitespace-nowrap transition-all duration-300 origin-right ${
            isHovered && !isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`}
        >
          Chat with us 👋
        </div>
        {!isOpen && (
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white dark:border-stone-900"></span>
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
