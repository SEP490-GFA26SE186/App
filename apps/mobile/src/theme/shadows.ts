// apps/mobile/src/theme/shadows.ts — Độ nổi (elevation) đa nền tảng (R1, UI_UX_REDESIGN_PLAN §3 I2)
// boxShadow chỉ được RN 0.76 vẽ khi bật New Architecture (app.json chưa khai báo newArchEnabled),
// nên mỗi nền tảng dùng cơ chế riêng:
//   Web     → boxShadow (CSS, giống --shadow-* của Web)
//   Android → elevation (+ shadowColor, có tác dụng từ Android 9)
//   iOS     → shadowColor/Offset/Opacity/Radius
// Bóng chỉ là phụ: thẻ luôn có viền `Colors.outline` để vẫn có cạnh khi máy không vẽ bóng.
// Lưu ý Android: elevation cần backgroundColor đặc trên cùng View.
import { Platform, ViewStyle } from 'react-native';

const SHADOW_INK = '#1E293B';

const make = (web: string, elevation: number, ios: { y: number; radius: number; opacity: number }): ViewStyle =>
  Platform.select<ViewStyle>({
    web: { boxShadow: web } as ViewStyle,
    android: { elevation, shadowColor: SHADOW_INK },
    default: {
      shadowColor: SHADOW_INK,
      shadowOffset: { width: 0, height: ios.y },
      shadowOpacity: ios.opacity,
      shadowRadius: ios.radius,
    },
  });

export const Elevation = {
  none: {} as ViewStyle,
  /** Thẻ, ô nhập nổi nhẹ */
  low: make('0 4px 16px -2px rgba(30, 41, 59, 0.06), 0 2px 6px -1px rgba(255, 122, 0, 0.04)', 2, { y: 2, radius: 6, opacity: 0.06 }),
  /** Nút chính, thẻ được chọn, tab bar */
  mid: make('0 12px 28px -4px rgba(30, 41, 59, 0.10), 0 4px 12px -2px rgba(255, 122, 0, 0.08)', 4, { y: 6, radius: 12, opacity: 0.1 }),
  /** Sheet, modal, FAB */
  high: make('0 20px 40px -6px rgba(30, 41, 59, 0.14), 0 8px 16px -2px rgba(255, 122, 0, 0.10)', 8, { y: 10, radius: 20, opacity: 0.14 }),
};

/** Alias tên cũ (Fairy Glow) → mức độ nổi mới; giữ để không vỡ import cũ. */
export const Shadows: Record<string, ViewStyle> = {
  card: Elevation.low,
  storyCard: Elevation.low,
  ctaButton: Elevation.mid,
  tabBar: Elevation.mid,
  hero: Elevation.mid,
  modal: Elevation.high,
  badge: Elevation.none,
  header: Elevation.low,
  sky: Elevation.low,
};
