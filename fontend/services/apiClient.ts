const env = (import.meta as any).env;
const API_BASE_URL =
  (typeof env?.VITE_API_BASE_URL === 'string' && env.VITE_API_BASE_URL) ||
  (env?.MODE === 'development' ? 'http://localhost:8080' : '');
const ACCESS_TOKEN_KEY = 'likefood_access_token';
const AUTH_USER_KEY = 'likefood_auth_user';

export type StoredAuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  role: 'admin' | 'customer';
};

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getStoredAuthUser(): StoredAuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: StoredAuthUser): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuthUser(): void {
  localStorage.removeItem(AUTH_USER_KEY);
}

export async function refreshAccessToken(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data?: { accessToken?: string }; accessToken?: string };
  const token = payload?.data?.accessToken || payload?.accessToken;
  if (!token) return null;
  setAccessToken(token);
  return token;
}

type RequestOptions = RequestInit & {
  requireAuth?: boolean;
};

export function normalizeApiMessage(message: unknown): string {
  if (Array.isArray(message)) {
    const first = message.find((item) => typeof item === 'string' && item.trim().length > 0);
    return typeof first === 'string' ? first : '';
  }
  if (typeof message === 'string') {
    return message;
  }
  return '';
}

export async function getErrorMessageFromResponse(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const payload = (await response.clone().json()) as { message?: unknown; error?: string };
    return normalizeApiMessage(payload?.message) || payload?.error || fallback;
  } catch {
    return fallback;
  }
}

export async function apiFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  const { requireAuth = false, headers, ...rest } = options;
  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };
  if (!(rest.body instanceof FormData) && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  if (rest.body instanceof FormData) {
    delete requestHeaders['Content-Type'];
  }

  if (requireAuth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const doRequest = (retryHeaders: Record<string, string>) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: retryHeaders,
      credentials: 'include',
      // Tránh browser cache API response - sản phẩm mới sẽ hiện ngay
      cache: 'no-store',
    });

  let response = await doRequest(requestHeaders);

  if (requireAuth && response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doRequest({
        ...requestHeaders,
        Authorization: `Bearer ${newToken}`,
      });
    }
  }

  return response;
}
