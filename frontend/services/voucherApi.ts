import { UserVoucher, Voucher } from '../types';
import { apiFetch, getErrorMessageFromResponse } from './apiClient';

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

export async function fetchActiveVouchers(): Promise<Voucher[]> {
  const response = await apiFetch('/vouchers/active', { method: 'GET' });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to fetch active vouchers (${response.status})`));
  }
  const payload = await response.json();
  return unwrapRestResponse(payload);
}

export async function fetchAllVouchers(): Promise<Voucher[]> {
  const response = await apiFetch('/vouchers', { method: 'GET', requireAuth: true });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to fetch all vouchers (${response.status})`));
  }
  const payload = await response.json();
  return unwrapRestResponse(payload);
}

export async function fetchMyVouchers(): Promise<UserVoucher[]> {
  const response = await apiFetch('/vouchers/me', { method: 'GET', requireAuth: true });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to fetch my vouchers (${response.status})`));
  }
  const payload = await response.json();
  return unwrapRestResponse(payload);
}

export async function claimVoucher(voucherId: string): Promise<UserVoucher> {
  const response = await apiFetch(`/vouchers/claim/${encodeURIComponent(voucherId)}`, { method: 'POST', requireAuth: true });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to claim voucher (${response.status})`));
  }
  const payload = await response.json();
  return unwrapRestResponse(payload);
}

export async function createVoucher(voucherReq: Omit<Voucher, 'id' | 'usageCount'>): Promise<Voucher> {
  const response = await apiFetch('/vouchers', {
    method: 'POST',
    requireAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(voucherReq)
  });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to create voucher (${response.status})`));
  }
  const payload = await response.json();
  return unwrapRestResponse(payload);
}

export async function updateVoucher(id: string, voucherReq: Omit<Voucher, 'id' | 'usageCount'>): Promise<Voucher> {
  const response = await apiFetch(`/vouchers/${id}`, {
    method: 'PUT',
    requireAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(voucherReq)
  });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to update voucher (${response.status})`));
  }
  const payload = await response.json();
  return unwrapRestResponse(payload);
}

export async function deleteVoucher(id: string): Promise<void> {
  const response = await apiFetch(`/vouchers/${id}`, {
    method: 'DELETE',
    requireAuth: true
  });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, `Failed to delete voucher (${response.status})`));
  }
}
