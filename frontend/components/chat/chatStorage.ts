import type { Message, PersistedMessage } from './chatTypes';
import { CHAT_STORAGE_PREFIX } from './chatTypes';

export const createDefaultAdminMessages = (): Message[] => [
  {
    id: 'welcome-admin',
    text: 'Hello! I am a support agent. How can I help you with your order today?',
    sender: 'bot',
    timestamp: new Date(),
  },
];

export const createDefaultAiMessages = (): Message[] => [
  {
    id: 'welcome-ai',
    text: 'Xin chào! Tôi là AI Food Assistant. Bạn cứ hỏi tên món/sản phẩm, tôi sẽ tư vấn theo dữ liệu hệ thống và hỗ trợ thêm vào giỏ hàng cho bạn.',
    sender: 'bot',
    timestamp: new Date(),
  },
];

export const serializeMessages = (messages: Message[]): PersistedMessage[] =>
  messages.map((item) => ({
    ...item,
    timestamp: item.timestamp.toISOString(),
  }));

export const deserializeMessages = (
  messages: PersistedMessage[] | undefined,
  fallback: Message[]
): Message[] => {
  if (!messages || messages.length === 0) return fallback;
  return messages.map((item) => ({
    ...item,
    timestamp: new Date(item.timestamp),
  }));
};

export function getStorageKeyForUser(user: { id?: string; email?: string } | null): string | null {
  if (!user) return null;
  const identity = user.id || user.email;
  if (!identity) return null;
  return `${CHAT_STORAGE_PREFIX}:${identity}`;
}
