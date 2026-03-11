export type ChatAction = {
  id: string;
  label: string;
  type: string;
  productId?: string;
  variantId?: string;
  quantity?: number;
  command?: string;
  reason?: string;
  offerType?: string;
};

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  actions?: ChatAction[];
  formatProfile?: 'compact_detail' | 'recommendation_list' | 'budget_advice' | 'simple_cta';
  debugContextId?: string;
  debugFromAwaiting?: string;
  debugToAwaiting?: string;
}

export type ChatView = 'menu' | 'admin' | 'ai';

export type AiStage =
  | 'idle'
  | 'awaiting_add_confirmation'
  | 'awaiting_variant'
  | 'awaiting_quantity'
  | 'awaiting_checkout_confirmation';

export type PersistedMessage = Omit<Message, 'timestamp'> & { timestamp: string };

export type PersistedChatState = {
  activeView: ChatView;
  adminMessages: PersistedMessage[];
  aiMessages: PersistedMessage[];
  aiContext: { awaiting?: string; selectedProductId?: string; selectedVariantId?: string; pendingQuantity?: number; pendingVariantHint?: string };
};

export const CHAT_STORAGE_PREFIX = 'likefood_chat_state';
