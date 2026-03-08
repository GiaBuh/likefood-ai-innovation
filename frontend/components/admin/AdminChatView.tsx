import React, { useState, useEffect, useRef } from 'react';
import { CustomerProfile } from '../../types';

export type ChatMessage = {
  id: string;
  content: string;
  sender: 'user' | 'admin';
  createdAt: string;
};

export type ChatConversation = {
  userId: string;
  fullname: string;
  email: string;
  avatarUrl?: string;
  initials?: string;
  initialsBgColor?: string;
  initialsTextColor?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
};

interface AdminChatViewProps {
  customers: CustomerProfile[];
  conversations: ChatConversation[];
  messagesByUser: Record<string, ChatMessage[]>;
  onSendMessage: (userId: string, content: string) => Promise<void>;
  onLoadMessages?: (userId: string) => Promise<void>;
  onRefresh?: () => void;
}

const AdminChatView: React.FC<AdminChatViewProps> = ({
  customers,
  conversations,
  messagesByUser,
  onSendMessage,
  onLoadMessages,
  onRefresh,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = selectedUserId
    ? conversations.find((c) => c.userId === selectedUserId)
    : null;
  const messages = selectedUserId ? messagesByUser[selectedUserId] || [] : [];

  useEffect(() => {
    if (selectedUserId && onLoadMessages) {
      onLoadMessages(selectedUserId);
    }
  }, [selectedUserId, onLoadMessages]);



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedUserId || isSending) return;
    setIsSending(true);
    try {
      await onSendMessage(selectedUserId, text);
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-1 min-h-0 w-full rounded-tl-[16px] rounded-b-[16px] border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark overflow-hidden">
      {/* Conversation list - left sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-border-light dark:border-border-dark flex flex-col">
        <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
          <div>
            <h3 className="font-bold text-text-light dark:text-text-dark">Conversations</h3>
            <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1">
              {conversations.length} customer{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh()}
              className="p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
              title="Làm mới danh sách"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-subtext-light dark:text-subtext-dark text-sm">
              <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">chat_bubble_outline</span>
              <p>No conversations yet</p>
              <p className="text-xs mt-1">When customers chat with you via Help Center, they will appear here.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.userId}
                onClick={() => setSelectedUserId(conv.userId)}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-background-light dark:hover:bg-background-dark transition-colors border-b border-border-light dark:border-border-dark ${
                  selectedUserId === conv.userId ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                }`}
              >
                {conv.avatarUrl ? (
                  <img src={conv.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold ${conv.initialsBgColor || 'bg-primary/20'} ${conv.initialsTextColor || 'text-primary'}`}
                  >
                    {conv.initials || conv.fullname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-light dark:text-text-dark truncate">{conv.fullname}</p>
                  <p className="text-xs text-subtext-light dark:text-subtext-dark truncate">
                    {conv.lastMessage || conv.email}
                  </p>
                </div>
                {conv.unreadCount && conv.unreadCount > 0 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat panel - right */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedUserId && selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center gap-3">
              {selectedConversation.avatarUrl ? (
                <img src={selectedConversation.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedConversation.initialsBgColor || 'bg-primary/20'} ${selectedConversation.initialsTextColor || 'text-primary'}`}
                >
                  {selectedConversation.initials || selectedConversation.fullname.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-text-light dark:text-text-dark">{selectedConversation.fullname}</p>
                <p className="text-xs text-subtext-light dark:text-subtext-dark">{selectedConversation.email}</p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Online
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50 dark:bg-stone-950">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-subtext-light dark:text-subtext-dark text-sm">
                  <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">chat</span>
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${
                        msg.sender === 'admin'
                          ? 'bg-primary text-white rounded-br-none'
                          : 'bg-white dark:bg-stone-800 text-slate-700 dark:text-stone-200 rounded-bl-none border border-stone-100 dark:border-stone-700'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          msg.sender === 'admin' ? 'text-primary-100 text-right' : 'text-stone-400'
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-border-light dark:border-border-dark">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 py-3 text-sm text-text-light dark:text-text-dark placeholder-subtext-light dark:placeholder-subtext-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="rounded-xl bg-primary px-5 py-3 text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-subtext-light dark:text-subtext-dark">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">forum</span>
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose a customer from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatView;
