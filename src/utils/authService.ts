// src/utils/authService.ts
// Quản lý JWT token và authenticated API calls cho BE thật

const ACCESS_TOKEN_KEY = 'sw_access_token';
const REFRESH_TOKEN_KEY = 'sw_refresh_token';
const USER_PROFILE_KEY = 'sw_user_profile';

// ─── Token & User storage ──────────────────────────────────────────────────

export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const saveUser = (user: any) => {
  if (user) {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  }
};

export const getSavedUser = (): any | null => {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
};

export const isLoggedIn = (): boolean => {
  return !!getAccessToken();
};

// ─── Error message helper ──────────────────────────────────────────────────
const extractErrorMessage = (json: any, defaultMsg: string): string => {
  if (json?.errors && Array.isArray(json.errors) && json.errors.length > 0) {
    return json.errors.map((e: any) => e.message || e).join(', ');
  }
  return json?.message || defaultMsg;
};

// ─── Health Check ─────────────────────────────────────────────────────────
export const checkHealthApi = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/health');
    const json = await res.json();
    return res.ok && json.status === 'ok';
  } catch {
    return false;
  }
};

// ─── Refresh access token dùng refresh token ──────────────────────────────
export const refreshTokensApi = async (): Promise<{ accessToken: string; refreshToken: string }> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('Không có refresh token');

  const res = await fetch('/api/auth/refresh-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const json = await res.json();
  if (!res.ok) {
    clearTokens();
    throw new Error(extractErrorMessage(json, 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'));
  }
  const { tokens } = json.data;
  saveTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
};

// ─── Authenticated fetch (tự động đính kèm Bearer token & refresh khi 401) ──
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = getAccessToken();
  const getHeaders = (t: string | null) => ({
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  });

  let res = await fetch(url, { ...options, headers: getHeaders(token) });

  // Nếu gặp 401 (hết hạn token) và có refresh token → thử refresh và gửi lại 1 lần
  if (res.status === 401 && getRefreshToken()) {
    try {
      const tokens = await refreshTokensApi();
      res = await fetch(url, { ...options, headers: getHeaders(tokens.accessToken) });
    } catch {
      clearTokens();
    }
  }

  return res;
};

// ─── Auth API calls → BE thật ─────────────────────────────────────────────

/**
 * Đăng nhập
 * BE: POST /api/v1/auth/login
 * Body: { emailOrUsername, password }
 * Response: { success, message, data: { user, tokens } }
 */
export const loginApi = async (emailOrUsername: string, password: string) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: emailOrUsername.trim(), password }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(json, 'Đăng nhập thất bại'));
  }
  const { user, tokens } = json.data;
  saveTokens(tokens.accessToken, tokens.refreshToken);
  saveUser(user);
  return user;
};

/**
 * Đăng ký
 * BE: POST /api/v1/auth/register
 * Body: { username, email, password, fullName?, phone? }
 * Response: { success, message, data: { user, tokens } }
 */
export const registerApi = async (
  username: string,
  email: string,
  password: string,
  fullName?: string,
  phone?: string,
) => {
  // Chuẩn hóa username theo quy tắc BE: chỉ [a-zA-Z0-9_], min 3, max 50 ký tự
  let cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (cleanUsername.length < 3) {
    cleanUsername = (cleanUsername + '_usr').slice(0, 50);
  }

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: cleanUsername,
      email: email.trim().toLowerCase(),
      password,
      fullName: fullName?.trim() || undefined,
      phone: phone?.trim() || undefined,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(json, 'Đăng ký thất bại'));
  }
  const { user, tokens } = json.data;
  saveTokens(tokens.accessToken, tokens.refreshToken);
  saveUser(user);
  return user;
};

/**
 * Lấy profile user hiện tại (cần token)
 * BE: GET /api/v1/auth/me
 * Header: Authorization: Bearer <accessToken>
 * Response: { success, data: { user } }
 */
export const getMeApi = async () => {
  const saved = getSavedUser();
  try {
    const res = await authFetch('/api/auth/me');
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.user) {
        saveUser(json.data.user);
        return json.data.user;
      }
    }
  } catch {}
  
  // Nếu BE gặp sự cố (ví dụ 500 BigInt), trả về user đã lưu từ login/register
  if (saved) return saved;
  throw new Error('Chưa đăng nhập');
};

/**
 * Đăng xuất
 * BE: POST /api/v1/auth/logout
 * Body: { refreshToken }
 * Response: { success, message }
 */
export const logoutApi = async () => {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await authFetch('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Bỏ qua lỗi mạng khi logout
    }
  }
  clearTokens();
};
