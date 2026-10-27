// apps/mobile/src/components/ui/HeyCard.tsx — R1 Warm Storybook Guardian
// Giữ nguyên tên variant cũ; nền theo token mới. Thẻ luôn có viền mảnh để vẫn có cạnh khi nền tảng không vẽ bóng.
// R2: variant ngữ nghĩa surface | brand | accent | info | muted | kid; tên cũ là alias (white = surface, coral/yellow = brand,
// teal/mint = accent, sky = info, purple giữ nguyên).
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Elevation } from '../../theme/shadows';
import { Radius, Spacing } from '../../theme/spacing';

interface HeyCardProps {
  children: React.ReactNode;
  variant?: 'surface' | 'brand' | 'accent' | 'info' | 'muted' | 'kid' | 'white' | 'coral' | 'purple' | 'yellow' | 'teal' | 'sky' | 'mint';
  style?: ViewStyle | ViewStyle[];
  noPadding?: boolean;
}

const VARIANT_BG: Record<NonNullable<HeyCardProps['variant']>, string> = {
  surface: Colors.surface,
  brand: Colors.brandTint,
  accent: Colors.tealTint,
  info: Colors.infoTint,
  muted: Colors.surfaceMuted,
  white: Colors.surface,
  coral: Colors.brandTint,
  yellow: Colors.brandTint,
  purple: Colors.lavenderLight,
  teal: Colors.tealTint,
  mint: Colors.tealTint,
  sky: Colors.infoTint,
  kid: Colors.surfaceWarm,
};

export const HeyCard: React.FC<HeyCardProps> = ({
  children,
  variant = 'white',
  style,
  noPadding = false,
}) => (
  <View
    style={[
      styles.card,
      // Chỉ thẻ trắng nổi; thẻ nền màu đã tách khỏi nền bằng màu, thêm bóng sẽ rối
      variant === 'white' || variant === 'surface' ? Elevation.low : null,
      { backgroundColor: VARIANT_BG[variant] ?? Colors.surface },
      variant === 'kid' && styles.kidCard,
      noPadding && { padding: 0 },
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  kidCard: {
    borderRadius: Radius.xxl,
    borderWidth: 1.5,
    borderColor: Colors.borderSunshine,
  },
});
