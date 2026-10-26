// apps/mobile/src/stores/useAuthSession.ts
// Phiên Parent: BOOTING → (LOGIN | REGISTER | APP). Chỉ vào APP khi BE xác nhận (getMe / login / register).
import { MutableRefObject, useState } from 'react';
import { SessionUser } from '../types/sessionUser';
import { authService, ApiError } from '../services';

export type AppPhase = 'BOOTING' | 'BOOT_ERROR' | 'LOGIN' | 'REGISTER' | 'APP';

export const SESSION_EXPIRED_NOTICE = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

// Không để màn BOOTING treo vô thời hạn khi máy chủ không phản hồi
const BOOT_TIMEOUT_MS = 15000;

const withTimeout = <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new ApiError(message, 0)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

interface Options {
  /** Tăng mỗi khi phiên đổi (đăng nhập/đăng xuất/hết hạn): kết quả request cũ bị bỏ qua */
  sessionRef: MutableRefObject<number>;
  /** Xóa state thuộc phiên trước (dữ liệu Parent, Kid Mode) */
  onReset: () => void;
}

export const useAuthSessionState = ({ sessionRef, onReset }: Options) => {
  // Có token → phải xác minh với BE (BOOTING) trước khi vào APP; không có token → Login
  const [appPhase, setAppPhase] = useState<AppPhase>(() => (authService.isLoggedIn() ? 'BOOTING' : 'LOGIN'));
  const [bootError, setBootError] = useState<string | null>(null);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  // Kết thúc phiên cục bộ (hết hạn / không phục hồi được) và về Login
  const endSession = (notice?: string) => {
    sessionRef.current += 1;
    authService.clearLocalSession();
    onReset();
    setCurrentUser(null);
    setLoginNotice(notice ?? null);
    setAppPhase('LOGIN');
  };

  // Bắt đầu phiên sau khi đăng nhập/đăng ký thành công (user do BE xác nhận). Trả về id phiên mới.
  const startSession = (user: SessionUser): number => {
    const sid = ++sessionRef.current;
    onReset();
    setCurrentUser(user);
    setLoginNotice(null);
    setAppPhase('APP');
    return sid;
  };

  // Xác minh token hiện có với BE. Trả về id phiên khi thành công, null nếu không vào được APP.
  const bootstrap = async (): Promise<number | null> => {
    const sid = ++sessionRef.current;
    setBootError(null);
    setAppPhase('BOOTING');
    try {
      const me = await withTimeout(
        authService.getMe(),
        BOOT_TIMEOUT_MS,
        'Máy chủ phản hồi quá lâu. Vui lòng kiểm tra mạng và thử lại.'
      );
      if (sid !== sessionRef.current) return null;
      setCurrentUser(me);
      setAppPhase('APP');
      return sid;
    } catch (err: any) {
      if (sid !== sessionRef.current) return null;
      if (authService.isAuthError(err)) {
        endSession(SESSION_EXPIRED_NOTICE);
        return null;
      }
      // Mất mạng/5xx/timeout/thiếu cấu hình: không vào APP, không xóa phiên, cho phép thử lại
      setBootError(err?.message || 'Không thể xác minh phiên đăng nhập.');
      setAppPhase('BOOT_ERROR');
      return null;
    }
  };

  const logout = () => {
    sessionRef.current += 1;
    // logout() xóa phiên cục bộ ngay (đồng bộ) rồi mới báo BE; không chờ mạng để chuyển màn
    void authService.logout();
    onReset();
    setCurrentUser(null);
    setLoginNotice(null);
    setAppPhase('LOGIN');
  };

  const showRegister = () => setAppPhase('REGISTER');
  const showLogin = () => setAppPhase('LOGIN');

  return {
    appPhase,
    bootError,
    loginNotice,
    currentUser,
    setCurrentUser,
    endSession,
    startSession,
    bootstrap,
    logout,
    showRegister,
    showLogin,
  };
};
