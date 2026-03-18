import { apiFetch, getErrorMessageFromResponse } from './apiClient';

// ─── Types ───

export interface FlashSaleItemResponse {
  id: string;
  productId: string;
  variantId: string | null;
  variantLabel: string | null;
  productName: string;
  productSlug: string;
  productImage: string; // thumbnailKey from backend
  categoryName: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  stock: number;
  soldCount: number;
  soldPercent: number;
}

export interface FlashSaleEventResponse {
  id: string;
  name: string;
  bannerUrl: string | null;
  startTime: string; // ISO Instant
  endTime: string;   // ISO Instant
  isActive: boolean;
  items: FlashSaleItemResponse[];
}

export interface FlashSaleItemRequest {
  productId: string;
  variantId?: string;
  salePrice: number;
  stock: number;
}

export interface FlashSaleEventRequest {
  name: string;
  bannerUrl?: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
  items: FlashSaleItemRequest[];
}

type RestResponse<T> = {
  statusCode: number;
  message?: string;
  data: T;
};

function unwrapRestResponse<T>(payload: RestResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as any)) {
    return (payload as RestResponse<T>).data;
  }
  return payload as T;
}

// ─── Public APIs ───

export interface FlashSaleSoldUpdate {
  eventId: string;
  itemId: string;
  soldCount: number;
  soldPercent: number;
  remainingStock: number;
}

export async function fetchActiveFlashSales(): Promise<FlashSaleEventResponse[]> {
  const response = await apiFetch('/flash-sale/active', { method: 'GET' });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to fetch active flash sales (${response.status})`));
  }
  const payload = await response.json();
  return unwrapRestResponse(payload);
}

export async function fetchTodayFlashSales(): Promise<FlashSaleEventResponse[]> {
  const response = await apiFetch('/flash-sale/today', { method: 'GET' });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to fetch today flash sales (${response.status})`));
  }
  const payload = await response.json();
  return unwrapRestResponse(payload);
}

/**
 * Shopee-level: Server time sync — prevents user clock manipulation.
 */
export async function fetchServerTime(): Promise<string> {
  const response = await apiFetch('/flash-sale/server-time', { method: 'GET' });
  if (!response.ok) return new Date().toISOString();
  const payload = await response.json();
  const data = unwrapRestResponse(payload);
  return (data as any).serverTime || new Date().toISOString();
}

/**
 * Shopee-level: Atomic purchase via Redis DECR.
 * Race-condition proof — handles concurrent purchases.
 */
export async function purchaseFlashSaleItem(itemId: string): Promise<FlashSaleSoldUpdate> {
  const response = await apiFetch(`/flash-sale/purchase/${itemId}`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Purchase failed (${response.status})`));
  }
  const payload = await response.json();
  return unwrapRestResponse(payload);
}

// ─── Admin APIs ───

export async function fetchAllFlashSales(): Promise<FlashSaleEventResponse[]> {
  const response = await apiFetch('/flash-sale', { method: 'GET', requireAuth: true });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to fetch all flash sales (${response.status})`));
  }
  const payload = await response.json();
  return unwrapRestResponse(payload);
}

export async function createFlashSale(request: FlashSaleEventRequest): Promise<FlashSaleEventResponse> {
  const response = await apiFetch('/flash-sale', {
    method: 'POST',
    requireAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to create flash sale (${response.status})`));
  }
  const payload = await response.json();
  return unwrapRestResponse(payload);
}

export async function updateFlashSale(id: string, request: FlashSaleEventRequest): Promise<FlashSaleEventResponse> {
  const response = await apiFetch(`/flash-sale/${id}`, {
    method: 'PUT',
    requireAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to update flash sale (${response.status})`));
  }
  const payload = await response.json();
  return unwrapRestResponse(payload);
}

export async function deleteFlashSale(id: string): Promise<void> {
  const response = await apiFetch(`/flash-sale/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to delete flash sale (${response.status})`));
  }
}
