import { Category, Order, PaginationMeta, Product, ProductVariant } from '../types';
import { apiFetch, getErrorMessageFromResponse } from './apiClient';

type RestResponse<T> = {
  statusCode: number;
  error?: string;
  message?: string;
  data: T;
};

type PaginationPayload<T> = {
  meta: PaginationMeta;
  result: T[];
};

export type PaginatedResult<T> = {
  items: T[];
  meta: PaginationMeta;
};

type BackendCategory = {
  id?: string;
  name?: string;
  icon?: string;
};

type BackendProductVariant = {
  id?: string;
  sku?: string;
  weight?: string;
  weightValue?: number;
  weightUnit?: string;
  price?: number;
  quantity?: number;
};

type BackendProduct = {
  id?: string | number;
  name?: string;
  slug?: string;
  category?: BackendCategory;
  description?: string;
  price?: number;
  location?: string;
  thumbnailKey?: string;
  imageKeys?: string[];
  variants?: BackendProductVariant[];
  status?: string;
};

type BackendOrderItem = {
  id?: string;
  productName?: string;
  variantLabel?: string;
  imageKey?: string;
  quantity?: number;
  price?: number;
};

type BackendOrderCustomer = {
  id?: string;
  fullname?: string;
  email?: string;
  avatarUrl?: string;
  initials?: string;
  initialsBgColor?: string;
  initialsTextColor?: string;
  phoneNumber?: string;
  address?: string;
};

type BackendOrder = {
  id?: string;
  userId?: string;
  status?: string;
  createdAt?: string; // ISO from backend Instant
  shippingAddress?: string;
  totalAmount?: number;
  paymentStatus?: string;
  customer?: BackendOrderCustomer;
  items?: BackendOrderItem[];
};

type BackendCartItem = {
  id: string;
  variantId: string;
  productId: string;
  quantity: number;
  availableQuantity?: number;
  price: number;
};

type BackendCart = {
  id: string;
  userId: string;
  items: BackendCartItem[];
  totalAmount: number;
};

const S3_PUBLIC_BASE_URL = ((import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL as string) || '';
const DEFAULT_AVATAR_URL =
  ((import.meta as any).env?.VITE_DEFAULT_AVATAR_URL as string) ||
  `${S3_PUBLIC_BASE_URL.replace(/\/+$/, '')}/avatars/avatar-default.svg`;
const MAX_UPLOAD_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type ProductQuery = {
  page?: number;
  size?: number;
  name?: string;
  search?: string;
  categoryName?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
};

type OrderQuery = {
  page?: number;
  size?: number;
  id?: string;
  customerName?: string;
  customerEmail?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELED';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
};

type CreateOrderPayload = {
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  note?: string;
  paymentMethod?: 'COD' | 'BANK_TRANSFER' | 'E_WALLET';
};

export type AiChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type AiChatLanguage = 'vi' | 'en';

export type AiChatContext = {
  selectedProductId?: string;
  selectedVariantId?: string;
  awaiting?: string;
};

export type AiChatAction = {
  type: string;
  label: string;
  command?: string;
  productId?: string;
  variantId?: string;
  quantity?: number;
};

export type AiCartInstruction = {
  productId?: string;
  variantId?: string;
  quantity?: number;
};

export type AiAssistantResponse = {
  reply: string;
  refusal: boolean;
  shouldOfferAddToCart: boolean;
  language?: AiChatLanguage;
  matchedProductIds: string[];
  actions?: AiChatAction[];
  nextContext?: AiChatContext;
  cartInstruction?: AiCartInstruction;
};

function toProductVariant(variant: BackendProductVariant): ProductVariant {
  const weight =
    variant.weight ||
    (variant.weightValue !== undefined && variant.weightUnit ? `${stripDecimal(variant.weightValue)}${variant.weightUnit}` : '');

  return {
    id: variant.id || weight || `variant-${Math.random().toString(36).slice(2)}`,
    sku: variant.sku,
    weight: weight || 'Default',
    price: Number(variant.price ?? 0),
    weightValue: variant.weightValue,
    weightUnit: variant.weightUnit,
    quantity: variant.quantity,
  };
}

export function toProduct(product: BackendProduct): Product {
  const variants = (product.variants || []).map(toProductVariant);
  const fallbackPrice = variants[0]?.price ?? 0;
  const fallbackWeight = variants[0]?.weight ?? 'Default';
  const categoryName = product.category?.name || 'Uncategorized';
  const imageFromBackend = resolveImageUrl(product.thumbnailKey || '');
  const imagesFromBackend = (product.imageKeys || []).map((item) => resolveImageUrl(item)).filter(Boolean);
  const finalImages = imagesFromBackend.length > 0 ? imagesFromBackend : imageFromBackend ? [imageFromBackend] : [];
  const finalImage = imageFromBackend || finalImages[0] || '';

  const normalizedStatus = (() => {
    const status = (product.status || '').toUpperCase();
    if (status === 'ACTIVE') return 'Active';
    if (status === 'INACTIVE') return 'Archived';
    return 'Active';
  })();

  return {
    id: product.id || `p-${Math.random().toString(36).slice(2)}`,
    name: product.name || 'Untitled Product',
    price: Number(product.price ?? fallbackPrice),
    image: finalImage,
    images: finalImages,
    location: product.location || 'Viet Nam',
    category: categoryName,
    categoryName,
    categoryId: product.category?.id || undefined,
    isUsShip: true,
    description: product.description || '',
    weight: fallbackWeight,
    packaging: 'Standard Pack',
    variants,
    thumbnail: finalImage,
    variantId: variants[0]?.id,
    sku: variants[0]?.sku,
    status: normalizedStatus,
    stock: variants.reduce((sum, variant) => sum + (variant.quantity || 0), 0),
  };
}

function resolveImageUrl(keyOrUrl: string): string {
  if (!keyOrUrl) return '';
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    return keyOrUrl;
  }
  if (!S3_PUBLIC_BASE_URL) {
    return keyOrUrl;
  }
  return `${S3_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${keyOrUrl.replace(/^\/+/, '')}`;
}

function resolveAvatarUrl(keyOrUrl?: string): string {
  if (!keyOrUrl) return DEFAULT_AVATAR_URL;
  const resolved = resolveImageUrl(keyOrUrl);
  return resolved || DEFAULT_AVATAR_URL;
}

function stripDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

function unwrapRestResponse<T>(payload: RestResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as any)) {
    return (payload as RestResponse<T>).data;
  }
  return payload as T;
}

export async function fetchProducts(): Promise<Product[]> {
  const page = await fetchProductsWithQuery({ page: 1, size: 200 });
  return page.items;
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const response = await apiFetch(`/products/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch product (${response.status})`);
  }
  const payload = (await response.json()) as RestResponse<BackendProduct> | BackendProduct;
  const data = unwrapRestResponse(payload);
  return data ? toProduct(data as BackendProduct) : null;
}

export async function fetchProductsWithQuery(query: ProductQuery): Promise<PaginatedResult<Product>> {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('size', String(query.size ?? 20));
  if (query.name) params.set('name', query.name);
  if (query.search) params.set('search', query.search);
  if (query.categoryName) params.set('categoryName', query.categoryName);
  if (query.status) params.set('status', query.status);
  if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice));
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
  if (query.sort) params.set('sort', query.sort);

  const response = await apiFetch(`/products?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products (${response.status})`);
  }

  const payload = (await response.json()) as
    | RestResponse<PaginationPayload<BackendProduct>>
    | RestResponse<BackendProduct[]>
    | PaginationPayload<BackendProduct>
    | BackendProduct[];
  const data = unwrapRestResponse(payload as any) || [];
  if (Array.isArray((data as any).result)) {
    return {
      items: ((data as any).result as BackendProduct[]).map(toProduct),
      meta: (data as any).meta as PaginationMeta,
    };
  }

  const products = data as BackendProduct[];
  return {
    items: products.map(toProduct),
    meta: {
      page: query.page ?? 1,
      pageSize: query.size ?? products.length,
      totalPages: 1,
      total: products.length,
    },
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await apiFetch('/categories', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories (${response.status})`);
  }

  const payload = (await response.json()) as RestResponse<BackendCategory[]> | BackendCategory[];
  const categories = unwrapRestResponse(payload) || [];

  return categories
    .filter((category) => category.id && category.name)
    .map((category) => ({
      id: String(category.id),
      name: String(category.name),
      icon: category.icon || 'category',
    }));
}

async function uploadImage(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_IMAGE_SIZE_BYTES) {
    throw new Error('Image is too large. Max allowed size is 5MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'PRODUCT');

  const response = await apiFetch('/storage/upload-image?type=PRODUCT', {
    method: 'POST',
    body: formData,
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image (${response.status})`);
  }

  const payload = (await response.json()) as RestResponse<{ key: string }> | { key: string };
  const data = unwrapRestResponse(payload);
  return data.key;
}

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, content] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, { type: mimeType });
}

export async function createCategory(name: string): Promise<Category> {
  const response = await apiFetch('/categories', {
    method: 'POST',
    body: JSON.stringify({ name: name.trim() }),
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to create category (${response.status})`));
  }

  const payload = (await response.json()) as RestResponse<BackendCategory> | BackendCategory;
  const category = unwrapRestResponse(payload);
  return {
    id: String(category.id),
    name: String(category.name),
  };
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const response = await apiFetch(`/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ name: name.trim() }),
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to update category (${response.status})`));
  }

  const payload = (await response.json()) as RestResponse<BackendCategory> | BackendCategory;
  const category = unwrapRestResponse(payload);
  return {
    id: String(category.id),
    name: String(category.name),
  };
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await apiFetch(`/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to delete category (${response.status})`));
  }
}

function parseWeightValue(weight?: string): { value: number; unit: string } {
  if (!weight) return { value: 1, unit: 'g' };
  const matched = weight.trim().match(/^([0-9]*\.?[0-9]+)\s*([a-zA-Z]+)$/);
  if (!matched) return { value: 1, unit: 'g' };
  return {
    value: Number(matched[1]),
    unit: matched[2],
  };
}

export async function createProduct(product: Product, categories: Category[]): Promise<Product> {
  const categoryByName = categories.find(
    (category) => category.name.toLowerCase() === (product.categoryName || product.category || '').toLowerCase()
  );
  const categoryId = product.categoryId || categoryByName?.id;
  if (!categoryId) {
    throw new Error('Category is required');
  }

  const payload = await buildProductPayload(product, categoryId);

  const response = await apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to create product (${response.status})`));
  }

  const payloadResponse = (await response.json()) as RestResponse<BackendProduct> | BackendProduct;
  return toProduct(unwrapRestResponse(payloadResponse));
}

export async function updateProduct(product: Product, categories: Category[]): Promise<Product> {
  const categoryByName = categories.find(
    (category) => category.name.toLowerCase() === (product.categoryName || product.category || '').toLowerCase()
  );
  const categoryId = product.categoryId || categoryByName?.id;
  if (!categoryId) {
    throw new Error('Category is required');
  }

  if (!product.id) {
    throw new Error('Product id is required for update');
  }

  const payload = await buildProductPayload(product, categoryId);

  const response = await apiFetch(`/products/${product.id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to update product (${response.status})`));
  }

  const payloadResponse = (await response.json()) as RestResponse<BackendProduct> | BackendProduct;
  return toProduct(unwrapRestResponse(payloadResponse));
}

export type ProductImportResult = {
  totalRows: number;
  successCount: number;
  failCount: number;
  created: BackendProduct[];
  errors: string[];
};

export async function importProductsFromCsv(file: File): Promise<ProductImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiFetch('/products/import', {
    method: 'POST',
    body: formData,
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to import products (${response.status})`));
  }

  const payload = (await response.json()) as RestResponse<ProductImportResult> | ProductImportResult;
  return unwrapRestResponse(payload);
}

export async function deleteProduct(id: string): Promise<Product> {
  const response = await apiFetch(`/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to delete product (${response.status})`));
  }

  const payloadResponse = (await response.json()) as RestResponse<BackendProduct> | BackendProduct;
  return toProduct(unwrapRestResponse(payloadResponse));
}

async function buildProductPayload(product: Product, categoryId: string): Promise<{
  name: string;
  description: string;
  categoryId: string;
  thumbnailKey: string;
  imageKeys: string[];
  variants: Array<{
    weightValue: number;
    weightUnit: string;
    sku: string;
    price: number;
    quantity: number;
  }>;
}> {
  const thumbnailSource = product.thumbnail || product.image;
  const gallerySources = (product.images || []).filter((image) => image && image !== thumbnailSource);
  const sourceImages = [thumbnailSource, ...gallerySources].filter(Boolean);
  const uploadedKeys: string[] = [];

  for (let index = 0; index < sourceImages.length; index += 1) {
    const image = sourceImages[index] as string;
    if (image.startsWith('data:')) {
      const file = dataUrlToFile(image, `product-${Date.now()}-${index}.png`);
      const key = await uploadImage(file);
      uploadedKeys.push(key);
    } else if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('products/')) {
      uploadedKeys.push(toStorageKey(image));
    }
  }

  if (uploadedKeys.length === 0) {
    throw new Error('Please upload at least one product image');
  }

  const variants = (product.variants || []).map((variant, index) => {
    const parsed = parseWeightValue(variant.weight);
    const unit = variant.weightUnit || parsed.unit;
    const value = variant.weightValue ?? parsed.value;
    const variantSku = (variant.sku || '').trim();
    if (!variantSku) {
      throw new Error(`SKU is required for variant ${index + 1} (e.g. ${parsed.value}${parsed.unit || 'g'})`);
    }
    const out: { id?: string; weightValue: number; weightUnit: string; sku: string; price: number; quantity: number } = {
      weightValue: value > 0 ? value : 1,
      weightUnit: unit || 'g',
      sku: variantSku,
      price: Number(variant.price && variant.price > 0 ? variant.price : 1),
      quantity: Number(variant.quantity && variant.quantity > 0 ? variant.quantity : 1),
    };
    if (variant.id && String(variant.id).length > 0 && !String(variant.id).startsWith('variant-')) {
      out.id = String(variant.id);
    }
    return out;
  });

  return {
    name: product.name,
    description: product.description,
    categoryId,
    thumbnailKey: uploadedKeys[0],
    imageKeys: uploadedKeys.slice(1),
    variants,
  };
}

function toStorageKey(keyOrUrl: string): string {
  if (!keyOrUrl) return '';
  if (keyOrUrl.startsWith('products/')) return keyOrUrl;
  if (S3_PUBLIC_BASE_URL) {
    const base = S3_PUBLIC_BASE_URL.replace(/\/+$/, '');
    if (keyOrUrl.startsWith(base)) {
      return keyOrUrl.slice(base.length).replace(/^\/+/, '');
    }
  }
  return keyOrUrl;
}

function toOrder(order: BackendOrder): Order {
  const paymentStatusRaw = (order.paymentStatus || '').toUpperCase();
  const paymentStatus = paymentStatusRaw === 'PAID' ? 'Paid' : paymentStatusRaw === 'FAILED' ? 'Refunded' : 'Unpaid';
  const fulfillment = mapOrderStatusToFulfillment(order.status);
  const safeFulfillment =
    fulfillment === 'Processing' ||
    fulfillment === 'Confirm' ||
    fulfillment === 'Shipped' ||
    fulfillment === 'Complete' ||
    fulfillment === 'Cancelled'
      ? fulfillment
      : 'Processing';
  const parsedDate = order.createdAt ? new Date(order.createdAt) : null;

  return {
    id: String(order.id || ''),
    userId: order.userId,
    customer: {
      id: String(order.customer?.id || ''),
      fullname: order.customer?.fullname || 'Unknown',
      email: order.customer?.email || '',
      avatarUrl: resolveAvatarUrl(order.customer?.avatarUrl),
      initials: buildInitials(order.customer?.fullname || ''),
      initialsBgColor: 'bg-blue-100 dark:bg-blue-900',
      initialsTextColor: 'text-blue-600 dark:text-blue-300',
      phoneNumber: order.customer?.phoneNumber,
      address: order.customer?.address,
    },
    createdAt: parsedDate ? parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '',
    time: parsedDate ? parsedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
    status: safeFulfillment,
    paymentStatus,
    fulfillmentStatus: safeFulfillment,
    items: (order.items || []).map((item) => ({
      id: item.id,
      productName: item.productName,
      variantLabel: item.variantLabel,
      productThumbnail: resolveImageUrl(item.imageKey || ''),
      quantity: item.quantity,
      price: item.price,
    })),
    total: Number(order.totalAmount ?? 0),
    totalAmount: Number(order.totalAmount ?? 0),
    shippingAddress: order.shippingAddress || '',
  };
}

function mapOrderStatusToFulfillment(status?: string): string {
  const normalized = (status || '').toUpperCase();
  if (normalized === 'PENDING') return 'Processing';
  if (normalized === 'CONFIRMED') return 'Confirm';
  if (normalized === 'SHIPPED') return 'Shipped';
  if (normalized === 'COMPLETED') return 'Complete';
  if (normalized === 'CANCELED') return 'Cancelled';
  return 'Processing';
}

function mapFulfillmentToOrderStatus(status: 'Processing' | 'Confirm' | 'Shipped' | 'Complete'): string {
  if (status === 'Processing') return 'PENDING';
  if (status === 'Confirm') return 'CONFIRMED';
  if (status === 'Shipped') return 'SHIPPED';
  return 'COMPLETED';
}

function buildInitials(value: string): string {
  const safe = value.trim();
  if (!safe) return 'U';
  const parts = safe.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

export async function fetchOrders(): Promise<Order[]> {
  const page = await fetchOrdersWithQuery({ page: 1, size: 200 });
  return page.items;
}

export async function fetchOrdersWithQuery(query: OrderQuery): Promise<PaginatedResult<Order>> {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('size', String(query.size ?? 20));
  if (query.id) params.set('id', query.id);
  if (query.customerName) params.set('customerName', query.customerName);
  if (query.customerEmail) params.set('customerEmail', query.customerEmail);
  if (query.status) params.set('status', query.status);
  if (query.paymentStatus) params.set('paymentStatus', query.paymentStatus);

  const response = await apiFetch(`/orders?${params.toString()}`, {
    method: 'GET',
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orders (${response.status})`);
  }

  const payload = (await response.json()) as
    | RestResponse<PaginationPayload<BackendOrder>>
    | RestResponse<BackendOrder[]>
    | PaginationPayload<BackendOrder>
    | BackendOrder[];
  const data = unwrapRestResponse(payload as any) || [];
  if (Array.isArray((data as any).result)) {
    return {
      items: ((data as any).result as BackendOrder[]).map(toOrder),
      meta: (data as any).meta as PaginationMeta,
    };
  }

  const orders = data as BackendOrder[];
  return {
    items: orders.map(toOrder),
    meta: {
      page: query.page ?? 1,
      pageSize: query.size ?? orders.length,
      totalPages: 1,
      total: orders.length,
    },
  };
}

export async function fetchMyOrders(): Promise<Order[]> {
  const response = await apiFetch('/orders/me', {
    method: 'GET',
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch my orders (${response.status})`);
  }

  const payload = (await response.json()) as RestResponse<BackendOrder[]> | BackendOrder[];
  const data = unwrapRestResponse(payload as any) || [];
  return (data as BackendOrder[]).map(toOrder);
}

export async function addItemToMyCart(variantId: string, quantity: number): Promise<BackendCart> {
  const response = await apiFetch('/carts/me/items', {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({ variantId, quantity }),
  });
  if (!response.ok) {
    throw new Error(`Failed to add item to cart (${response.status})`);
  }
  const payload = (await response.json()) as RestResponse<BackendCart> | BackendCart;
  return unwrapRestResponse(payload);
}

export async function askAiAssistant(
  message: string,
  history: AiChatTurn[],
  preferredLanguage?: AiChatLanguage,
  context?: AiChatContext
): Promise<AiAssistantResponse> {
  const response = await apiFetch('/ai-chat/respond', {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({
      message,
      history,
      preferredLanguage,
      context,
    }),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to get AI response (${response.status})`));
  }
  const payload = (await response.json()) as RestResponse<AiAssistantResponse> | AiAssistantResponse;
  return unwrapRestResponse(payload);
}

export async function getMyCart(): Promise<BackendCart> {
  const response = await apiFetch('/carts/me', {
    method: 'GET',
    requireAuth: true,
  });
  if (!response.ok) {
    throw new Error(`Failed to get my cart (${response.status})`);
  }
  const payload = (await response.json()) as RestResponse<BackendCart> | BackendCart;
  return unwrapRestResponse(payload);
}

export async function updateMyCartItem(itemId: string, quantity: number): Promise<BackendCart> {
  const response = await apiFetch(`/carts/me/items/${itemId}?quantity=${quantity}`, {
    method: 'PUT',
    requireAuth: true,
  });
  if (!response.ok) {
    throw new Error(`Failed to update cart item (${response.status})`);
  }
  const payload = (await response.json()) as RestResponse<BackendCart> | BackendCart;
  return unwrapRestResponse(payload);
}

export async function removeMyCartItem(itemId: string): Promise<BackendCart> {
  const response = await apiFetch(`/carts/me/items/${itemId}`, {
    method: 'DELETE',
    requireAuth: true,
  });
  if (!response.ok) {
    throw new Error(`Failed to remove cart item (${response.status})`);
  }
  const payload = (await response.json()) as RestResponse<BackendCart> | BackendCart;
  return unwrapRestResponse(payload);
}

export async function createOrderFromMyCart(payload: CreateOrderPayload): Promise<Order> {
  const response = await apiFetch('/orders/me', {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({
      receiverName: payload.receiverName,
      receiverPhone: payload.receiverPhone,
      shippingAddress: payload.shippingAddress,
      note: payload.note || '',
      paymentMethod: payload.paymentMethod || 'COD',
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to create order (${response.status})`));
  }

  const data = unwrapRestResponse((await response.json()) as any) as BackendOrder;
  return toOrder(data);
}

export async function updateOrderStatusByAdmin(
  orderId: string,
  status: 'Processing' | 'Confirm' | 'Shipped' | 'Complete'
): Promise<Order> {
  const response = await apiFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    requireAuth: true,
    body: JSON.stringify({
      status: mapFulfillmentToOrderStatus(status),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update order status (${response.status})`);
  }

  const data = unwrapRestResponse((await response.json()) as any) as BackendOrder;
  return toOrder(data);
}

export async function cancelMyOrder(orderId: string): Promise<Order> {
  const response = await apiFetch(`/orders/me/${orderId}/cancel`, {
    method: 'PATCH',
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel order (${response.status})`);
  }

  const data = unwrapRestResponse((await response.json()) as any) as BackendOrder;
  return toOrder(data);
}

// Chat API
export type ChatMessageRes = { id: string; content: string; sender: string; createdAt: string };
export type ChatConversationRes = {
  userId: string;
  fullname: string;
  email: string;
  avatarUrl?: string;
  initials?: string;
  initialsBgColor?: string;
  initialsTextColor?: string;
  lastMessage?: string;
  lastMessageAt?: string;
};

export async function getMyChatMessages(): Promise<ChatMessageRes[]> {
  const response = await apiFetch('/chat/me/messages', { method: 'GET', requireAuth: true });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to get messages (${response.status})`));
  }
  const payload = (await response.json()) as RestResponse<ChatMessageRes[]> | ChatMessageRes[];
  return unwrapRestResponse(payload) || [];
}

export async function sendChatMessageAsUser(content: string): Promise<ChatMessageRes> {
  const response = await apiFetch('/chat/me/messages', {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to send message (${response.status})`));
  }
  const payload = (await response.json()) as RestResponse<ChatMessageRes> | ChatMessageRes;
  return unwrapRestResponse(payload);
}

export async function getAdminConversations(): Promise<ChatConversationRes[]> {
  const response = await apiFetch('/chat/admin/conversations', { method: 'GET', requireAuth: true });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to get conversations (${response.status})`));
  }
  const payload = (await response.json()) as RestResponse<ChatConversationRes[]> | ChatConversationRes[];
  return unwrapRestResponse(payload) || [];
}

export async function getAdminMessages(userId: string): Promise<ChatMessageRes[]> {
  const response = await apiFetch(`/chat/admin/conversations/${encodeURIComponent(userId)}/messages`, {
    method: 'GET',
    requireAuth: true,
  });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to get messages (${response.status})`));
  }
  const payload = (await response.json()) as RestResponse<ChatMessageRes[]> | ChatMessageRes[];
  return unwrapRestResponse(payload) || [];
}

export async function sendAdminMessage(userId: string, content: string): Promise<ChatMessageRes> {
  const response = await apiFetch(`/chat/admin/conversations/${encodeURIComponent(userId)}/messages`, {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to send message (${response.status})`));
  }
  const payload = (await response.json()) as RestResponse<ChatMessageRes> | ChatMessageRes;
  return unwrapRestResponse(payload);
}

