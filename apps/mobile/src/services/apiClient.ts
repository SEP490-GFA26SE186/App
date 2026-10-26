// apps/mobile/src/services/apiClient.ts
import { getApiBaseUrl } from './config';
import { safeStorage, STORAGE_KEYS } from './storage';

export class ApiError extends Error {
  status?: number;
  errors?: Array<{ path: string; message: string }>;

  constructor(message: string, status?: number, errors?: Array<{ path: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export const extractErrorMessage = (errorData: any, fallback = 'Có lỗi xảy ra, ba mẹ thử lại sau nhé'): string => {
  if (!errorData) return fallback;
  if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
    return errorData.errors[0]?.message || fallback;
  }
  return errorData.message || fallback;
};

/** Response 2xx nhưng sai hình dạng so với contract BE: không được coi là thành công */
export const invalidResponseError = (what: string): ApiError =>
  new ApiError(`Phản hồi ${what} từ máy chủ không hợp lệ. Vui lòng thử lại.`, 502);

// Refresh token handler
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = safeStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) throw new ApiError('Không có refresh token', 401);

      const url = `${getApiBaseUrl()}/auth/refresh-tokens`;
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Mất mạng tạm thời: KHÔNG xóa phiên
        throw new ApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.', 0);
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        if (res.status >= 500) {
          // Lỗi máy chủ tạm thời: KHÔNG xóa phiên
          throw new ApiError(extractErrorMessage(data, `Lỗi máy chủ (${res.status})`), res.status);
        }
        // 4xx: refresh token bị BE từ chối → phiên thực sự không còn hợp lệ
        safeStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        safeStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        throw new ApiError(extractErrorMessage(data, 'Phiên đăng nhập đã hết hạn'), 401);
      }

      const newAccessToken = data?.data?.tokens?.accessToken;
      const newRefreshToken = data?.data?.tokens?.refreshToken;
      if (!newAccessToken) {
        throw new ApiError('Phản hồi làm mới phiên từ máy chủ không hợp lệ.', 502);
      }
      safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
      if (newRefreshToken) {
        safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
      }
      return newAccessToken;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export const apiFetch = async <T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!options.skipAuth) {
    const token = safeStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err: any) {
    throw new ApiError(err?.message === 'Network request failed' ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc chế độ máy chủ.' : (err?.message || 'Lỗi mạng'), 0);
  }

  // Handle 401 Token Expiration (excluding auth routes)
  const isAuthRoute = cleanEndpoint.startsWith('/auth/login') || cleanEndpoint.startsWith('/auth/register') || cleanEndpoint.startsWith('/auth/refresh-tokens');
  if (res.status === 401 && !options.skipAuth && !isAuthRoute) {
    try {
      const newToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    } catch (refreshError) {
      // Lỗi mạng/5xx khi refresh: giữ phiên, báo lỗi thật để người dùng thử lại
      if (refreshError instanceof ApiError && refreshError.status !== 401) {
        throw refreshError;
      }
      safeStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const errorMsg = extractErrorMessage(json, `Lỗi máy chủ (${res.status})`);
    throw new ApiError(errorMsg, res.status, json?.errors);
  }

  return json?.data ?? json;
};

// Client for Kid Mode with kidSessionToken
export const kidFetch = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const kidToken = safeStorage.getItem(STORAGE_KEYS.KID_SESSION_TOKEN);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (kidToken) {
    headers['Authorization'] = `Bearer ${kidToken}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err: any) {
    throw new ApiError('Không thể kết nối đến máy chủ trong Chế độ Trẻ Em.', 0);
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const errorMsg = extractErrorMessage(json, `Lỗi Kid Mode (${res.status})`);
    throw new ApiError(errorMsg, res.status, json?.errors);
  }

  return json?.data ?? json;
};
