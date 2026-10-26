// apps/mobile/src/stores/useKidSession.ts
// Trạng thái Kid Mode, tách khỏi phiên Parent. Chỉ vào/thoát khi BE xác nhận (S0.1/S0.2/S0.3d).
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ChildProfile } from '../../../../packages/shared-types';
import { authService } from '../services';

interface Options {
  /** Bé đang chọn ở màn Parent; Kid Mode mặc định vào bé này */
  selectedChild?: ChildProfile;
  /** Gọi sau khi thoát Kid Mode thành công (tải lại dữ liệu Parent bằng token mới) */
  onExited: () => void;
}

export const useKidSessionState = ({ selectedChild, onExited }: Options) => {
  const [isKidMode, setIsKidMode] = useState(false);
  // Bé đã được BE xác nhận khi vào Kid Mode
  const [kidChild, setKidChild] = useState<ChildProfile | null>(null);
  const enteringRef = useRef(false);
  const exitInFlightRef = useRef<Promise<void> | null>(null);

  const openKidMode = async (child?: ChildProfile) => {
    if (enteringRef.current || isKidMode) return;
    const target = child || selectedChild;
    if (!target) {
      Alert.alert('Chưa có hồ sơ bé', 'Ba mẹ cần thêm hồ sơ bé trước khi vào Chế độ Bé.');
      return;
    }
    enteringRef.current = true;
    try {
      await authService.enterKidMode(target.id);
      setKidChild(target);
      setIsKidMode(true);
    } catch (err: any) {
      Alert.alert('Không thể vào Chế độ Bé', err?.message || 'Vui lòng thử lại.');
    } finally {
      enteringRef.current = false;
    }
  };

  // Điểm duy nhất gọi exit; reject khi BE từ chối/lỗi để KidModeScreen hiện lỗi và giữ Kid Mode
  const exitKidMode = (pin: string): Promise<void> => {
    if (exitInFlightRef.current) return exitInFlightRef.current;
    const attempt = (async () => {
      await authService.exitKidMode(pin);
      setIsKidMode(false);
      setKidChild(null);
      onExited();
    })().finally(() => {
      exitInFlightRef.current = null;
    });
    exitInFlightRef.current = attempt;
    return attempt;
  };

  const reset = useCallback(() => {
    setIsKidMode(false);
    setKidChild(null);
  }, []);

  return { isKidMode, kidChild, openKidMode, exitKidMode, reset };
};
