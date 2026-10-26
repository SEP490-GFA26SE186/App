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

// BE trả message tiếng Anh → dịch các lỗi vào Kid Mode hay gặp (đối chiếu auth.service.js enterKidMode)
const KID_ENTER_VI_MESSAGES: Record<string, string> = {
  'You must set a Kid Exit PIN before entering Kid Mode': 'Ba mẹ cần đặt mã PIN trước khi vào Chế độ Bé',
  'Child profile not found or does not belong to this account': 'Không tìm thấy hồ sơ bé này trong tài khoản',
};

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
    let data: { child?: any; session?: { kidSessionToken?: string } } | null;
    try {
      data = await apiFetch<{ child?: any; session?: { kidSessionToken?: string } }>('/auth/kid-mode/enter', {
        method: 'POST',
        body: JSON.stringify({ childId }),
      });
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw new ApiError(KID_ENTER_VI_MESSAGES[error.message] ?? error.message, error.status, error.errors);
      }
      throw error;
    }

    // Chỉ coi là vào Kid Mode khi BE trả session hợp lệ cho đúng bé đã yêu cầu
    const token = data?.session?.kidSessionToken;
    if (!token || typeof token !== 'string' || !data?.child?.id || data.child.id !== childId) {
      throw new ApiError('Phản hồi vào Chế độ Bé từ máy chủ không hợp lệ. Vui lòng thử lại.', 502);
    }

    safeStorage.setItem(STORAGE_KEYS.KID_SESSION_TOKEN, token);
    safeStorage.setItem(STORAGE_KEYS.CURRENT_CHILD_ID, childId);
    return { child: data.child, kidSessionToken: token };
  },

  /**
   * Thoát Chế độ Trẻ Em: POST /auth/kid-mode/exit { pin, kidSessionToken }
   * Chỉ trả về khi BE xác minh PIN và trả tokens hợp lệ; mọi trường hợp khác throw
   * và giữ nguyên kid session.
   */
  exitKidMode: async (pin: string): Promise<boolean> => {
    const kidSessionToken = safeStorage.getItem(STORAGE_KEYS.KID_SESSION_TOKEN);
    if (!kidSessionToken) {
      throw new ApiError('Không tìm thấy phiên Chế độ Bé. Vui lòng thử lại hoặc khởi động lại ứng dụng.', 401);
    }

    const data = await apiFetch<{ tokens?: { accessToken?: string; refreshToken?: string } }>('/auth/kid-mode/exit', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ pin, kidSessionToken }),
    });

    const tokens = data?.tokens;
    if (!tokens?.accessToken || !tokens?.refreshToken) {
      throw new ApiError('Phản hồi thoát Chế độ Bé từ máy chủ không hợp lệ. Vui lòng thử lại.', 502);
    }

    safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    safeStorage.removeItem(STORAGE_KEYS.KID_SESSION_TOKEN);
    safeStorage.removeItem(STORAGE_KEYS.CURRENT_CHILD_ID);
    return true;
  },

  formatUser: (raw: any): UserAccount => {
    return {
      id: raw.id || 'usr_parent',
      email: raw.email || '',
      fullName: raw.fullName || raw.username || 'Phụ huynh',
      avatarUrl: raw.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      phone: raw.phone || '',
      role: (raw.role?.toUpperCase() as any) || 'PARENT',
      kidModePinHash: raw.hasKidPin ? '****' : '',
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
      creditBalance: raw.wallet?.creditBalance ?? raw.creditBalance ?? 50,
      sellerAvailableBalance: raw.wallet?.sellerAvailableBalance ?? raw.sellerAvailableBalance ?? 0,
      sellerPendingBalance: raw.wallet?.sellerPendingBalance ?? raw.sellerPendingBalance ?? 0,
      bankAccount: raw.bankAccount,
    };
  },
};
