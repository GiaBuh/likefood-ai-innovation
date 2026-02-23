
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Product, ProductVariant, User } from '../../types';
import { useShop } from '../../contexts/ShopContext';
import { useToast } from '../../contexts/ToastContext';
import {
  AiChatContext,
  AiChatLanguage,
  AiChatTurn,
  askAiAssistant,
  getMyChatMessages,
  sendChatMessageAsUser,
} from '../../services/shopApi';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';

interface ChatWidgetProps {
  user: User | null;
  onOpenLogin: () => void;
  onGoToCheckout: () => void;
  onGoToOrders: () => void;
  onOpenProduct: (productId: string) => void;
}

type ChatAction = {
  id: string;
  label: string;
  type: string;
  productId?: string;
  variantId?: string;
  quantity?: number;
  command?: string;
};

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  actions?: ChatAction[];
}

type ChatView = 'menu' | 'admin' | 'ai';
type AiStage = 'idle' | 'awaiting_add_confirmation' | 'awaiting_variant' | 'awaiting_quantity' | 'awaiting_checkout_confirmation';

type PersistedMessage = Omit<Message, 'timestamp'> & { timestamp: string };

type PersistedChatState = {
  activeView: ChatView;
  adminMessages: PersistedMessage[];
  aiMessages: PersistedMessage[];
  chatLanguage: AiChatLanguage | null;
  aiContext: AiChatContext;
};

const CHAT_STORAGE_PREFIX = 'likefood_chat_state';

const createDefaultAdminMessages = (): Message[] => [
  {
    id: 'welcome-admin',
    text: 'Hello! I am a support agent. How can I help you with your order today?',
    sender: 'bot',
    timestamp: new Date(),
  },
];

const createDefaultAiMessages = (): Message[] => [
  {
    id: 'welcome-ai',
    text: 'Xin chào! Tôi là AI Food Assistant. Bạn cứ hỏi tên món/sản phẩm, tôi sẽ tư vấn theo dữ liệu hệ thống và hỗ trợ thêm vào giỏ hàng cho bạn.',
    sender: 'bot',
    timestamp: new Date(),
  },
];

const serializeMessages = (messages: Message[]): PersistedMessage[] =>
  messages.map((item) => ({
    ...item,
    timestamp: item.timestamp.toISOString(),
  }));

const deserializeMessages = (messages: PersistedMessage[] | undefined, fallback: Message[]): Message[] => {
  if (!messages || messages.length === 0) return fallback;
  return messages.map((item) => ({
    ...item,
    timestamp: new Date(item.timestamp),
  }));
};

const ChatWidget: React.FC<ChatWidgetProps> = ({ user, onOpenLogin, onGoToCheckout, onGoToOrders, onOpenProduct }) => {
  const { products, addToCart } = useShop();
  const { showError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<ChatView>('menu');
  const [isHovered, setIsHovered] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiStage, setAiStage] = useState<AiStage>('idle');
  const [chatLanguage, setChatLanguage] = useState<AiChatLanguage | null>(null);
  const [aiContext, setAiContext] = useState<AiChatContext>({ awaiting: 'NONE' });
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [pendingVariant, setPendingVariant] = useState<ProductVariant | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasHydratedChatRef = useRef(false);
  const lastStorageKeyRef = useRef<string | null>(null);

  // Separate message history for Admin and AI
  const [adminMessages, setAdminMessages] = useState<Message[]>(() => createDefaultAdminMessages());
  const [aiMessages, setAiMessages] = useState<Message[]>(() => createDefaultAiMessages());

  // Determine which messages to show based on view
  const currentMessages = activeView === 'admin' ? adminMessages : aiMessages;

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen && activeView !== 'menu') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adminMessages, aiMessages, isOpen, activeView, isTyping]);

  const getStorageKeyForUser = (targetUser: User | null): string | null => {
    if (!targetUser) return null;
    const identity = targetUser.id || targetUser.email;
    if (!identity) return null;
    return `${CHAT_STORAGE_PREFIX}:${identity}`;
  };

  useEffect(() => {
    const storageKey = getStorageKeyForUser(user);

    if (!user) {
      if (lastStorageKeyRef.current) {
        localStorage.removeItem(lastStorageKeyRef.current);
      }
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

  // Load admin chat messages from API when entering admin view (logged-in user)
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

  // WebSocket: real-time admin chat messages (replaces polling)
  const handleWsMessage = useCallback((msg: { id: string; content: string; sender: string; createdAt: string }) => {
    setAdminMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      // Message we sent: may be duplicate of optimistic (temp id) - update instead of add
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
  useChatWebSocket(activeView === 'admin' && isOpen && user ? user.id : null, handleWsMessage);

  useEffect(() => {
    if (!user || !hasHydratedChatRef.current) return;
    const storageKey = getStorageKeyForUser(user);
    if (!storageKey) return;
    if (activeView === 'admin') return; // Don't persist admin messages to localStorage - use API

    const payload: PersistedChatState = {
      activeView,
      adminMessages: serializeMessages(adminMessages),
      aiMessages: serializeMessages(aiMessages),
      chatLanguage,
      aiContext,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [user, activeView, adminMessages, aiMessages, chatLanguage, aiContext]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    // Optional: Reset to menu on close if desired, currently keeping state
  };

  const handleBackToMenu = () => {
    setActiveView('menu');
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    // Update state based on active view
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
    } else {
      const detectedLanguage = detectLanguage(newMessage.text);
      setChatLanguage(detectedLanguage);
      const nextAiMessages = [...aiMessages, newMessage];
      setAiMessages(nextAiMessages);
      simulateAIResponse(newMessage.text, nextAiMessages, detectedLanguage);
    }

    setInputText('');
    setIsTyping(true);
  };

  const simulateAdminResponse = () => {
    setTimeout(() => {
      const responses = [
        "Thank you for your message. An agent will be with you shortly.",
        "Could you please provide your Order ID so I can check that for you?",
        "We currently offer free shipping on orders over $50.",
        "That product is currently in stock at our main warehouse.",
        "Our business hours are Mon-Fri, 9 AM to 6 PM EST."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setAdminMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const simulateAIResponse = (input: string, contextMessages: Message[], requestLanguage: AiChatLanguage) => {
    setTimeout(async () => {
      try {
        await handleAiConversation(input, contextMessages, requestLanguage);
      } finally {
        setIsTyping(false);
      }
    }, 700);
  };

  const stripAccents = (value: string): string =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const normalize = (value: string): string => stripAccents(value).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const activeLang: AiChatLanguage = chatLanguage || 'vi';
  const t = (viText: string, enText: string): string => (activeLang === 'en' ? enText : viText);

  const detectLanguage = (text: string): AiChatLanguage => {
    const raw = text.trim().toLowerCase();
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(raw)) {
      return 'vi';
    }
    const normalized = normalize(raw);
    const viHints = ['xin', 'chao', 'toi', 'ban', 'mon', 'khong', 'co', 'bao nhieu', 'gio hang'];
    if (viHints.some((item) => normalized.includes(item))) {
      return 'vi';
    }
    return 'en';
  };

  const pushAiMessage = (text: string, actions?: ChatAction[]) => {
    const botMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      sender: 'bot',
      timestamp: new Date(),
      actions,
    };
    setAiMessages((prev) => [...prev, botMessage]);
  };

  const findRelevantProducts = (input: string): Product[] => {
    const query = normalize(input);
    if (!query) return [];
    const tokens = query.split(' ').filter((token) => token.length >= 2);

    const scored = products
      .map((product) => {
        const name = normalize(product.name);
        const category = normalize(product.categoryName || product.category || '');
        const description = normalize(product.description || '');
        let score = 0;

        if (name.includes(query) || query.includes(name)) score += 8;
        tokens.forEach((token) => {
          if (name.includes(token)) score += 3;
          if (category.includes(token)) score += 1;
          if (description.includes(token)) score += 1;
        });

        return { product, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map((item) => item.product);
  };

  const isAffirmative = (input: string): boolean => {
    const text = normalize(input);
    return (
      text.includes('co') ||
      text.includes('dong y') ||
      text.includes('ok') ||
      text.includes('duoc') ||
      text.includes('yes') ||
      text.includes('them vao') ||
      text.includes('them vao gio') ||
      text.includes('them vao di')
    );
  };

  const isNegative = (input: string): boolean => {
    const text = normalize(input);
    return text.includes('khong') || text.includes('no') || text.includes('thoi') || text.includes('chua');
  };

  /** Parse số lượng, bỏ qua số trong đơn vị cân (920g, 1kg). VD: "920g số lượng 3" -> 3. */
  const parseQuantity = (input: string): number | null => {
    const lower = input.toLowerCase();
    const allMatches = [...lower.matchAll(/(\d+)\s*(kg|g|gr|gram|grams)?/g)];
    for (let i = allMatches.length - 1; i >= 0; i--) {
      const num = Number(allMatches[i][1]);
      const unit = allMatches[i][2];
      if (unit) continue;
      if (Number.isFinite(num) && num >= 1 && num <= 99) return num;
    }
    return null;
  };

  const parseVariant = (input: string, product: Product): ProductVariant | null => {
    if (!product.variants?.length) return null;
    const normalizedInput = normalize(input);
    const matched = product.variants.find((variant) => {
      const weight = normalize(variant.weight);
      return normalizedInput.includes(weight) || weight.includes(normalizedInput);
    });
    return matched || null;
  };

  const askForVariantOrQuantity = (product: Product) => {
    const qty = pendingQuantity;
    if (!product.variants || product.variants.length === 0) {
      setPendingVariant({
        id: String(product.variantId || `${product.id}-default`),
        weight: product.weight || 'Default',
        price: product.price,
      });
      if (qty) {
        addPendingItemToCart(qty);
        setPendingQuantity(null);
      } else {
        setAiStage('awaiting_quantity');
        pushAiMessage(t(`Bạn muốn thêm ${product.name} với số lượng bao nhiêu?`, `How many of ${product.name} would you like to add?`), [
          { id: 'qty-1', label: '1', type: 'select_quantity', quantity: 1 },
          { id: 'qty-2', label: '2', type: 'select_quantity', quantity: 2 },
          { id: 'qty-3', label: '3', type: 'select_quantity', quantity: 3 },
        ]);
      }
      return;
    }

    if (product.variants.length === 1) {
      setPendingVariant(product.variants[0]);
      if (qty) {
        addPendingItemToCart(qty);
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
    pushAiMessage(t(`"${product.name}" có nhiều quy cách. Bạn chọn loại nào?`, `"${product.name}" has multiple variants. Which one would you like?`), product.variants.slice(0, 6).map((variant) => ({
      id: `variant-${variant.id}`,
      label: variant.weight,
      type: 'select_variant',
      variantId: variant.id,
      productId: String(product.id),
      quantity: qty ?? undefined,
    })));
  };

  const addPendingItemToCart = (quantity: number, productOverride?: Product | null, variantOverride?: ProductVariant | null) => {
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
  };

  const resetPendingSelection = () => {
    setAiStage('idle');
    setPendingProduct(null);
    setPendingVariant(null);
    setPendingQuantity(null);
  };

  const toAiHistory = (messages: Message[]): AiChatTurn[] =>
    messages
      .map((msg) => ({
        role: (msg.sender === 'user' ? 'user' : 'assistant') as AiChatTurn['role'],
        content: msg.text,
      }))
      .slice(-10);

  const fallbackLocalAiResponse = (trimmed: string) => {
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

    const matches = findRelevantProducts(trimmed);

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

      const actions: ChatAction[] = topMatches.flatMap((product) => ([
        {
          id: `view-${product.id}`,
          label: t(`Xem ${product.name}`, `View ${product.name}`),
          type: 'open_product',
          productId: String(product.id),
        } as ChatAction,
        {
          id: `buy-${product.id}`,
          label: t(`Mua ${product.name}`, `Buy ${product.name}`),
          type: 'select_product',
          productId: String(product.id),
        } as ChatAction,
      ]));

      pushAiMessage(
        t(
          `Tôi tìm thấy ${topMatches.length} sản phẩm phù hợp: ${topMatches.map((item) => `${item.name}`).join(', ')}.`,
          `I found ${topMatches.length} relevant products: ${topMatches.map((item) => `${item.name}`).join(', ')}.`
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
        featured.flatMap((product) => ([
          {
            id: `view-${product.id}`,
            label: t(`Xem ${product.name}`, `View ${product.name}`),
            type: 'open_product',
            productId: String(product.id),
          } as ChatAction,
          {
            id: `buy-${product.id}`,
            label: t(`Mua ${product.name}`, `Buy ${product.name}`),
            type: 'select_product',
            productId: String(product.id),
          } as ChatAction,
        ]))
      );
      return;
    }

    if (domainIntent) {
      pushAiMessage(
        t(
          'Tôi chưa tìm thấy sản phẩm phù hợp trong dữ liệu hiện tại. Bạn thử nhập tên món cụ thể hơn (ví dụ: "xoài sấy 500g" hoặc "mực rim 1kg").',
          'I could not find a close product match right now. Please give a more specific name (e.g. "dried mango 500g").'
        )
      );
      return;
    }

    pushAiMessage(
      t(
        'Xin lỗi, tôi chỉ hỗ trợ tư vấn sản phẩm và đặt hàng trên hệ thống LikeFood. Bạn hãy hỏi về tên món, quy cách (500g/1kg), giá hoặc yêu cầu thêm vào giỏ hàng nhé.',
        'Sorry, I only support product consultation and ordering on LikeFood. Ask me product names, variants (500g/1kg), prices, or add-to-cart requests.'
      )
    );
  };

  const handleAiConversation = async (input: string, contextMessages: Message[], requestLanguage: AiChatLanguage) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Xử lý theo ngữ cảnh TRƯỚC khi gọi API - tránh gửi "có thêm vào" qua API thay vì xử lý local
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
          pushAiMessage(t(`Bạn muốn thêm ${pendingProduct.name} (${variant.weight}) với số lượng bao nhiêu?`, `How many ${pendingProduct.name} (${variant.weight}) would you like?`), [
            { id: 'qty-1', label: '1', type: 'select_quantity', quantity: 1 },
            { id: 'qty-2', label: '2', type: 'select_quantity', quantity: 2 },
            { id: 'qty-3', label: '3', type: 'select_quantity', quantity: 3 },
          ]);
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
      if (isAffirmative(trimmed)) {
        pushAiMessage(t('Bạn bấm nút bên dưới để chuyển đến trang thanh toán.', 'Tap a button below to go to checkout.'), [
          { id: 'go-checkout', label: t('Đi đến thanh toán', 'Go to Checkout'), type: 'go_checkout' },
          { id: 'go-orders', label: t('Xem đơn hàng', 'View Orders'), type: 'go_orders' },
        ]);
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

    // Dùng 100% local để tránh lỗi 500 API - bỏ qua gọi backend
    const useLocalOnly = true;
    if (useLocalOnly) {
      fallbackLocalAiResponse(trimmed);
      return;
    }

    // Gọi API backend (Gemini) để xử lý - backend hiểu ý "mua X", chọn variant/quantity
    try {
      const aiResponse = await askAiAssistant(trimmed, toAiHistory(contextMessages), requestLanguage, aiContext);
      if (aiResponse.language) {
        setChatLanguage(aiResponse.language);
      }
      if (aiResponse.nextContext) {
        setAiContext(aiResponse.nextContext);
        // Đồng bộ state frontend để xử lý local khi user chọn variant/số lượng
        if (aiResponse.nextContext.awaiting === 'AWAITING_VARIANT_OR_QUANTITY' && aiResponse.nextContext.selectedProductId) {
          const p = products.find((item) => String(item.id) === String(aiResponse.nextContext!.selectedProductId));
          if (p) {
            setPendingProduct(p);
            setAiStage('awaiting_variant');
            if (aiResponse.cartInstruction?.quantity) setPendingQuantity(aiResponse.cartInstruction.quantity);
          }
        }
        if (aiResponse.nextContext.awaiting === 'AWAITING_CHECKOUT') {
          setAiStage('awaiting_checkout_confirmation');
        }
      }

      if (aiResponse.cartInstruction?.variantId && aiResponse.cartInstruction?.quantity) {
        const product = products.find((item) => String(item.id) === String(aiResponse.cartInstruction?.productId));
        const variant = product?.variants?.find((item) => item.id === aiResponse.cartInstruction?.variantId);
        if (product && variant) {
          addToCart(
            {
              ...product,
              weight: variant.weight,
              variantId: variant.id,
              price: variant.price,
            },
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
      return;
    } catch (error) {
      console.error('Cannot get Gemini response from backend.', error);
      fallbackLocalAiResponse(trimmed);
      return;
    }
  };

  const handleActionClick = (action: ChatAction) => {
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

    // Xử lý choose-variant/choose-qty từ backend LOCAL - không gọi API (tránh 500)
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
            pushAiMessage(t(`Bạn muốn thêm ${product.name} (${variant.weight}) với số lượng bao nhiêu?`, `How many ${product.name} (${variant.weight}) would you like?`), [
              { id: 'qty-1', label: '1', type: 'select_quantity', quantity: 1 },
              { id: 'qty-2', label: '2', type: 'select_quantity', quantity: 2 },
              { id: 'qty-3', label: '3', type: 'select_quantity', quantity: 3 },
            ]);
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
      const nextAiMessages = [...aiMessages, userActionMessage];
      setAiMessages(nextAiMessages);
      setIsTyping(true);
      simulateAIResponse(action.command, nextAiMessages, activeLang);
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
          setIsTyping(false);
          return;
        }
        if (aiStage === 'awaiting_checkout_confirmation') {
          pushAiMessage(t('Ok, tôi sẽ giữ giỏ hàng để bạn tiếp tục mua sắm.', 'Okay, I will keep the items in your cart.'));
          resetPendingSelection();
          setIsTyping(false);
          return;
        }
      }

      if (action.type === 'select_variant') {
        const product = action.productId
          ? products.find((p) => String(p.id) === String(action.productId))
          : pendingProduct;
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
          pushAiMessage(t(`Bạn muốn thêm ${product.name} (${variant.weight}) với số lượng bao nhiêu?`, `How many ${product.name} (${variant.weight}) would you like?`), [
            { id: 'qty-1', label: '1', type: 'select_quantity', quantity: 1 },
            { id: 'qty-2', label: '2', type: 'select_quantity', quantity: 2 },
            { id: 'qty-3', label: '3', type: 'select_quantity', quantity: 3 },
          ]);
        }
        setIsTyping(false);
        return;
      }

      if (action.type === 'select_quantity') {
        addPendingItemToCart(action.quantity);
        setIsTyping(false);
        return;
      }

      setIsTyping(false);
    }, 400);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  return (
    <div className="fixed bottom-6 right-6 z-[50] flex flex-col items-end pointer-events-none">

      {/* Chat Window */}
      <div
        className={`mb-4 w-[350px] max-w-[calc(100vw-3rem)] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-95 translate-y-10 pointer-events-none'
          }`}
        style={{ height: '500px', maxHeight: '80vh' }}
      >
        {/* Header */}
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
                <p className="text-white/80 text-xs flex items-center gap-1">
                  Online
                </p>
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

        {/* Content Area */}
        <div className="flex flex-col h-[calc(100%-72px)] bg-stone-50 dark:bg-stone-950">

          {/* MENU VIEW */}
          {activeView === 'menu' && (
            <div className="flex-1 p-6 flex flex-col justify-center gap-4">
              <p className="text-center text-stone-600 dark:text-stone-300 mb-2 font-medium">
                Please select a support option:
              </p>

              <button
                onClick={() => setActiveView('admin')}
                className="group relative flex items-center gap-4 p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-primary dark:hover:border-primary shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">support_agent</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Chat with Admin</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Order issues, shipping, returns</p>
                </div>
                <span className="absolute right-4 text-stone-300 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </span>
              </button>

              <button
                onClick={() => setActiveView('ai')}
                className="group relative flex items-center gap-4 p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">smart_toy</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Chat with AI</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Recipes, product info, tips</p>
                </div>
                <span className="absolute right-4 text-stone-300 group-hover:text-indigo-600 transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </span>
              </button>
            </div>
          )}

          {/* CHAT VIEW (Admin or AI) */}
          {activeView !== 'menu' && (
            user ? (
              // LOGGED IN VIEW
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="text-center text-xs text-stone-400 my-4">Today</div>

                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user'
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
                                onClick={() => handleActionClick(action)}
                                className="px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                type="button"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                        <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-green-100' : 'text-stone-400'}`}>
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

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-full px-4 py-2 border border-transparent focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white placeholder-stone-400 p-0"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isTyping}
                      className="text-primary hover:text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-symbols-outlined !text-xl">send</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // GUEST VIEW (Login Required)
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
            )
          )}
        </div>
      </div>

      {/* Floating Button (Launcher) */}
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

        {/* Tooltip Label */}
        <div
          className={`absolute right-full mr-4 bg-white dark:bg-stone-800 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg shadow-md text-sm font-bold whitespace-nowrap transition-all duration-300 origin-right ${isHovered && !isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
            }`}
        >
          Chat with us 👋
        </div>

        {/* Notification Badge (Fake) */}
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
