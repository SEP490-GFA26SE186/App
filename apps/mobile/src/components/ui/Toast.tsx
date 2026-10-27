// apps/mobile/src/components/ui/Toast.tsx — R2: thông báo nhẹ thay Alert cho kết quả thành công (audit G3).
// Lỗi và câu hỏi xác nhận vẫn dùng Alert (cần người dùng đọc/chọn). Không dùng <Modal> native (xem QA_R1 CRIT-1).
// Tự ẩn sau 3.5s, chạm để ẩn sớm; bỏ trượt khi bật Giảm chuyển động.
// Vị trí (R3, QA_R2 LOW-1): đáy màn hình, phía trên thanh tab (như Snackbar của Android) nên không che header
// (logo, credit, avatar) hay thanh tab; màn có thanh tab gọi useToastBottomInset để chừa chỗ.
// Trình đọc màn hình (QA_R2 MED-2): Web đọc qua 2 vùng live LUÔN mount sẵn (status/polite cho success-info, alert/assertive
// cho danger) vì vùng live chèn vào cùng lúc với chữ thường bị bỏ qua; native dùng announceForAccessibility.
// Bản toast nhìn thấy không phải live region để không bị đọc hai lần.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Elevation } from '../../theme/shadows';
import { Radius, Spacing, Layout } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { useReduceMotion } from '../../utils/useReduceMotion';
import { Icon, IconName } from './Icon';

// RN Web không có native animated module (chạy JS và cảnh báo nếu bật)
const NATIVE_DRIVER = Platform.OS !== 'web';

export type ToastTone = 'success' | 'info' | 'danger';

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const InsetContext = createContext<((px: number) => void) | null>(null);

/** Chừa khoảng trống ở đáy cho toast (vd. chiều cao thanh tab). Trả về 0 khi component gỡ. */
export const useToastBottomInset = (px: number) => {
  const setInset = useContext(InsetContext);
  useEffect(() => {
    setInset?.(px);
  }, [setInset, px]);
  useEffect(() => () => setInset?.(0), [setInset]);
};

export const useToast = (): ToastApi => {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast phải nằm trong <ToastProvider>');
  return api;
};

const DURATION_MS = 3500;

// Icon sáng trên nền navy, đều >= 3:1 (WCAG 1.4.11): teal 4.7:1, hai sắc tint > 10:1
const TONE_ICON: Record<ToastTone, { name: IconName; color: string }> = {
  success: { name: 'checkmark-circle', color: Colors.tealBright },
  info: { name: 'information-circle', color: Colors.infoTint },
  danger: { name: 'alert-circle', color: Colors.dangerTint },
};

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const [bottomInset, setBottomInset] = useState(0);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: ++seq.current, message, tone });
    // RN Web: announceForAccessibility là hàm rỗng → Web dùng vùng live bên dưới
    if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(message);
    timer.current = setTimeout(() => setToast(null), DURATION_MS);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      <InsetContext.Provider value={setBottomInset}>{children}</InsetContext.Provider>
      {toast && <ToastView key={toast.id} toast={toast} onDismiss={hide} bottomInset={bottomInset} />}
      {Platform.OS === 'web' && (
        <>
          {/* key đổi theo từng toast → nút chữ mới được chèn vào vùng có sẵn → được đọc, kể cả khi trùng nội dung */}
          <View role="status" aria-live="polite" style={styles.srOnly}>
            {toast && toast.tone !== 'danger' && <Text key={toast.id}>{toast.message}</Text>}
          </View>
          <View role="alert" aria-live="assertive" style={styles.srOnly}>
            {toast?.tone === 'danger' && <Text key={toast.id}>{toast.message}</Text>}
          </View>
        </>
      )}
    </ToastContext.Provider>
  );
};

const ToastView: React.FC<{ toast: ToastState; onDismiss: () => void; bottomInset: number }> = ({ toast, onDismiss, bottomInset }) => {
  const reduceMotion = useReduceMotion();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: reduceMotion ? 0 : 180, useNativeDriver: NATIVE_DRIVER }).start();
  }, [enter, reduceMotion]);

  const icon = TONE_ICON[toast.tone];
  return (
    // Dời host lên bằng `bottom` (không dùng margin): vùng margin nằm trong phần tử nhận chạm sẽ chặn thanh tab bên dưới
    <SafeAreaView style={[styles.host, { bottom: Spacing.sm + bottomInset }]}>
      <Animated.View
        style={{
          opacity: enter,
          transform: reduceMotion ? [] : [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}
      >
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={toast.message}
          accessibilityHint="Chạm để ẩn thông báo"
          style={(s) => [styles.toast, focusRing(s)]}
        >
          <Icon name={icon.name} size={22} color={icon.color} />
          <Text style={styles.text}>{toast.message}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.page,
    maxWidth: Layout.maxContentWidth,
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.text,
    ...Elevation.high,
  },
  // Chỉ dành cho trình đọc màn hình: nằm ngoài màn hình nhưng vẫn trong cây trợ năng (display:none sẽ bị loại khỏi cây)
  srOnly: { position: 'absolute', left: -10000, top: 0, width: 1, height: 1, overflow: 'hidden' },
  // Trắng trên navy 14:1
  text: { ...Typography.body, fontSize: 15, lineHeight: 21, color: Colors.onStrong, flexShrink: 1 },
});
