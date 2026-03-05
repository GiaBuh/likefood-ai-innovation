import { useCallback } from 'react';
import type { Product, ProductVariant } from '../../types';
import type { AiChatLanguage, AiChatContext } from '../../services/shopApi';
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
  detectLanguage,
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
  chatLanguage: AiChatLanguage | null;
  setChatLanguage: (l: AiChatLanguage | null) => void;
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
    chatLanguage,
    setChatLanguage,
    setIsTyping,
    onOpenProduct,
    onGoToCheckout,
    onGoToOrders,
  } = params;

  const activeLang: AiChatLanguage = chatLanguage || 'vi';
  const t = (viText: string, enText: string) => (activeLang === 'en' ? enText : viText);

  const pushAiMessage = useCallback(
    (text: string, actions?: ChatAction[]) => {
      const botMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
        sender: 'bot',
        timestamp: new Date(),
        actions,
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
        t(
          `Đã thêm ${quantity} x ${product.name} (${variant.weight}) vào giỏ hàng. Bạn có muốn thanh toán ngay không?`,
          `Added ${quantity} x ${product.name} (${variant.weight}) to your cart. Do you want to checkout now?`
        ),
        [
          { id: 'checkout-yes', label: t('Thanh toán ngay', 'Checkout now'), type: 'confirm_yes' },
          { id: 'checkout-no', label: t('Để sau', 'Later'), type: 'confirm_no' },
        ]
      );
      setAiStage('awaiting_checkout_confirmation');
    },
    [pendingProduct, pendingVariant, addToCart, pushAiMessage, t, setAiStage]
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
            t(`Bạn muốn thêm ${product.name} với số lượng bao nhiêu?`, `How many of ${product.name} would you like to add?`),
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
            t(
              `Sản phẩm này có quy cách ${product.variants[0].weight}. Bạn muốn lấy bao nhiêu?`,
              `This product has ${product.variants[0].weight}. How many would you like?`
            ),
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
        t(`"${product.name}" có nhiều quy cách. Bạn chọn loại nào?`, `"${product.name}" has multiple variants. Which one would you like?`),
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
      t,
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
            t(
              `Với ngân sách khoảng ${budgetLabel}, em gợi ý các món phù hợp: ${productList}. Bạn muốn xem món nào?`,
              `With a budget around ${budgetLabel}, I suggest: ${productList}. Which one would you like?`
            ),
            inBudget.flatMap((product) => [
              { id: `view-${product.id}`, label: t(`Xem ${product.name}`, `View ${product.name}`), type: 'open_product', productId: String(product.id) },
              { id: `buy-${product.id}`, label: t(`Mua ${product.name}`, `Buy ${product.name}`), type: 'select_product', productId: String(product.id) },
            ])
          );
          return;
        }
        const budgetLabel = formatBudgetDisplay(budget);
        pushAiMessage(
          t(
            `Hiện em chưa có món nào trong tầm ${budgetLabel}. Bạn thử tăng ngân sách hoặc hỏi món khác nhé.`,
            `We don't have items within ${budgetLabel}. Try a higher budget or ask for other products.`
          )
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
          const qtyText = qty ? t(` (số lượng ${qty})`, ` (quantity ${qty})`) : '';
          pushAiMessage(
            t(`Tôi tìm thấy "${best.name}"${qtyText}. Bạn có muốn thêm món này vào giỏ hàng không?`, `I found "${best.name}"${qtyText}. Would you like to add it to cart?`),
            [
              { id: 'add-yes', label: t('Có, thêm vào giỏ', 'Yes, add to cart'), type: 'confirm_yes' },
              { id: 'add-no', label: t('Không', 'No'), type: 'confirm_no' },
            ]
          );
          return;
        }

        const actions: ChatAction[] = topMatches.flatMap((product) => [
          { id: `view-${product.id}`, label: t(`Xem ${product.name}`, `View ${product.name}`), type: 'open_product', productId: String(product.id) },
          { id: `buy-${product.id}`, label: t(`Mua ${product.name}`, `Buy ${product.name}`), type: 'select_product', productId: String(product.id) },
        ]);

        pushAiMessage(
          t(
            `Tôi tìm thấy ${topMatches.length} sản phẩm phù hợp: ${topMatches.map((item) => item.name).join(', ')}.`,
            `I found ${topMatches.length} relevant products: ${topMatches.map((item) => item.name).join(', ')}.`
          ),
          actions
        );
        return;
      }

      if (greetingIntent && !browseIntent && !recommendIntent && products.length > 0) {
        pushAiMessage(
          t(
            'Chào bạn! Em là trợ lý bán hàng của LikeFood. Hôm nay anh/chị muốn tìm món gì ạ?',
            "Hello! I'm LikeFood's shopping assistant. What are you looking for today?"
          )
        );
        return;
      }

      if ((browseIntent || recommendIntent) && products.length > 0) {
        const featured = products.slice(0, 4);
        pushAiMessage(
          t(
            `${greetingIntent ? 'Chào bạn! ' : ''}Hiện tại shop có các món nổi bật: ${featured.map((item) => item.name).join(', ')}. Bạn muốn xem món nào?`,
            `${greetingIntent ? 'Hello! ' : ''}Here are our featured items: ${featured.map((item) => item.name).join(', ')}. Which one interests you?`
          ),
          featured.flatMap((product) => [
            { id: `view-${product.id}`, label: t(`Xem ${product.name}`, `View ${product.name}`), type: 'open_product', productId: String(product.id) },
            { id: `buy-${product.id}`, label: t(`Mua ${product.name}`, `Buy ${product.name}`), type: 'select_product', productId: String(product.id) },
          ])
        );
        return;
      }

      if (domainIntent && products.length > 0) {
        const suggestions = findSuggestionProductsWhenNoMatch(trimmed, products, 4);
        const productList = suggestions.map((p) => p.name).join(', ');
        pushAiMessage(
          t(
            `Hiện tại bên em không có món tương tự vậy, nhưng có các món sau: ${productList}. Anh/chị muốn xem món nào ạ?`,
            `We don't have that exact item right now, but here are some suggestions: ${productList}. Would you like to check any of these?`
          ),
          suggestions.flatMap((product) => [
            { id: `view-${product.id}`, label: t(`Xem ${product.name}`, `View ${product.name}`), type: 'open_product', productId: String(product.id) },
            { id: `buy-${product.id}`, label: t(`Mua ${product.name}`, `Buy ${product.name}`), type: 'select_product', productId: String(product.id) },
          ])
        );
        return;
      }

      pushAiMessage(
        t(
          'Xin lỗi, tôi chỉ hỗ trợ tư vấn sản phẩm và đặt hàng trên hệ thống LikeFood. Bạn hãy hỏi về tên món, quy cách (500g/1kg), giá hoặc yêu cầu thêm vào giỏ hàng nhé.',
          'Sorry, I only support product consultation and ordering on LikeFood. Ask me product names, variants (500g/1kg), prices, or add-to-cart requests.'
        )
      );
    },
    [products, pushAiMessage, t, setPendingProduct, setPendingQuantity, setAiStage]
  );

  const handleAiConversation = useCallback(
    async (input: string, contextMessages: Message[], requestLanguage: AiChatLanguage) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      if (isPaymentIntent(trimmed)) {
        pushAiMessage(t('Đang chuyển đến trang thanh toán...', 'Redirecting to checkout...'));
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
            t(
              'Không sao nhé. Bạn có thể hỏi món khác, tôi sẽ gợi ý tiếp theo dữ liệu sản phẩm.',
              'No worries. Ask another product and I will suggest from our catalog.'
            )
          );
          resetPendingSelection();
          return;
        }
        pushAiMessage(
          t(
            'Bạn giúp xác nhận "có" để thêm vào giỏ hoặc "không" nếu chưa cần nhé.',
            'Please confirm with "yes" to add to cart or "no" if not now.'
          )
        );
        return;
      }

      if (aiStage === 'awaiting_variant' && pendingProduct) {
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
              t(`Bạn muốn thêm ${pendingProduct.name} (${variant.weight}) với số lượng bao nhiêu?`, `How many ${pendingProduct.name} (${variant.weight}) would you like?`),
              [
                { id: 'qty-1', label: '1', type: 'select_quantity', quantity: 1 },
                { id: 'qty-2', label: '2', type: 'select_quantity', quantity: 2 },
                { id: 'qty-3', label: '3', type: 'select_quantity', quantity: 3 },
              ]
            );
          }
        } else {
          pushAiMessage(
            t(
              'Tôi chưa hiểu quy cách bạn chọn. Bạn thử nhập lại đúng dạng như "500g" hoặc bấm nút bên dưới.',
              'I could not parse the variant. Please type like "500g" or tap one of the options.'
            )
          );
        }
        return;
      }

      if (aiStage === 'awaiting_quantity') {
        const quantity = parseQuantity(trimmed);
        if (!quantity) {
          pushAiMessage(t('Bạn nhập giúp số lượng hợp lệ (ví dụ: 1, 2, 3...).', 'Please enter a valid quantity (e.g. 1, 2, 3...).'));
          return;
        }
        addPendingItemToCart(quantity);
        return;
      }

      if (aiStage === 'awaiting_checkout_confirmation') {
        if (isAffirmative(trimmed) || isPaymentIntent(trimmed)) {
          pushAiMessage(t('Đang chuyển đến trang thanh toán...', 'Redirecting to checkout...'));
          onGoToCheckout();
          resetPendingSelection();
          return;
        }
        if (isNegative(trimmed)) {
          pushAiMessage(
            t(
              'Ok bạn nhé. Khi cần thanh toán, bạn vào giỏ hàng hoặc nhấn "Đi đến thanh toán" bất kỳ lúc nào.',
              'Sure. You can checkout anytime from the cart or by tapping "Go to Checkout".'
            )
          );
          resetPendingSelection();
          return;
        }
        pushAiMessage(t('Bạn trả lời "có" để thanh toán ngay hoặc "không" để tiếp tục mua sắm nhé.', 'Reply "yes" to checkout now or "no" to continue shopping.'));
        return;
      }

      const useLocalOnly = true;
      if (useLocalOnly) {
        fallbackLocalAiResponse(trimmed);
        return;
      }

      try {
        const aiResponse = await askAiAssistant(trimmed, toAiHistory(contextMessages), requestLanguage, aiContext);
        if (aiResponse.language) setChatLanguage(aiResponse.language);
        if (aiResponse.nextContext) {
          setAiContext(aiResponse.nextContext);
          if (aiResponse.nextContext.awaiting === 'AWAITING_VARIANT_OR_QUANTITY' && aiResponse.nextContext.selectedProductId) {
            const p = products.find((item) => String(item.id) === String(aiResponse.nextContext!.selectedProductId));
            if (p) {
              setPendingProduct(p);
              setAiStage('awaiting_variant');
              if (aiResponse.cartInstruction?.quantity) setPendingQuantity(aiResponse.cartInstruction.quantity);
            }
          }
          if (aiResponse.nextContext.awaiting === 'AWAITING_CHECKOUT') setAiStage('awaiting_checkout_confirmation');
        }
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
        const responseActions: ChatAction[] = (aiResponse.actions || []).map((action, index) => ({
          id: `${Date.now()}-${index}-${action.type}`,
          label: action.label,
          type: action.type,
          productId: action.productId,
          variantId: action.variantId,
          quantity: action.quantity,
          command: action.command,
        }));
        pushAiMessage(aiResponse.reply, responseActions.length > 0 ? responseActions : undefined);
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
      setAiContext,
      setChatLanguage,
      onGoToCheckout,
      t,
    ]
  );

  const sendAiMessage = useCallback(
    (input: string, contextMessages: Message[], requestLanguage: AiChatLanguage) => {
      setTimeout(async () => {
        try {
          await handleAiConversation(input, contextMessages, requestLanguage);
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
                t(`Bạn muốn thêm ${product.name} (${variant.weight}) với số lượng bao nhiêu?`, `How many ${product.name} (${variant.weight}) would you like?`),
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
        sendAiMessage(action.command, [...aiMessages, userActionMessage], activeLang);
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
            pushAiMessage(t('Sản phẩm vừa chọn không còn tồn tại trong hệ thống. Bạn thử chọn món khác nhé.', 'The selected product is no longer available. Please choose another one.'));
            setIsTyping(false);
            return;
          }
          setPendingProduct(product);
          setAiStage('awaiting_add_confirmation');
          pushAiMessage(t(`Bạn muốn thêm "${product.name}" vào giỏ hàng không?`, `Do you want to add "${product.name}" to cart?`), [
            { id: 'add-yes', label: t('Có, thêm vào giỏ', 'Yes, add to cart'), type: 'confirm_yes' },
            { id: 'add-no', label: t('Không', 'No'), type: 'confirm_no' },
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
            pushAiMessage(t('Bạn bấm nút bên dưới để chuyển đến trang thanh toán.', 'Tap a button below to go to checkout.'), [
              { id: 'go-checkout', label: t('Đi đến thanh toán', 'Go to Checkout'), type: 'go_checkout' },
              { id: 'go-orders', label: t('Xem đơn hàng', 'View Orders'), type: 'go_orders' },
            ]);
            resetPendingSelection();
            setIsTyping(false);
            return;
          }
        }

        if (action.type === 'confirm_no') {
          if (aiStage === 'awaiting_add_confirmation') {
            pushAiMessage(t('Ok bạn nhé. Bạn có thể hỏi tên món khác để tôi tư vấn tiếp.', 'Sure. You can ask another product and I will help you.'));
            resetPendingSelection();
          } else if (aiStage === 'awaiting_checkout_confirmation') {
            pushAiMessage(t('Ok, tôi sẽ giữ giỏ hàng để bạn tiếp tục mua sắm.', 'Okay, I will keep the items in your cart.'));
            resetPendingSelection();
          }
          setIsTyping(false);
          return;
        }

        if (action.type === 'select_variant') {
          const product = action.productId ? products.find((p) => String(p.id) === String(action.productId)) : pendingProduct;
          if (!product) {
            pushAiMessage(t('Sản phẩm không còn tồn tại. Bạn thử chọn lại nhé.', 'Product no longer available. Please try again.'));
            setIsTyping(false);
            return;
          }
          const variant = product.variants?.find((item) => item.id === action.variantId);
          if (!variant) {
            pushAiMessage(t('Quy cách vừa chọn không hợp lệ. Bạn thử chọn lại nhé.', 'The selected variant is invalid. Please choose again.'));
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
              t(`Bạn muốn thêm ${product.name} (${variant.weight}) với số lượng bao nhiêu?`, `How many ${product.name} (${variant.weight}) would you like?`),
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
      t,
      activeLang,
    ]
  );

  return { handleAiConversation, handleActionClick, sendAiMessage, detectLanguage };
}
