import { useCallback } from 'react';
import type { Product, ProductVariant } from '../../types';
import type { AiChatContext } from '../../services/shopApi';
import { askAiAssistant } from '../../services/shopApi';
import {
  normalize,
  parseQuantity,
  parseBudget,
  budgetToUsd,
  formatBudgetDisplay,
  formatProductPrice,
  parseVariant,
  getProductMinPrice,
  findRelevantProducts,
  findSuggestionProductsWhenNoMatch,
  isAffirmative,
  isNegative,
  isPaymentIntent,
  isViewDetailIntent,
  isCancelIntent,
} from './chatUtils';
import type { ChatAction, Message } from './chatTypes';

type UseChatAiParams = {
  products: Product[];
  addToCart: (product: Product, qty: number) => void;
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
    setIsTyping,
    onOpenProduct,
    onGoToCheckout,
    onGoToOrders,
  } = params;

  const pushAiMessage = useCallback(
    (
      text: string,
      actions?: ChatAction[],
      formatProfile?: MessageFormatProfile
    ) => {
      const botMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
        sender: 'bot',
        timestamp: new Date(),
        actions,
        formatProfile,
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
      setAiContext(nextContext);

      if (!nextContext.awaiting || nextContext.awaiting === 'NONE') {
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
    [products, setAiContext, setAiStage, setPendingProduct, setPendingQuantity]
  );

  const addPendingItemToCart = useCallback(
    (quantity: number, productOverride?: Product | null, variantOverride?: ProductVariant | null) => {
      const product = productOverride ?? pendingProduct;
      const variant = variantOverride ?? pendingVariant;
      if (!product || !variant) return;

      addToCart(
        {
          ...product,
          weight: variant.weight,
          variantId: variant.id,
          price: variant.price,
        },
        quantity
      );

      pushAiMessage(
        `Đã thêm ${quantity} x ${product.name} (${variant.weight}) vào giỏ hàng. Bạn có muốn thanh toán ngay không?`,
        [
          { id: 'checkout-yes', label: 'Thanh toán ngay', type: 'confirm_yes' },
          { id: 'checkout-no', label: 'Để sau', type: 'confirm_no' },
        ]
      );
      setAiStage('awaiting_checkout_confirmation');
    },
    [pendingProduct, pendingVariant, addToCart, pushAiMessage, setAiStage]
  );

  const askForVariantOrQuantity = useCallback(
    (product: Product) => {
      const qty = pendingQuantity;
      if (!product.variants || product.variants.length === 0) {
        setPendingVariant({
          id: String(product.variantId || `${product.id}-default`),
          weight: product.weight || 'Default',
          price: product.price,
        });
        if (qty) {
          addPendingItemToCart(qty, product, {
            id: String(product.variantId || `${product.id}-default`),
            weight: product.weight || 'Default',
            price: product.price,
          } as ProductVariant);
          setPendingQuantity(null);
        } else {
          setAiStage('awaiting_quantity');
          pushAiMessage(
            `Bạn muốn thêm ${product.name} với số lượng bao nhiêu?`,
            [
              { id: 'qty-1', label: '1', type: 'select_quantity', quantity: 1 },
              { id: 'qty-2', label: '2', type: 'select_quantity', quantity: 2 },
              { id: 'qty-3', label: '3', type: 'select_quantity', quantity: 3 },
            ]
          );
        }
        return;
      }

      if (product.variants.length === 1) {
        setPendingVariant(product.variants[0]);
        if (qty) {
          addPendingItemToCart(qty, product, product.variants[0]);
          setPendingQuantity(null);
        } else {
          setAiStage('awaiting_quantity');
          pushAiMessage(
            `Sản phẩm này có quy cách ${product.variants[0].weight}. Bạn muốn lấy bao nhiêu?`,
            [
              { id: 'qty-1', label: '1', type: 'select_quantity', quantity: 1 },
              { id: 'qty-2', label: '2', type: 'select_quantity', quantity: 2 },
              { id: 'qty-3', label: '3', type: 'select_quantity', quantity: 3 },
            ]
          );
        }
        return;
      }

      if (qty) setPendingQuantity(qty);
      setAiStage('awaiting_variant');
      pushAiMessage(
        `"${product.name}" có nhiều quy cách. Bạn chọn loại nào?`,
        product.variants.slice(0, 6).map((variant) => ({
          id: `variant-${variant.id}`,
          label: variant.weight,
          type: 'select_variant',
          variantId: variant.id,
          productId: String(product.id),
          quantity: qty ?? undefined,
        }))
      );
    },
    [
      pendingQuantity,
      setPendingVariant,
      setPendingQuantity,
      setAiStage,
      addPendingItemToCart,
      pushAiMessage,
    ]
  );

  const fallbackLocalAiResponse = useCallback(
    (trimmed: string) => {
      const normalizedInput = normalize(trimmed);
      const addIntent =
        normalizedInput.includes('them vao gio') ||
        normalizedInput.includes('mua') ||
        normalizedInput.includes('dat') ||
        normalizedInput.includes('lay');
      const recommendIntent =
        normalizedInput.includes('goi y') ||
        normalizedInput.includes('tu van') ||
        normalizedInput.includes('nen mua') ||
        normalizedInput.includes('recommend');
      const greetingIntent =
        normalizedInput.includes('xin chao') ||
        normalizedInput === 'chao' ||
        normalizedInput === 'hello' ||
        normalizedInput === 'hi' ||
        normalizedInput.startsWith('chao ');
      const browseIntent =
        normalizedInput.includes('co gi') ||
        normalizedInput.includes('mon gi') ||
        normalizedInput.includes('menu') ||
        normalizedInput.includes('danh sach') ||
        normalizedInput.includes('gi ngon') ||
        normalizedInput.includes('an gi') ||
        normalizedInput.includes('hom nay') ||
        normalizedInput.includes('co mon') ||
        normalizedInput.includes('san pham gi');
      const domainIntent =
        addIntent ||
        recommendIntent ||
        greetingIntent ||
        browseIntent ||
        normalizedInput.includes('san pham') ||
        normalizedInput.includes('mon') ||
        normalizedInput.includes('gia') ||
        normalizedInput.includes('kg') ||
        normalizedInput.includes('g') ||
        normalizedInput.includes('gio hang');

      const budgetIntent =
        /(\d+)\s*(\$|usd|us|do|dola|dollar|k|ngan|nghin|trieu|vnd)/i.test(trimmed) ||
        normalizedInput.includes('co khoang') ||
        normalizedInput.includes('dang co') ||
        ((normalizedInput.includes('toi co') || normalizedInput.includes('minh co')) && /\d/.test(trimmed)) ||
        normalizedInput.includes('gia phu hop') ||
        normalizedInput.includes('trong tam') ||
        normalizedInput.includes('within budget') ||
        normalizedInput.includes('afford');

      const budget = parseBudget(trimmed);
      if (budgetIntent && budget != null && budget.amount > 0 && products.length > 0) {
        const budgetUsd = budgetToUsd(budget);
        const inBudget = products
          .filter((p) => {
            const minPrice = getProductMinPrice(p);
            return minPrice > 0 && minPrice <= budgetUsd;
          })
          .sort((a, b) => getProductMinPrice(b) - getProductMinPrice(a))
          .slice(0, 6);
        if (inBudget.length > 0) {
          const budgetLabel = formatBudgetDisplay(budget);
          const productList = inBudget.map((p) => `${p.name} (từ ${formatProductPrice(getProductMinPrice(p))})`).join(', ');
          pushAiMessage(
            `Với ngân sách khoảng ${budgetLabel}, em gợi ý các món phù hợp: ${productList}. Bạn muốn xem món nào?`,
            inBudget.flatMap((product) => [
              { id: `view-${product.id}`, label: `Xem ${product.name}`, type: 'open_product', productId: String(product.id) },
              { id: `buy-${product.id}`, label: `Mua ${product.name}`, type: 'select_product', productId: String(product.id) },
            ])
          );
          return;
        }
        const budgetLabel = formatBudgetDisplay(budget);
        pushAiMessage(
          `Hiện em chưa có món nào trong tầm ${budgetLabel}. Bạn thử tăng ngân sách hoặc hỏi món khác nhé.`
        );
        return;
      }

      const matches = findRelevantProducts(trimmed, products);

      if (matches.length > 0) {
        const topMatches = matches.slice(0, 4);
        const best = topMatches[0];
        if (addIntent && best) {
          const qty = parseQuantity(trimmed);
          setPendingProduct(best);
          setPendingQuantity(qty);
          setAiStage('awaiting_add_confirmation');
          const qtyText = qty ? ` (số lượng ${qty})` : '';
          pushAiMessage(
            `Tôi tìm thấy "${best.name}"${qtyText}. Bạn có muốn thêm món này vào giỏ hàng không?`,
            [
              { id: 'add-yes', label: 'Có, thêm vào giỏ', type: 'confirm_yes' },
              { id: 'add-no', label: 'Không', type: 'confirm_no' },
            ]
          );
          return;
        }

        const actions: ChatAction[] = topMatches.flatMap((product) => [
          { id: `view-${product.id}`, label: `Xem ${product.name}`, type: 'open_product', productId: String(product.id) },
          { id: `buy-${product.id}`, label: `Mua ${product.name}`, type: 'select_product', productId: String(product.id) },
        ]);

        pushAiMessage(
          `Tôi tìm thấy ${topMatches.length} sản phẩm phù hợp: ${topMatches.map((item) => item.name).join(', ')}.`,
          actions
        );
        return;
      }

      if (greetingIntent && !browseIntent && !recommendIntent && products.length > 0) {
        pushAiMessage(
          'Chào bạn! Em là trợ lý bán hàng của LikeFood. Hôm nay anh/chị muốn tìm món gì ạ?'
        );
        return;
      }

      if ((browseIntent || recommendIntent) && products.length > 0) {
        const featured = products.slice(0, 4);
        pushAiMessage(
          `${greetingIntent ? 'Chào bạn! ' : ''}Hiện tại shop có các món nổi bật: ${featured.map((item) => item.name).join(', ')}. Bạn muốn xem món nào?`,
          featured.flatMap((product) => [
            { id: `view-${product.id}`, label: `Xem ${product.name}`, type: 'open_product', productId: String(product.id) },
            { id: `buy-${product.id}`, label: `Mua ${product.name}`, type: 'select_product', productId: String(product.id) },
          ])
        );
        return;
      }

      if (domainIntent && products.length > 0) {
        const suggestions = findSuggestionProductsWhenNoMatch(trimmed, products, 4);
        const productList = suggestions.map((p) => p.name).join(', ');
        pushAiMessage(
          `Hiện tại bên em không có món tương tự vậy, nhưng có các món sau: ${productList}. Anh/chị muốn xem món nào ạ?`,
          suggestions.flatMap((product) => [
            { id: `view-${product.id}`, label: `Xem ${product.name}`, type: 'open_product', productId: String(product.id) },
            { id: `buy-${product.id}`, label: `Mua ${product.name}`, type: 'select_product', productId: String(product.id) },
          ])
        );
        return;
      }

      pushAiMessage(
        'Xin lỗi, tôi chỉ hỗ trợ tư vấn sản phẩm và đặt hàng trên hệ thống LikeFood. Bạn hãy hỏi về tên món, quy cách (500g/1kg), giá hoặc yêu cầu thêm vào giỏ hàng nhé.'
      );
    },
    [products, pushAiMessage, setPendingProduct, setPendingQuantity, setAiStage]
  );

  const handleAiConversation = useCallback(
    async (input: string, contextMessages: Message[]) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      if (isPaymentIntent(trimmed)) {
        pushAiMessage('Đang chuyển đến trang thanh toán...');
        onGoToCheckout();
        resetPendingSelection();
        return;
      }

      if (aiStage === 'awaiting_add_confirmation' && pendingProduct) {
        if (isAffirmative(trimmed)) {
          askForVariantOrQuantity(pendingProduct);
          return;
        }
        if (isNegative(trimmed)) {
          pushAiMessage(
            'Dạ không sao ạ. Anh/chị có thể hỏi món khác, em sẽ gợi ý tiếp theo dữ liệu sản phẩm.'
          );
          resetPendingSelection();
          return;
        }
        // Let backend AI handle follow-up questions (e.g. "giải thích món đó")
        // while preserving current context instead of forcing yes/no locally.
      }

      if (aiStage === 'awaiting_variant' && pendingProduct) {
        if (isViewDetailIntent(trimmed)) {
          onOpenProduct(String(pendingProduct.id));
          pushAiMessage(
            `Đang mở chi tiết sản phẩm "${pendingProduct.name}" cho bạn xem.`
          );
          return;
        }
        if (isCancelIntent(trimmed)) {
          pushAiMessage(
            'Đã hủy. Bạn có thể hỏi món khác hoặc tìm sản phẩm mới nhé.'
          );
          resetPendingSelection();
          return;
        }
        const variant = parseVariant(trimmed, pendingProduct);
        const quantityFromMessage = parseQuantity(trimmed);
        const qtyToUse = quantityFromMessage ?? pendingQuantity;
        if (variant) {
          setPendingVariant(variant);
          if (qtyToUse) {
            addPendingItemToCart(qtyToUse, pendingProduct, variant);
            setPendingQuantity(null);
          } else {
            setAiStage('awaiting_quantity');
            pushAiMessage(
              `Bạn muốn thêm ${pendingProduct.name} (${variant.weight}) với số lượng bao nhiêu?`,
              [
                { id: 'qty-1', label: '1', type: 'select_quantity', quantity: 1 },
                { id: 'qty-2', label: '2', type: 'select_quantity', quantity: 2 },
                { id: 'qty-3', label: '3', type: 'select_quantity', quantity: 3 },
              ]
            );
          }
          return;
        }
        // Not a variant, not a known local intent — fall through to backend AI
        // and keep current context.
      }

      if (aiStage === 'awaiting_quantity') {
        if (isViewDetailIntent(trimmed) && pendingProduct) {
          onOpenProduct(String(pendingProduct.id));
          pushAiMessage(
            `Đang mở chi tiết sản phẩm "${pendingProduct.name}" cho bạn xem.`
          );
          return;
        }
        if (isCancelIntent(trimmed)) {
          pushAiMessage(
            'Đã hủy. Bạn có thể hỏi món khác hoặc tìm sản phẩm mới nhé.'
          );
          resetPendingSelection();
          return;
        }
        const quantity = parseQuantity(trimmed);
        if (quantity) {
          addPendingItemToCart(quantity);
          return;
        }
        // Not a quantity, not a known local intent — fall through to backend AI
        // and keep current context.
      }

      if (aiStage === 'awaiting_checkout_confirmation') {
        if (isAffirmative(trimmed) || isPaymentIntent(trimmed)) {
          pushAiMessage('Đang chuyển đến trang thanh toán...');
          onGoToCheckout();
          resetPendingSelection();
          return;
        }
        if (isNegative(trimmed)) {
          pushAiMessage(
            'Ok bạn nhé. Khi cần thanh toán, bạn vào giỏ hàng hoặc nhấn "Đi đến thanh toán" bất kỳ lúc nào.'
          );
          resetPendingSelection();
          return;
        }
        pushAiMessage('Bạn trả lời "có" để thanh toán ngay hoặc "không" để tiếp tục mua sắm nhé.');
        return;
      }

      const useLocalOnly = false;
      if (useLocalOnly) {
        fallbackLocalAiResponse(trimmed);
        return;
      }

      try {
        const aiResponse = await askAiAssistant(trimmed, toAiHistory(contextMessages), 'vi', aiContext);
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
        const composedReply = aiResponse.reply;
        pushAiMessage(
          composedReply,
          responseActions.length > 0 ? responseActions : undefined,
          aiResponse.recommendationMeta?.formatProfile ?? resolveFormatProfileFallback(composedReply)
        );
      } catch (error) {
        console.error('Cannot get Gemini response from backend.', error);
        fallbackLocalAiResponse(trimmed);
      }
    },
    [
      aiStage,
      pendingProduct,
      pendingQuantity,
      fallbackLocalAiResponse,
      askForVariantOrQuantity,
      pushAiMessage,
      resetPendingSelection,
      addPendingItemToCart,
      products,
      aiContext,
      addToCart,
      setAiStage,
      setPendingProduct,
      setPendingQuantity,
      syncStateFromContext,
      onGoToCheckout,
      onOpenProduct,
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

      if ((action.type === 'confirm-product' || action.type === 'reject-product') && action.command) {
        const userActionMessage: Message = {
          id: `${Date.now()}-action`,
          text: action.label,
          sender: 'user',
          timestamp: new Date(),
        };
        setAiMessages((prev) => [...prev, userActionMessage]);
        setIsTyping(true);
        sendAiMessage(action.command, [...aiMessages, userActionMessage]);
        return;
      }

      if (action.type === 'choose-variant' && action.productId) {
        const variantId = action.variantId ?? action.command?.replace(/^\/choose-variant:/, '').trim();
        if (variantId) {
          const product = products.find((p) => String(p.id) === String(action.productId));
          const variant = product?.variants?.find((v) => String(v.id) === String(variantId));
          if (product && variant) {
            setPendingProduct(product);
            setPendingVariant(variant);
            const qty = action.quantity ?? pendingQuantity;
            if (qty) {
              addPendingItemToCart(qty, product, variant);
              setPendingQuantity(null);
            } else {
              setAiStage('awaiting_quantity');
              pushAiMessage(
                `Bạn muốn thêm ${product.name} (${variant.weight}) với số lượng bao nhiêu?`,
                [
                  { id: 'qty-1', label: '1', type: 'select_quantity', quantity: 1 },
                  { id: 'qty-2', label: '2', type: 'select_quantity', quantity: 2 },
                  { id: 'qty-3', label: '3', type: 'select_quantity', quantity: 3 },
                ]
              );
            }
            setAiMessages((prev) => [...prev, { id: `${Date.now()}-u`, text: action.label, sender: 'user', timestamp: new Date() }]);
            return;
          }
        }
      }
      if (action.type === 'choose-qty') {
        const qty = action.quantity ?? (action.command ? parseInt(action.command.replace(/^\/choose-qty:/, '').trim(), 10) : NaN);
        const product = action.productId ? products.find((p) => String(p.id) === String(action.productId)) : pendingProduct;
        const vid = action.variantId || aiContext?.selectedVariantId;
        const variant = pendingVariant ?? (product && vid ? product.variants?.find((v) => String(v.id) === String(vid)) : undefined);
        if (!Number.isNaN(qty) && qty >= 1 && qty <= 99 && product && variant) {
          addPendingItemToCart(qty, product, variant);
          setPendingQuantity(null);
          setAiMessages((prev) => [...prev, { id: `${Date.now()}-u`, text: action.label, sender: 'user', timestamp: new Date() }]);
          return;
        }
      }

      if (action.command) {
        const userActionMessage: Message = {
          id: `${Date.now()}-action`,
          text: action.label,
          sender: 'user',
          timestamp: new Date(),
        };
        setAiMessages((prev) => [...prev, userActionMessage]);
        setIsTyping(true);
        sendAiMessage(action.command, [...aiMessages, userActionMessage]);
        return;
      }

      const userActionMessage: Message = {
        id: `${Date.now()}-action`,
        text: action.label,
        sender: 'user',
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, userActionMessage]);
      setIsTyping(true);

      setTimeout(() => {
        if (action.type === 'select_product') {
          const product = products.find((item) => String(item.id) === action.productId);
          if (!product) {
            pushAiMessage('Sản phẩm vừa chọn không còn tồn tại trong hệ thống. Bạn thử chọn món khác nhé.');
            setIsTyping(false);
            return;
          }
          setPendingProduct(product);
          setAiStage('awaiting_add_confirmation');
          pushAiMessage(`Bạn muốn thêm "${product.name}" vào giỏ hàng không?`, [
            { id: 'add-yes', label: 'Có, thêm vào giỏ', type: 'confirm_yes' },
            { id: 'add-no', label: 'Không', type: 'confirm_no' },
          ]);
          setIsTyping(false);
          return;
        }

        if (action.type === 'confirm_yes') {
          if (aiStage === 'awaiting_add_confirmation' && pendingProduct) {
            askForVariantOrQuantity(pendingProduct);
            setIsTyping(false);
            return;
          }
          if (aiStage === 'awaiting_checkout_confirmation') {
            pushAiMessage('Bạn bấm nút bên dưới để chuyển đến trang thanh toán.', [
              { id: 'go-checkout', label: 'Đi đến thanh toán', type: 'go_checkout' },
              { id: 'go-orders', label: 'Xem đơn hàng', type: 'go_orders' },
            ]);
            resetPendingSelection();
            setIsTyping(false);
            return;
          }
        }

        if (action.type === 'confirm_no') {
          if (aiStage === 'awaiting_add_confirmation') {
            pushAiMessage('Ok bạn nhé. Bạn có thể hỏi tên món khác để tôi tư vấn tiếp.');
            resetPendingSelection();
          } else if (aiStage === 'awaiting_checkout_confirmation') {
            pushAiMessage('Ok, tôi sẽ giữ giỏ hàng để bạn tiếp tục mua sắm.');
            resetPendingSelection();
          }
          setIsTyping(false);
          return;
        }

        if (action.type === 'select_variant') {
          const product = action.productId ? products.find((p) => String(p.id) === String(action.productId)) : pendingProduct;
          if (!product) {
            pushAiMessage('Sản phẩm không còn tồn tại. Bạn thử chọn lại nhé.');
            setIsTyping(false);
            return;
          }
          const variant = product.variants?.find((item) => item.id === action.variantId);
          if (!variant) {
            pushAiMessage('Quy cách vừa chọn không hợp lệ. Bạn thử chọn lại nhé.');
            setIsTyping(false);
            return;
          }
          setPendingProduct(product);
          setPendingVariant(variant);
          const qtyToUse = action.quantity ?? pendingQuantity;
          if (qtyToUse) {
            addPendingItemToCart(qtyToUse, product, variant);
            setPendingQuantity(null);
          } else {
            setAiStage('awaiting_quantity');
            pushAiMessage(
              `Bạn muốn thêm ${product.name} (${variant.weight}) với số lượng bao nhiêu?`,
              [
                { id: 'qty-1', label: '1', type: 'select_quantity', quantity: 1 },
                { id: 'qty-2', label: '2', type: 'select_quantity', quantity: 2 },
                { id: 'qty-3', label: '3', type: 'select_quantity', quantity: 3 },
              ]
            );
          }
          setIsTyping(false);
          return;
        }

        if (action.type === 'select_quantity') {
          addPendingItemToCart(action.quantity!);
          setIsTyping(false);
          return;
        }

        setIsTyping(false);
      }, 400);
    },
    [
      products,
      pendingProduct,
      pendingVariant,
      pendingQuantity,
      aiStage,
      aiContext,
      onOpenProduct,
      onGoToCheckout,
      onGoToOrders,
      setAiMessages,
      setPendingProduct,
      setPendingVariant,
      setPendingQuantity,
      setAiStage,
      pushAiMessage,
      askForVariantOrQuantity,
      addPendingItemToCart,
      resetPendingSelection,
      sendAiMessage,
      aiMessages,
    ]
  );

  return { handleAiConversation, handleActionClick, sendAiMessage };
}
