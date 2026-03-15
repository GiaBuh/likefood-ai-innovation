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
    <div className="flex flex-1 min-h-0 w-full rounded-tl-[16px] rounded-b-[16px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Conversation list - left sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white">Hội thoại</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {conversations.length} khách hàng
            </p>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh()}
              className="p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="Làm mới danh sách"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">
              <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">chat_bubble_outline</span>
              <p>No conversations yet</p>
              <p className="text-xs mt-1">When customers chat with you via Help Center, they will appear here.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.userId}
                onClick={() => setSelectedUserId(conv.userId)}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-200 dark:border-neutral-800 ${
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
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">{conv.fullname}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
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
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
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
                <p className="font-semibold text-neutral-900 dark:text-white">{selectedConversation.fullname}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{selectedConversation.email}</p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Online
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50 dark:bg-stone-950">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 dark:text-neutral-400 text-sm">
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
            <form onSubmit={handleSend} className="p-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-subtext-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="rounded-xl bg-primary px-5 py-3 text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                  Gửi
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">forum</span>
              <p className="font-medium">Chọn hội thoại</p>
              <p className="text-sm mt-1">Chọn khách hàng từ danh sách để bắt đầu chat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatView;
