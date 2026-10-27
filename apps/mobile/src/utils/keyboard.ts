// apps/mobile/src/utils/keyboard.ts — R9-A: Space kích hoạt nút trên Web cho phần tử role radio/checkbox.
// react-native-web chỉ cho Enter/Space kích hoạt Pressable khi role=button; radio/checkbox (chip, segmented, lựa chọn Wizard) chỉ nhận Enter.
import { Platform } from 'react-native';

/** Spread vào `Pressable`: `{...spaceActivates(onPress)}`. Native: không làm gì. */
export const spaceActivates = (onPress?: () => void): Record<string, unknown> =>
  Platform.OS === 'web' && onPress
    ? {
        onKeyDown: (e: any) => {
          if (e.key === ' ' && e.target === e.currentTarget) {
            e.preventDefault();
            onPress();
          }
        },
      }
    : {};
