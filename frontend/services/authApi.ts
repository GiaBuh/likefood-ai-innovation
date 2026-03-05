import { User } from '../types';
import {
  apiFetch,
  clearAccessToken,
  clearStoredAuthUser,
  getErrorMessageFromResponse,
  getStoredAuthUser,
  setAccessToken,
  setStoredAuthUser,
  StoredAuthUser,
} from './apiClient';

type LoginRequest = {
  username: string;
  password: string;
};

type RegisterRequest = {
  username: string;
  email: string;
  phoneNumber: string;
  address: string;
  gender: 'MALE' | 'FEMALE';
  password: string;
  confirmPassword: string;
};

type LoginResponse = {
  user?: {
    id?: string;
    username?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    avatarUrl?: string;
    role?: string;
  };
  accessToken?: string;
};

const S3_PUBLIC_BASE_URL = ((import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL as string) || '';
const DEFAULT_AVATAR_URL =
  ((import.meta as any).env?.VITE_DEFAULT_AVATAR_URL as string) ||
  `${S3_PUBLIC_BASE_URL.replace(/\/+$/, '')}/avatars/avatar-default.svg`;

function unwrap<T>(payload: { data?: T } | T): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as any)) {
    return (payload as any).data as T;
  }
  return payload as T;
}

function toUser(authUser: StoredAuthUser): User {
  return {
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    phone: authUser.phone,
    address: authUser.address,
    avatar: authUser.avatar,
    role: authUser.role,
  };
}

function normalizeRole(role?: string): 'admin' | 'customer' {
  return (role || '').toUpperCase() === 'ADMIN' ? 'admin' : 'customer';
}

function resolveAvatarUrl(keyOrUrl?: string): string {
  if (!keyOrUrl) return DEFAULT_AVATAR_URL;
  if (keyOrUrl.includes('api.dicebear.com') || keyOrUrl.includes('ui-avatars.com')) {
    return DEFAULT_AVATAR_URL;
  }
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    return keyOrUrl;
  }
  if (!S3_PUBLIC_BASE_URL) {
    return DEFAULT_AVATAR_URL;
  }
  return `${S3_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${keyOrUrl.replace(/^\/+/, '')}`;
}

function toStoredAuthUser(payload: LoginResponse): StoredAuthUser {
  return {
    id: payload.user?.id || '',
    name: payload.user?.username || payload.user?.email || 'Customer',
    email: payload.user?.email || '',
    phone: payload.user?.phoneNumber || '',
    address: payload.user?.address || '',
    avatar: resolveAvatarUrl(payload.user?.avatarUrl),
    role: normalizeRole(payload.user?.role),
  };
}

export async function getGoogleLoginUrl(): Promise<string> {
  const response = await apiFetch('/auth/google/url', { method: 'GET' });
  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, 'Cannot get Google login URL'));
  }
  const payload = unwrap<{ url?: string }>((await response.json()) as any);
  const url = payload?.url;
  if (!url) {
    throw new Error('Invalid response from server');
  }
  return url;
}

export async function loginWithGoogleCallback(code: string): Promise<User> {
  const response = await apiFetch('/auth/google/exchange', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, 'Google login failed'));
  }

  const raw = (await response.json()) as any;
  const payload = unwrap<LoginResponse>(raw) ?? raw;
  const accessToken = payload?.accessToken ?? (raw as any)?.accessToken;
  const userData = payload?.user ?? (raw as any)?.data?.user;

  if (!accessToken) {
    throw new Error('Cannot receive access token from backend');
  }

  const authUser = toStoredAuthUser({ user: userData, accessToken });
  setAccessToken(accessToken);
  setStoredAuthUser(authUser);
  // Redirect ngay về trang chủ sau khi lưu token
  window.location.replace('/');
  return toUser(authUser);
}

export async function loginWithBackend(email: string, password: string): Promise<User> {
  const body: LoginRequest = {
    username: email.trim(),
    password,
  };

  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, 'Email or password is invalid'));
  }

  const payload = unwrap<LoginResponse>((await response.json()) as any);
  if (!payload?.accessToken) {
    throw new Error('Cannot receive access token from backend');
  }

  const authUser = toStoredAuthUser(payload);
  setAccessToken(payload.accessToken);
  setStoredAuthUser(authUser);
  return toUser(authUser);
}

export async function registerWithBackend(input: {
  username: string;
  email: string;
  phone: string;
  address: string;
  gender: 'male' | 'female';
  password: string;
  confirmPassword: string;
}): Promise<void> {
  const body: RegisterRequest = {
    username: input.username.trim(),
    email: input.email.trim(),
    phoneNumber: input.phone.trim(),
    address: input.address.trim(),
    gender: input.gender === 'female' ? 'FEMALE' : 'MALE',
    password: input.password,
    confirmPassword: input.confirmPassword,
  };

  const response = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, 'Register failed. Please check your information.'));
  }
}

export async function logoutFromBackend(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } finally {
    clearAccessToken();
    clearStoredAuthUser();
  }
}

export function getCurrentUserFromStorage(): User | null {
  const stored = getStoredAuthUser();
  if (!stored) return null;
  return toUser({
    ...stored,
    avatar: resolveAvatarUrl(stored.avatar),
  });
}

export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiFetch('/storage/upload-avatar', {
    method: 'POST',
    body: formData,
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, 'Upload avatar failed'));
  }

  const payload = (await response.json()) as { data?: { key: string }; key?: string };
  const data = payload?.data || payload;
  return (data as any)?.key || '';
}

export async function updateProfileApi(data: {
  name?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}): Promise<User> {
  const body: Record<string, string> = {};
  if (data.name != null) body.username = data.name.trim();
  if (data.phone != null) body.phoneNumber = data.phone.trim();
  if (data.address != null) body.address = data.address.trim();
  if (data.avatarUrl != null && data.avatarUrl !== '') body.avatarUrl = data.avatarUrl;

  const response = await apiFetch('/users/me', {
    method: 'PUT',
    body: JSON.stringify(body),
    requireAuth: true,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response, 'Update profile failed'));
  }

  const payload = (await response.json()) as { data?: UserUpdatePayload } | UserUpdatePayload;
  const dataRes = payload && typeof payload === 'object' && 'data' in payload ? (payload as any).data : payload;
  const stored: StoredAuthUser = {
    id: (dataRes as any)?.id || '',
    name: (dataRes as any)?.username || (dataRes as any)?.email || 'Customer',
    email: (dataRes as any)?.email || '',
    phone: (dataRes as any)?.phoneNumber || '',
    address: (dataRes as any)?.address || '',
    avatar: resolveAvatarUrl((dataRes as any)?.avatarUrl),
    role: normalizeRole((dataRes as any)?.role?.name),
  };
  setStoredAuthUser(stored);
  return toUser(stored);
}
