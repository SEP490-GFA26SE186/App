// apps/mobile/src/components/ui/Dialog.tsx — R9-A: hộp thoại xác nhận/thông báo dùng được trên Web.
// Nguyên nhân gốc: react-native-web cài `Alert.alert` là hàm RỖNG, nên mọi Alert (xác nhận xóa, lỗi 422, "chưa hỗ trợ") im lặng trên Web.
// Native (Android/iOS) vẫn dùng Alert.alert của hệ điều hành. Web dùng lớp phủ TRONG cây (không <Modal>): nút Hủy lấy focus đầu tiên,
// Esc = Hủy, nền phía sau bị `inert`, đóng xong trả focus. Hủy/đóng là lựa chọn an toàn (backdrop cũng = Hủy).
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Elevation } from '../../theme/shadows';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { HeyButton } from './HeyButton';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Nút xác nhận kiểu nguy hiểm (xóa) */
  destructive?: boolean;
}

interface DialogApi {
  /** Resolve true khi người dùng xác nhận, false khi Hủy/Esc/Back/chạm nền. Mỗi hộp thoại resolve đúng một lần. */
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  /** Thông báo một nút "Đã hiểu" (lỗi từ BE, "chưa hỗ trợ"…). */
  notify: (title: string, message?: string) => Promise<void>;
}

interface Pending {
  id: number;
  opts: ConfirmOptions;
  info: boolean;
  resolve: (v: boolean) => void;
}

const Ctx = createContext<DialogApi | null>(null);

// Cầu nối cho mã ngoài cây React hoặc nằm trên DialogProvider (vd. store phiên Kid): chưa gắn thì dùng Alert của hệ điều hành
let bridge: DialogApi | null = null;
export const notifyDialog = (title: string, message?: string): void => {
  if (bridge) void bridge.notify(title, message);
  else Alert.alert(title, message);
};

export const useDialog = (): DialogApi => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDialog phải nằm trong <DialogProvider>');
  return v;
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Pending[]>([]);
  const current = queue[0];
  const nextId = useRef(0);

  const enqueue = useCallback(
    (opts: ConfirmOptions, info: boolean) => new Promise<boolean>((resolve) => setQueue((q) => [...q, { id: ++nextId.current, opts, info, resolve }])),
    []
  );

  const api = useMemo<DialogApi>(
    () => ({
      confirm: (o) =>
        Platform.OS === 'web'
          ? enqueue(o, false)
          : new Promise<boolean>((resolve) =>
              Alert.alert(
                o.title,
                o.message,
                [
                  { text: o.cancelLabel ?? 'Hủy', style: 'cancel', onPress: () => resolve(false) },
                  { text: o.confirmLabel ?? 'Đồng ý', style: o.destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
                ],
                { cancelable: true, onDismiss: () => resolve(false) }
              )
            ),
      notify: async (title, message) => {
        if (Platform.OS === 'web') await enqueue({ title, message, confirmLabel: 'Đã hiểu' }, true);
        else Alert.alert(title, message);
      },
    }),
    [enqueue]
  );

  useEffect(() => {
    bridge = api;
    return () => {
      if (bridge === api) bridge = null;
    };
  }, [api]);

  const close = useCallback(
    (result: boolean) => {
      if (!current) return;
      current.resolve(result); // resolve trước khi bỏ khỏi hàng đợi; một lần duy nhất vì hàng đợi chỉ shift một lần
      setQueue((q) => q.slice(1));
    },
    [current]
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      {/* key theo từng hộp thoại: hộp kế tiếp trong hàng đợi phải mount mới (cờ `done`, focus, inert không dùng lại của hộp trước) */}
      {Platform.OS === 'web' && current && <WebDialog key={current.id} pending={current} onClose={close} />}
    </Ctx.Provider>
  );
};

const WebDialog: React.FC<{ pending: Pending; onClose: (result: boolean) => void }> = ({ pending, onClose }) => {
  const { opts, info } = pending;
  const rootRef = useRef<View>(null);
  const cancelWrap = useRef<View>(null);
  const done = useRef(false);
  const finish = (v: boolean) => {
    if (done.current) return; // chặn bấm đúp / Esc + bấm
    done.current = true;
    onClose(v);
  };

  useEffect(() => {
    const el = rootRef.current as unknown as HTMLElement | null;
    const prev = document.activeElement as HTMLElement | null;
    const others = el?.parentElement ? (Array.from(el.parentElement.children) as HTMLElement[]).filter((c) => c !== el) : [];
    others.forEach((c) => {
      c.setAttribute('inert', '');
      c.setAttribute('aria-hidden', 'true');
    });
    // Focus nút đầu tiên (Hủy; với thông báo là "Đã hiểu")
    (cancelWrap.current as unknown as HTMLElement | null)?.querySelector<HTMLElement>('[role=button]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
      else if (e.key === 'Tab') {
        // Giữ focus trong hộp thoại
        const btns = Array.from(el?.querySelectorAll<HTMLElement>('[role=button]') ?? []);
        if (!btns.length) return;
        const i = btns.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      others.forEach((c) => {
        c.removeAttribute('inert');
        c.removeAttribute('aria-hidden');
      });
      prev?.focus?.();
    };
  }, []);

  return (
    <View ref={rootRef} style={styles.overlay} accessibilityViewIsModal aria-modal accessibilityRole="alert" accessibilityLabel={opts.title}>
      <Pressable style={styles.backdrop} onPress={() => finish(false)} accessible={false} />
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          {opts.title}
        </Text>
        {!!opts.message && <Text style={styles.message}>{opts.message}</Text>}
        <View style={styles.actions}>
          {!info && (
            <View ref={cancelWrap} style={styles.btn}>
              <HeyButton title={opts.cancelLabel ?? 'Hủy'} variant="tertiary" onPress={() => finish(false)} />
            </View>
          )}
          <View ref={info ? cancelWrap : undefined} style={styles.btn}>
            <HeyButton
              title={opts.confirmLabel ?? 'Đồng ý'}
              variant={opts.destructive ? 'danger' : 'primary'}
              onPress={() => finish(true)}
              accessibilityLabel={opts.confirmLabel ?? 'Đồng ý'}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000, elevation: 40, alignItems: 'center', justifyContent: 'center', padding: Spacing.page },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.overlay },
  card: { width: '100%', maxWidth: 420, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md, ...Elevation.high },
  title: { ...Typography.heading, color: Colors.text },
  message: { ...Typography.body, fontSize: 14, color: Colors.text },
  actions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end', marginTop: Spacing.sm },
  btn: { flexShrink: 1 },
});
