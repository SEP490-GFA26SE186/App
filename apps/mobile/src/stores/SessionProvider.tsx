// apps/mobile/src/stores/SessionProvider.tsx
// Ghép 3 store độc lập (phiên Parent, dữ liệu Parent, Kid session) bằng React context; không thêm thư viện state.
// Mỗi store có context riêng để tách trách nhiệm: kid session KHÔNG nằm chung với phiên/token Parent.
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { SessionUser } from '../types/sessionUser';
import { SESSION_EXPIRED_NOTICE, useAuthSessionState } from './useAuthSession';
import { useParentDataState } from './useParentData';
import { useKidSessionState } from './useKidSession';

type AuthStore = Omit<ReturnType<typeof useAuthSessionState>, 'startSession'> & {
  bootstrapSession: () => Promise<void>;
  /** Bắt đầu phiên với user do BE xác nhận rồi tải dữ liệu Parent */
  startSession: (user: SessionUser) => void;
  /** Kid session mất/hết hạn: không thể thoát bằng PIN → xóa phiên và buộc đăng nhập lại bằng mật khẩu */
  onKidSessionLost: () => void;
};
type ParentDataStore = ReturnType<typeof useParentDataState> & { reload: () => Promise<void> };
type KidStore = ReturnType<typeof useKidSessionState>;

const AuthContext = createContext<AuthStore | null>(null);
const ParentDataContext = createContext<ParentDataStore | null>(null);
const KidContext = createContext<KidStore | null>(null);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sessionRef = useRef(0);
  const data = useParentDataState(sessionRef);
  const kid = useKidSessionState({
    selectedChild: data.selectedChild,
    onExited: () => {
      void loadData();
    },
  });
  const auth = useAuthSessionState({
    sessionRef,
    onReset: () => {
      data.reset();
      kid.reset();
    },
  });

  // Tải dữ liệu Parent; BE từ chối phiên (401/403) → kết thúc phiên; /auth/me trả ví → cập nhật user
  const loadData = async (sid: number = sessionRef.current) => {
    const result = await data.loadAll(sid);
    if (result.outcome === 'expired') auth.endSession(SESSION_EXPIRED_NOTICE);
    else if (result.outcome === 'done' && result.user) auth.setCurrentUser(result.user);
  };

  const bootstrapSession = async () => {
    const sid = await auth.bootstrap();
    if (sid !== null) void loadData(sid);
  };

  useEffect(() => {
    if (auth.appPhase === 'BOOTING') void bootstrapSession();
  }, []);

  const authValue: AuthStore = {
    ...auth,
    bootstrapSession,
    startSession: (user) => {
      const sid = auth.startSession(user);
      void loadData(sid);
    },
    onKidSessionLost: () =>
      auth.endSession('Phiên Chế độ Bé không còn hợp lệ. Vui lòng đăng nhập lại bằng mật khẩu tài khoản.'),
  };

  return (
    <AuthContext.Provider value={authValue}>
      <ParentDataContext.Provider value={{ ...data, reload: () => loadData() }}>
        <KidContext.Provider value={kid}>{children}</KidContext.Provider>
      </ParentDataContext.Provider>
    </AuthContext.Provider>
  );
};

const need = <T,>(value: T | null, name: string): T => {
  if (!value) throw new Error(`${name} phải nằm trong <SessionProvider>`);
  return value;
};

export const useAuth = () => need(useContext(AuthContext), 'useAuth');
export const useParentData = () => need(useContext(ParentDataContext), 'useParentData');
export const useKidSession = () => need(useContext(KidContext), 'useKidSession');
