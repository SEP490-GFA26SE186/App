// apps/mobile/src/services/authService.ts
import { apiFetch, ApiError } from './apiClient';
import { safeStorage, STORAGE_KEYS } from './storage';
import { SessionUser } from '../types/sessionUser';
import type {
  AuthUserDto,
  EnterKidModeResponseDto,
  ExitKidModeResponseDto,
  LoginResponseDto,
  MeResponseDto,
} from '../types/api';

export type LoginResponse = LoginResponseDto;

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

// BE trả message tiếng Anh → dịch các lỗi auth hay gặp cho ba mẹ (nguồn: Web/src/services/authService.js VI_MESSAGES)
const AUTH_VI_MESSAGES: Record<string, string> = {
  'Email is already registered': 'Email này đã được đăng ký, ba mẹ đăng nhập nhé',
  'Username is already taken': 'Tên đăng nhập đã có người dùng',
  'Invalid email address': 'Email chưa đúng định dạng',
  'Username must be at least 3 characters': 'Tên đăng nhập có ít nhất 3 ký tự',
  'Username can only contain letters, numbers, and underscores': 'Tên đăng nhập chỉ gồm chữ không dấu, số và dấu _',
  'Password must be at least 8 characters': 'Mật khẩu có ít nhất 8 ký tự',
  'Email or username is required': 'Ba mẹ nhập email hoặc tên đăng nhập nhé',
  'Password is required': 'Ba mẹ nhập mật khẩu nhé',
};

const translateAuthError = (error: unknown): unknown =>
  error instanceof ApiError && AUTH_VI_MESSAGES[error.message]
    ? new ApiError(AUTH_VI_MESSAGES[error.message], error.status, error.errors)
    : error;

export const authService = {
  /**
   * Đăng nhập: POST /auth/login
   */
  login: async (emailOrUsername: string, password: string): Promise<SessionUser> => {
    let data: LoginResponseDto | null;
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
      throw translateAuthError(error);
    }

    // Chỉ coi là đăng nhập thành công khi BE trả đủ user + tokens
    const tokens = data?.tokens;
    if (!data?.user || !tokens?.accessToken || !tokens?.refreshToken) {
      throw new ApiError('Phản hồi đăng nhập từ máy chủ không hợp lệ. Vui lòng thử lại.', 502);
    }

    // formatUser throw nếu user không hợp lệ → không ghi token
    const user = authService.formatUser(data.user);
    safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    safeStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    return user;
  },

  /**
   * Đăng ký: POST /auth/register
   */
  register: async (payload: RegisterPayload): Promise<SessionUser> => {
    let data: LoginResponseDto | null;
    try {
      data = await apiFetch<LoginResponse>('/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw translateAuthError(error);
    }

    // Chỉ coi là đăng ký thành công khi BE trả đủ user + tokens
    const tokens = data?.tokens;
    if (!data?.user || !tokens?.accessToken || !tokens?.refreshToken) {
      throw new ApiError('Phản hồi đăng ký từ máy chủ không hợp lệ. Vui lòng thử lại.', 502);
    }

    const user = authService.formatUser(data.user);
    safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    safeStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    return user;
  },

  /**
   * Lấy thông tin user hiện tại: GET /auth/me
   * Chỉ trả user do BE xác nhận; lỗi (401/403/mạng/5xx/response sai) đều throw.
   * Không dùng cache hay user mặc định thay thế. Dùng `isAuthError` để phân biệt
   * phiên không hợp lệ (401/403) với lỗi tạm thời (mạng/5xx).
   */
  getMe: async (): Promise<SessionUser> => {
    const data = await apiFetch<Partial<MeResponseDto>>('/auth/me');
    return authService.formatUser(data?.user);
  },

  /** 401/403 = phiên không hợp lệ; mạng (status 0) và 5xx KHÔNG phải lỗi xác thực */
  isAuthError: (error: unknown): boolean =>
    error instanceof ApiError && (error.status === 401 || error.status === 403),

  /**
   * Kid session không còn hợp lệ (mất/hết hạn/bị thu hồi) khi thoát Kid Mode:
   * 401 mà KHÔNG có `attemptsLeft` (PIN sai luôn kèm `attemptsLeft`, xem BE auth.service exitKidMode).
   */
  isKidSessionLost: (error: unknown): boolean => {
    if (!(error instanceof ApiError) || error.status !== 401) return false;
    const first = error.errors?.[0] as { attemptsLeft?: number } | undefined;
    return typeof first?.attemptsLeft !== 'number';
  },

  /** Xóa toàn bộ phiên cục bộ (đồng bộ, không gọi mạng) */
  clearLocalSession: (): void => {
    safeStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    safeStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    safeStorage.removeItem(STORAGE_KEYS.USER_DATA);
    safeStorage.removeItem(STORAGE_KEYS.KID_SESSION_TOKEN);
    safeStorage.removeItem(STORAGE_KEYS.CURRENT_CHILD_ID);
  },

  /**
   * Đăng xuất: xóa phiên cục bộ NGAY (đồng bộ) rồi mới báo BE thu hồi refresh token.
   * Nhờ vậy lời gọi mạng chậm không thể xóa nhầm phiên đăng nhập mới.
   */
  logout: async (): Promise<void> => {
    const refreshToken = safeStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    authService.clearLocalSession();
    if (!refreshToken) return;
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Best-effort: phiên cục bộ đã xóa; refresh token trên BE sẽ tự hết hạn
    }
  },

  isLoggedIn: (): boolean => {
    return !!safeStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getSavedUser: (): SessionUser | null => {
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
    // PIN chỉ được gửi cho BE; lỗi → throw (không báo đã lưu khi BE chưa lưu)
    await apiFetch('/auth/kid-pin/set', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
    return true;
  },

  /**
   * Đổi mã PIN Kid Mode: PUT /auth/kid-pin/change
   */
  changeKidPin: async (payload: { newPin: string; currentPin?: string; password?: string }): Promise<boolean> => {
    await apiFetch('/auth/kid-pin/change', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return true;
  },

  /**
   * Vào Chế độ Trẻ Em: POST /auth/kid-mode/enter { childId }
   */
  enterKidMode: async (childId: string): Promise<{ child: any; kidSessionToken: string }> => {
    let data: Partial<EnterKidModeResponseDto> | null;
    try {
      data = await apiFetch<Partial<EnterKidModeResponseDto>>('/auth/kid-mode/enter', {
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
    // Cô lập quyền Parent: trong Kid Mode không còn Parent token để gắn nhầm vào request.
    // Thoát bằng PIN, BE cấp tokens Parent mới; mất kid session → phải đăng nhập lại bằng mật khẩu.
    safeStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    safeStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
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

    const data = await apiFetch<Partial<ExitKidModeResponseDto>>('/auth/kid-mode/exit', {
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

  formatUser: (raw: Partial<AuthUserDto> | undefined | null): SessionUser => {
    // Không tạo user khi BE trả dữ liệu thiếu/sai
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id || typeof raw.email !== 'string' || !raw.email) {
      throw new ApiError('Dữ liệu tài khoản từ máy chủ không hợp lệ.', 502);
    }
    const numberOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    return {
      id: raw.id,
      email: raw.email,
      fullName: raw.fullName || raw.username || 'Phụ huynh',
      // BE không trả avatar (API_MAPPING §1): ảnh mặc định cho UI
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      phone: raw.phone || '',
      role: (raw.role?.toUpperCase() as any) || 'PARENT',
      kidModePinHash: raw.hasKidPin ? '****' : '',
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // null = BE chưa trả ví (login không có wallet); UI hiển thị "—"
      creditBalance: numberOrNull(raw.wallet?.creditBalance),
      // Ví người bán/ngân hàng thuộc SCOPE PENDING: BE trả earningAvailableVnd, chưa ánh xạ (không bịa)
    };
  },
};
