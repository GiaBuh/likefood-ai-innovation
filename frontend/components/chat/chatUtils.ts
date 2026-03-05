import type { Product, ProductVariant } from '../../types';

export const stripAccents = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const normalize = (value: string): string =>
  stripAccents(value).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

export function parseQuantity(input: string): number | null {
  const lower = input.toLowerCase();
  const allMatches = [...lower.matchAll(/(\d+)\s*(kg|g|gr|gram|grams)?/g)];
  for (let i = allMatches.length - 1; i >= 0; i--) {
    const num = Number(allMatches[i][1]);
    const unit = allMatches[i][2];
    if (unit) continue;
    if (Number.isFinite(num) && num >= 1 && num <= 99) return num;
  }
  return null;
}

export type BudgetResult = { amount: number; unit: 'usd' | 'vnd' };

/** Parse ngân sách user. Sản phẩm mặc định $ → $ giữ nguyên, VND quy đổi ra $ (÷25000) để so sánh. */
export function parseBudget(input: string): BudgetResult | null {
  const raw = input.trim();
  const lower = raw.toLowerCase();
  const normalized = normalize(input);

  const usdMatch = raw.match(/(\d+(?:\.\d+)?)\s*\$/) || lower.match(/(\d+(?:\.\d+)?)\s*(?:usd|us\b|do\b|dola|dollar)/);
  if (usdMatch) return { amount: Number(usdMatch[1]), unit: 'usd' };

  const kMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k(?:hoi)?/);
  if (kMatch) return { amount: Math.round(Number(kMatch[1]) * 1000), unit: 'vnd' };

  const trieuMatch = normalized.match(/(\d+(?:\.\d+)?)\s*trieu/);
  if (trieuMatch) return { amount: Number(trieuMatch[1]) * 1_000_000, unit: 'vnd' };

  const nghinMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:nghin|ngan|tram)/);
  if (nghinMatch) return { amount: Math.round(Number(nghinMatch[1]) * 1000), unit: 'vnd' };

  const numMatch = normalized.match(/(\d{3,})/);
  if (numMatch) return { amount: Number(numMatch[1]), unit: 'vnd' };

  const vndMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:vnd|dong)/);
  if (vndMatch) return { amount: Number(vndMatch[1]), unit: 'vnd' };

  return null;
}

/** Đổi budget sang USD để so sánh với giá sản phẩm ($). */
export function budgetToUsd(budget: BudgetResult): number {
  if (budget.unit === 'usd') return budget.amount;
  return budget.amount / 25000;
}

/** Hiển thị budget theo đơn vị gốc. */
export function formatBudgetDisplay(budget: BudgetResult): string {
  if (budget.unit === 'usd') return `$${budget.amount}`;
  if (budget.amount >= 1000) return `${(budget.amount / 1000).toFixed(0)}k`;
  return `${budget.amount}đ`;
}

/** Hiển thị giá sản phẩm (mặc định $). */
export function formatProductPrice(priceUsd: number): string {
  return `$${priceUsd.toFixed(2)}`;
}

export function getProductMinPrice(p: Product): number {
  if (p.variants?.length) return Math.min(...p.variants.map((v) => Number(v.price ?? 0)));
  return Number(p.price ?? 0);
}

export function parseVariant(input: string, product: Product): ProductVariant | null {
  if (!product.variants?.length) return null;
  const normalizedInput = normalize(input);
  return (
    product.variants.find((variant) => {
      const weight = normalize(variant.weight);
      return normalizedInput.includes(weight) || weight.includes(normalizedInput);
    }) ?? null
  );
}

export function isAffirmative(input: string): boolean {
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
}

export function isNegative(input: string): boolean {
  const text = normalize(input);
  return text.includes('khong') || text.includes('no') || text.includes('thoi') || text.includes('chua');
}

/** Nhận diện ý đồ thanh toán: thanh toán ngay, thanh toán, pay now, checkout, ... */
export function isPaymentIntent(input: string): boolean {
  const text = normalize(input);
  const raw = input.trim().toLowerCase();
  return (
    text.includes('thanh toan') ||
    text === 'thanh toan' ||
    text === 'thanh toan ngay' ||
    text.includes('thanh toan ngay') ||
    text.includes('pay now') ||
    text.includes('checkout') ||
    text.includes('di thanh toan') ||
    text.includes('den thanh toan') ||
    raw === 'thanh toán' ||
    raw === 'thanh toán ngay' ||
    /thanh\s*toan\s*ngay/i.test(raw) ||
    /pay\s*now/i.test(raw)
  );
}

export function detectLanguage(text: string): 'vi' | 'en' {
  const raw = text.trim().toLowerCase();
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(raw)) {
    return 'vi';
  }
  const normalized = normalize(raw);
  const viHints = ['xin', 'chao', 'toi', 'ban', 'mon', 'khong', 'co', 'bao nhieu', 'gio hang'];
  if (viHints.some((item) => normalized.includes(item))) return 'vi';
  return 'en';
}

const HINT_MAP: Record<string, string[]> = {
  muoi: ['kho', 'bo'],
  ot: ['muoi'],
  bo: ['kho'],
  kho: ['bo', 'ga', 'muc'],
  ga: ['kho'],
};

export function findRelevantProducts(input: string, products: Product[]): Product[] {
  const query = normalize(input);
  if (!query) return [];
  const tokens = query.split(' ').filter((t) => t.length >= 2);
  const queryNoSpaces = query.replace(/\s+/g, '');
  const hintWords: string[] = [];
  tokens.forEach((t) => {
    if (HINT_MAP[t]) hintWords.push(...HINT_MAP[t]);
  });

  const scored = products
    .map((product) => {
      const name = normalize(product.name);
      const category = normalize(product.categoryName || product.category || '');
      const description = normalize(product.description || '');
      const nameNoSpaces = name.replace(/\s+/g, '');
      let score = 0;

      if (name.includes(query) || query.includes(name)) score += 10;
      if (queryNoSpaces.length >= 3 && nameNoSpaces.includes(queryNoSpaces)) score += 8;
      tokens.forEach((token) => {
        if (name.includes(token)) score += 4;
        if (category.includes(token)) score += 2;
        if (description.includes(token)) score += 1;
      });
      hintWords.forEach((h) => {
        if (h.length >= 2 && name.includes(h)) score += 2;
      });
      if (tokens.length >= 2 && tokens.every((t) => name.includes(t))) score += 5;

      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((item) => item.product);
}

/** Khi không tìm thấy món trùng: gợi ý món liên quan (token trùng lỏng) hoặc món nổi bật. */
export function findSuggestionProductsWhenNoMatch(input: string, products: Product[], limit = 4): Product[] {
  const query = normalize(input);
  const tokens = query.split(' ').filter((t) => t.length >= 2);
  if (tokens.length === 0 || products.length === 0) return products.slice(0, limit);

  const withScore = products
    .map((product) => {
      const name = normalize(product.name);
      const category = normalize(product.categoryName || product.category || '');
      const desc = normalize(product.description || '');
      let score = 0;
      tokens.forEach((token) => {
        if (name.includes(token)) score += 2;
        if (category.includes(token)) score += 1;
        if (desc.includes(token)) score += 1;
      });
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (withScore.length > 0) return withScore.slice(0, limit).map((item) => item.product);
  return products.slice(0, limit);
}
