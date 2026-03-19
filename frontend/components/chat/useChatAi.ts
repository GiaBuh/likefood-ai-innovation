import { useCallback, useEffect, useRef } from 'react';
import type { Product, ProductVariant } from '../../types';
import type { AiChatContext } from '../../services/shopApi';
import { askAiAssistant } from '../../services/shopApi';
import type { ChatAction, Message } from './chatTypes';

type UseChatAiParams = {
  products: Product[];
  addToCart: (product: Product, qty: number) => void;
  addComboToCart: (comboId: string, quantity: number) => Promise<void>;
  aiMessages: Message[];
  setAiMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  aiStage: string;
  setAiStage: (s: string) => void;
  pendingProduct: Product | null;
  setPendingProduct: (p: Product | null) => void;
  pendingVariant: ProductVariant | null;
  setPendingVariant: (v: ProductVariant | null) => void;
  pendingQuantity: number | null;
  setPendingQuantity: (q: number | null) => void;
  aiContext: AiChatContext;
  setAiContext: (c: AiChatContext) => void;
  setIsTyping: (v: boolean) => void;
  onOpenProduct: (id: string) => void;
  onGoToCheckout: () => void;
  onGoToOrders: () => void;
};

const toAiHistory = (messages: Message[]) =>
  messages
    .map((msg) => ({
      role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.text,
    }))
    .slice(-10);

type MessageFormatProfile = 'compact_detail' | 'recommendation_list' | 'budget_advice' | 'simple_cta';

const resolveFormatProfileFallback = (reply: string): MessageFormatProfile => {
  const normalized = (reply || '').trim();
  if (!normalized) return 'simple_cta';
  if (normalized.includes('\n•') || normalized.includes('\n-')) return 'recommendation_list';
  const sentenceCount = normalized.split(/(?<=[.!?])\s+/).filter(Boolean).length;
  if (sentenceCount >= 3) return 'recommendation_list';
  if (sentenceCount === 2) return 'compact_detail';
  return 'simple_cta';
};

export function useChatAi(params: UseChatAiParams) {
  const {
    products,
    addToCart,
    addComboToCart,
    aiMessages,
    setAiMessages,
    setAiStage,
    setPendingProduct,
    setPendingVariant,
    setPendingQuantity,
    aiContext,
    setAiContext,
    setIsTyping,
    onOpenProduct,
    onGoToCheckout,
    onGoToOrders,
  } = params;
  const aiContextRef = useRef<AiChatContext>(aiContext);

  useEffect(() => {
    aiContextRef.current = aiContext;
  }, [aiContext]);

  const pushAiMessage = useCallback(
    (
      text: string,
      actions?: ChatAction[],
      formatProfile?: MessageFormatProfile,
      debugMeta?: { debugContextId?: string; debugFromAwaiting?: string; debugToAwaiting?: string }
    ) => {
      const botMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
        sender: 'bot',
        timestamp: new Date(),
        actions,
        formatProfile,
        debugContextId: debugMeta?.debugContextId,
        debugFromAwaiting: debugMeta?.debugFromAwaiting,
        debugToAwaiting: debugMeta?.debugToAwaiting,
      };
      setAiMessages((prev) => [...prev, botMessage]);
    },
    [setAiMessages]
  );

  const resetPendingSelection = useCallback(() => {
    setAiStage('idle');
    setPendingProduct(null);
    setPendingVariant(null);
    setPendingQuantity(null);
  }, [setAiStage, setPendingProduct, setPendingVariant, setPendingQuantity]);

  const syncStateFromContext = useCallback(
    (nextContext: AiChatContext | undefined, cartInstruction?: { quantity?: number; productId?: string }) => {
      if (!nextContext) return;
      aiContextRef.current = nextContext;
      setAiContext(nextContext);

      if (!nextContext.awaiting || nextContext.awaiting === 'NONE') {
        resetPendingSelection();
        return;
      }

      if (nextContext.awaiting === 'AWAITING_CHECKOUT') {
        setAiStage('awaiting_checkout_confirmation');
        return;
      }

      if (!nextContext.selectedProductId) return;
      const selected = products.find((item) => String(item.id) === String(nextContext.selectedProductId));
      if (!selected) return;

      setPendingProduct(selected);
      const ctxQty = nextContext.pendingQuantity ?? cartInstruction?.quantity;
      if (ctxQty) setPendingQuantity(ctxQty);
      if (nextContext.awaiting === 'AWAITING_PRODUCT_CONFIRMATION') {
        setAiStage('awaiting_add_confirmation');
      } else if (nextContext.awaiting === 'AWAITING_VARIANT_OR_QUANTITY') {
        setAiStage('awaiting_variant');
      }
    },
    [products, resetPendingSelection, setAiContext, setAiStage, setPendingProduct, setPendingQuantity]
  );

  const handleAiConversation = useCallback(
    async (input: string, contextMessages: Message[]) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      try {
        const aiResponse = await askAiAssistant(trimmed, toAiHistory(contextMessages), 'vi', aiContextRef.current);
        const allowedActionProductIds = new Set<string>([
          ...(aiResponse.matchedProductIds || []).map((id) => String(id)),
          ...(aiResponse.nextContext?.selectedProductId ? [String(aiResponse.nextContext.selectedProductId)] : []),
        ]);
        syncStateFromContext(aiResponse.nextContext, aiResponse.cartInstruction);
        if (aiResponse.cartInstruction?.variantId && aiResponse.cartInstruction?.quantity) {
          const product = products.find((item) => String(item.id) === String(aiResponse.cartInstruction?.productId));
          const variant = product?.variants?.find((item) => item.id === aiResponse.cartInstruction?.variantId);
          if (product && variant) {
            addToCart(
              { ...product, weight: variant.weight, variantId: variant.id, price: variant.price },
              aiResponse.cartInstruction.quantity
            );
          }
        }
        const actionNeedsProductBinding = (type?: string) =>
          type === 'open-product' || type === 'buy-product' || type === 'choose-variant';
        const responseActions: ChatAction[] = (aiResponse.actions || [])
          .filter((action) => {
            if (!actionNeedsProductBinding(action.type)) return true;
            if (!action.productId) return false;
            return allowedActionProductIds.has(String(action.productId));
          })
          .map((action, index) => ({
            id: `${Date.now()}-${index}-${action.type}`,
            label: action.label,
            type: action.type,
            productId: action.productId,
            variantId: action.variantId,
            quantity: action.quantity,
            command: action.command,
            reason: action.reason,
            offerType: action.offerType,
          }));
        const minPriceByProductId = (productId?: string) => {
          if (!productId) return Number.POSITIVE_INFINITY;
          const product = products.find((item) => String(item.id) === String(productId));
          if (!product) return Number.POSITIVE_INFINITY;
          if (product.variants && product.variants.length > 0) {
            return Math.min(...product.variants.map((variant) => Number(variant.price ?? Number.POSITIVE_INFINITY)));
          }
          return Number(product.price ?? Number.POSITIVE_INFINITY);
        };
        const groupedActions = new Map<
          string,
          { open?: ChatAction; buy?: ChatAction; others: ChatAction[] }
        >();
        const passThroughActions: ChatAction[] = [];
        for (const action of responseActions) {
          if (action.productId && (action.type === 'open-product' || action.type === 'buy-product')) {
            const key = String(action.productId);
            const existing = groupedActions.get(key) ?? { others: [] };
            if (action.type === 'open-product') existing.open = action;
            else existing.buy = action;
            groupedActions.set(key, existing);
          } else {
            passThroughActions.push(action);
          }
        }
        const orderedProductIds = [...groupedActions.keys()].sort(
          (a, b) => minPriceByProductId(a) - minPriceByProductId(b)
        );
        const orderedActions: ChatAction[] = [];
        for (const productId of orderedProductIds) {
          const grouped = groupedActions.get(productId);
          if (!grouped) continue;
          if (grouped.open) orderedActions.push(grouped.open);
          if (grouped.buy) orderedActions.push(grouped.buy);
          orderedActions.push(...grouped.others);
        }
        orderedActions.push(...passThroughActions);
        const composedReply = aiResponse.reply;
        pushAiMessage(
          composedReply,
          orderedActions.length > 0 ? orderedActions : undefined,
          aiResponse.recommendationMeta?.formatProfile ?? resolveFormatProfileFallback(composedReply),
          {
            debugContextId: aiResponse.recommendationMeta?.debugContextId,
            debugFromAwaiting: aiResponse.recommendationMeta?.debugFromAwaiting,
            debugToAwaiting: aiResponse.recommendationMeta?.debugToAwaiting,
          }
        );
      } catch (error) {
        console.error('Cannot get AI response from backend.', error);
        pushAiMessage(
          'Xin lỗi, em đang gặp sự cố kỹ thuật. Anh/chị thử lại sau giây lát hoặc liên hệ hotline nhé!'
        );
      }
    },
    [
      pushAiMessage,
      products,
      addToCart,
      syncStateFromContext,
    ]
  );

  const sendAiMessage = useCallback(
    (input: string, contextMessages: Message[]) => {
      setTimeout(async () => {
        try {
          await handleAiConversation(input, contextMessages);
        } finally {
          setIsTyping(false);
        }
      }, 700);
    },
    [handleAiConversation, setIsTyping]
  );

  const handleActionClick = useCallback(
    (action: ChatAction) => {
      // ── Navigation actions: handled locally ──
      if (action.type === 'go-checkout' || action.type === 'go_checkout') {
        onGoToCheckout();
        return;
      }
      if (action.type === 'view-orders' || action.type === 'go_orders') {
        onGoToOrders();
        return;
      }
      if ((action.type === 'open-product' || action.type === 'open_product') && action.productId) {
        onOpenProduct(action.productId);
        return;
      }
      if (action.type === 'buy_combo' || action.type === 'buy-combo') {
        if (!action.productId) {
          pushAiMessage('Nút mua combo đang bị lỗi. Anh/chị thông cảm.');
          return;
        }
        addComboToCart(action.productId, 1);
        pushAiMessage('Đã thêm combo vào giỏ hàng. Bạn muốn thanh toán ngay không?', [
          { id: 'go-checkout', label: 'Đi đến thanh toán', type: 'go_checkout' },
          { id: 'go-orders', label: 'Xem đơn hàng', type: 'go_orders' },
        ]);
        return;
      }

      // ── ALL other actions: forward to backend API ──
      const userActionMessage: Message = {
        id: `${Date.now()}-action`,
        text: action.label,
        sender: 'user',
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, userActionMessage]);
      setIsTyping(true);
      sendAiMessage(action.command || action.label, [...aiMessages, userActionMessage]);
    },
    [
      onOpenProduct,
      onGoToCheckout,
      onGoToOrders,
      setAiMessages,
      pushAiMessage,
      addComboToCart,
      sendAiMessage,
      aiMessages,
      setIsTyping,
    ]
  );

  return { handleAiConversation, handleActionClick, sendAiMessage };
}

