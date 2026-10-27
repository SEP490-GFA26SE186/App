// apps/mobile/src/theme/focus.ts — R2: viền focus bàn phím trên Web (WCAG 2.4.7).
// Native dùng cơ chế focus của hệ thống (TalkBack/VoiceOver), không vẽ thêm viền.
import { Platform, PressableStateCallbackType, ViewStyle } from 'react-native';
import { Colors } from './colors';

const RING: ViewStyle = {
  // Thuộc tính outline chỉ có trên react-native-web
  outlineStyle: 'solid',
  outlineWidth: 2,
  outlineColor: Colors.focus,
  outlineOffset: 2,
} as ViewStyle;

// Như :focus-visible: chỉ vẽ viền khi người dùng đang dùng bàn phím; chạm/chuột cũng làm phần tử focus nhưng không vẽ viền
let keyboardModality = false;
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.addEventListener(
    'keydown',
    (e) => {
      if (!e.metaKey && !e.altKey && !e.ctrlKey) keyboardModality = true;
    },
    true
  );
  for (const type of ['pointerdown', 'mousedown', 'touchstart']) {
    document.addEventListener(type, () => (keyboardModality = false), true);
  }
}

/** Dùng trong style của Pressable: `style={(s) => [styles.btn, focusRing(s)]}`. RN Web truyền thêm `focused`. */
export const focusRing = (state: PressableStateCallbackType): ViewStyle | null =>
  Platform.OS === 'web' && keyboardModality && (state as PressableStateCallbackType & { focused?: boolean }).focused
    ? RING
    : null;
