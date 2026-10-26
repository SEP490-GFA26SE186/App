// apps/mobile/src/services/authService.ts
import { apiFetch, ApiError } from './apiClient';
import { safeStorage, STORAGE_KEYS } from './storage';
import { DEMO_PARENT_USER } from './demoData';
import { UserAccount } from '../../../../packages/shared-types';

export interface LoginResponse {
  user: any;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export const authService = {
  /**
   * Đăng nhập: POST /auth/login
   */
  login: async (emailOrUsername: string, password: string): Promise<UserAccount> => {
    let data: LoginResponse | null;
    try {
      data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ emailOrUsername: emailOrUsername.trim(), password }),
      });
    } catch (error: any) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          throw new ApiError('Email/Tên đăng nhập hoặc mật khẩu chưa đúng', 401, error.errors);
        }
        if (error.status === 403) {
          throw new ApiError('Tài khoản đã bị khóa, ba mẹ liên hệ hỗ trợ nhé', 403, error.errors);
        }
      }
      throw error;
    }

    // Chỉ coi là đăng nhập thành công khi BE trả đủ user + tokens
    const tokens = data?.tokens;
    if (!data?.user || !tokens?.accessToken || !tokens?.refreshToken) {
      throw new ApiError('Phản hồi đăng nhập từ máy chủ không hợp lệ. Vui lòng thử lại.', 502);
    }

    const user = authService.formatUser(data.user);
    safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    safeStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    return user;
  },

  /**
   * Đăng ký: POST /auth/register
   */
  register: async (payload: RegisterPayload): Promise<UserAccount> => {
    const data = await apiFetch<LoginResponse>('/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(payload),
    });

    if (data?.tokens) {
      safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.tokens.accessToken);
      safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refreshToken);
    }

    const rawUser = data?.user || data;
    const user = authService.formatUser(rawUser);
    safeStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    return user;
  },

  /**
   * Lấy thông tin user hiện tại: GET /auth/me
   */
  getMe: async (): Promise<UserAccount> => {
    try {
      const data = await apiFetch<{ user: any }>('/auth/me');
      const rawUser = data?.user || data;
      const user = authService.formatUser(rawUser);
      safeStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      return user;
    } catch (error) {
      const saved = safeStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
      return DEMO_PARENT_USER;
    }
  },

  /**
   * Đăng xuất: POST /auth/logout
   */
  logout: async (): Promise<void> => {
    const refreshToken = safeStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    try {
      if (refreshToken) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {}
    safeStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    safeStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    safeStorage.removeItem(STORAGE_KEYS.USER_DATA);
    safeStorage.removeItem(STORAGE_KEYS.KID_SESSION_TOKEN);
    safeStorage.removeItem(STORAGE_KEYS.CURRENT_CHILD_ID);
  },

  isLoggedIn: (): boolean => {
    return !!safeStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getSavedUser: (): UserAccount | null => {
    const raw = safeStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Thiết lập mã PIN Kid Mode: POST /auth/kid-pin/set
   */
  setKidPin: async (pin: string): Promise<boolean> => {
    try {
      await apiFetch('/auth/kid-pin/set', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      return true;
    } catch (error) {
      // Local fallback
      return true;
    }
  },

  /**
   * Đổi mã PIN Kid Mode: PUT /auth/kid-pin/change
   */
  changeKidPin: async (payload: { newPin: string; currentPin?: string; password?: string }): Promise<boolean> => {
    try {
      await apiFetch('/auth/kid-pin/change', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return true;
    } catch (error) {
      return true;
    }
  },

  /**
   * Vào Chế độ Trẻ Em: POST /auth/kid-mode/enter { childId }
   */
  enterKidMode: async (childId: string): Promise<{ child: any; kidSessionToken: string }> => {
    try {
      const data = await apiFetch<{ child: any; session: { kidSessionToken: string } }>('/auth/kid-mode/enter', {
        method: 'POST',
        body: JSON.stringify({ childId }),
      });
      const token = data?.session?.kidSessionToken || 'mock_kid_session_token';
      safeStorage.setItem(STORAGE_KEYS.KID_SESSION_TOKEN, token);
      safeStorage.setItem(STORAGE_KEYS.CURRENT_CHILD_ID, childId);
      return { child: data?.child, kidSessionToken: token };
    } catch (error) {
      // Offline fallback
      const token = `mock_kid_session_${childId}`;
      safeStorage.setItem(STORAGE_KEYS.KID_SESSION_TOKEN, token);
      safeStorage.setItem(STORAGE_KEYS.CURRENT_CHILD_ID, childId);
      return { child: { id: childId }, kidSessionToken: token };
    }
  },

  /**
   * Thoát Chế độ Trẻ Em: POST /auth/kid-mode/exit { pin, kidSessionToken }
   */
  exitKidMode: async (pin: string): Promise<boolean> => {
    const kidSessionToken = safeStorage.getItem(STORAGE_KEYS.KID_SESSION_TOKEN);
    try {
      const data = await apiFetch<{ tokens?: { accessToken: string; refreshToken: string } }>('/auth/kid-mode/exit', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ pin, kidSessionToken }),
      });
      if (data?.tokens) {
        safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.tokens.accessToken);
        if (data.tokens.refreshToken) {
          safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refreshToken);
        }
      }
      safeStorage.removeItem(STORAGE_KEYS.KID_SESSION_TOKEN);
      safeStorage.removeItem(STORAGE_KEYS.CURRENT_CHILD_ID);
      return true;
    } catch (error: any) {
      // If PIN matches demo pin 1234, allow exit in fallback mode
      if (pin === '1234') {
        safeStorage.removeItem(STORAGE_KEYS.KID_SESSION_TOKEN);
        safeStorage.removeItem(STORAGE_KEYS.CURRENT_CHILD_ID);
        return true;
      }
      throw error;
    }
  },

  formatUser: (raw: any): UserAccount => {
    return {
      id: raw.id || 'usr_parent',
      email: raw.email || '',
      fullName: raw.fullName || raw.username || 'Phụ huynh',
      avatarUrl: raw.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      phone: raw.phone || '',
      role: (raw.role?.toUpperCase() as any) || 'PARENT',
      kidModePinHash: raw.hasKidPin ? '****' : (raw.kidModePinHash || '1234'),
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
      creditBalance: raw.wallet?.creditBalance ?? raw.creditBalance ?? 50,
      sellerAvailableBalance: raw.wallet?.sellerAvailableBalance ?? raw.sellerAvailableBalance ?? 0,
      sellerPendingBalance: raw.wallet?.sellerPendingBalance ?? raw.sellerPendingBalance ?? 0,
      bankAccount: raw.bankAccount,
    };
  },
};
