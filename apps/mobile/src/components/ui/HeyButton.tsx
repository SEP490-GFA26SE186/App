// apps/mobile/src/components/ui/HeyButton.tsx — R2 Warm Storybook Guardian
// Variant ngữ nghĩa: primary | secondary | tertiary | danger | kid (+ ghost). Tên cũ giữ làm alias để màn chưa redesign không vỡ:
// yellow → primary, teal → secondary, outline → tertiary, sky (nền info).
// Vùng chạm >= 44pt (kid >= 56pt); Pressable có trạng thái nhấn tức thời (không animation lò xo) và viền focus trên Web.
import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Elevation } from '../../theme/shadows';
import { Touch, hitSlopFor } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { soundFX } from '../../utils/sound-fx';
import { Icon, IconName } from './Icon';

export type HeyButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'danger'
  | 'kid'
  | 'ghost'
  // alias cũ
  | 'yellow'
  | 'teal'
  | 'outline'
  | 'sky';

interface HeyButtonProps {
  title?: string;
  variant?: HeyButtonVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Icon tùy ý (ReactNode). Ưu tiên `iconName` để icon tự lấy màu chữ của variant. */
  icon?: React.ReactNode;
  iconName?: IconName;
  /** Bắt buộc với nút chỉ có icon (không có title) */
  accessibilityLabel?: string;
  children?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  onPress?: () => void;
}

// Nền cam đi với chữ navy (5.6:1); nền teal/đỏ/xanh đi với chữ trắng (>= 5.2:1). Không chữ trắng trên cam.
type VariantStyle = { container: ViewStyle; text: string };
const primary: VariantStyle = { container: { backgroundColor: Colors.brand, ...Elevation.low }, text: Colors.onBrand };
const secondary: VariantStyle = { container: { backgroundColor: Colors.tealStrong, ...Elevation.low }, text: Colors.onStrong };
const tertiary: VariantStyle = {
  container: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.outlineStrong },
  text: Colors.text,
};

const VARIANTS: Record<HeyButtonVariant, VariantStyle> = {
  primary,
  secondary,
  tertiary,
  danger: { container: { backgroundColor: Colors.danger, ...Elevation.low }, text: Colors.onStrong },
  // Nút "có đế" của Kid Mode: viền dưới đậm tạo khối, không phụ thuộc bóng đổ
  kid: {
    container: { backgroundColor: Colors.brand, borderRadius: 24, borderBottomWidth: 4, borderBottomColor: Colors.brandStrong },
    text: Colors.onBrand,
  },
  ghost: { container: { backgroundColor: 'transparent' }, text: Colors.text },
  sky: { container: { backgroundColor: Colors.info, ...Elevation.low }, text: Colors.onStrong },
  yellow: primary,
  teal: secondary,
  outline: tertiary,
};

// sm hiển thị 36pt và bù hitSlop lên 44pt để không đổi bố cục các màn đang dùng nút nhỏ
const SIZES = {
  sm: { minHeight: 36, paddingVertical: 8, paddingHorizontal: 14, text: Typography.buttonSmall, icon: 16 },
  md: { minHeight: Touch.min + 4, paddingVertical: 12, paddingHorizontal: 20, text: Typography.button, icon: 18 },
  lg: { minHeight: 52, paddingVertical: 14, paddingHorizontal: 24, text: Typography.buttonLarge, icon: 20 },
  xl: { minHeight: 60, paddingVertical: 16, paddingHorizontal: 30, text: Typography.buttonLarge, icon: 22 },
};

export const HeyButton: React.FC<HeyButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  iconName,
  accessibilityLabel,
  children,
  loading = false,
  disabled = false,
  style,
  textStyle,
  onPress,
}) => {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const s = SIZES[size] ?? SIZES.md;
  const minHeight = variant === 'kid' ? Math.max(s.minHeight, Touch.kid) : s.minHeight;
  const isDisabled = disabled || loading;

  const handlePress = () => {
    soundFX.playPop();
    onPress?.();
  };

  const leading = loading ? (
    <ActivityIndicator color={v.text} size="small" />
  ) : iconName ? (
    <Icon name={iconName} size={variant === 'kid' ? 24 : s.icon} color={v.text} />
  ) : (
    icon
  );

  // View bọc ngoài giữ đúng cấu trúc cũ (trước là Animated.View) để style flex/width của các màn không đổi
  return (
    <View>
      <Pressable
        disabled={isDisabled}
        onPress={handlePress}
        hitSlop={hitSlopFor(minHeight)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={(state) => [
          styles.base,
          v.container,
          { minHeight, paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal },
          disabled && styles.disabled,
          state.pressed && (variant === 'kid' ? styles.kidPressed : styles.pressed),
          focusRing(state),
          style,
        ]}
      >
        {!!leading && <View style={title || children ? styles.iconMargin : null}>{leading}</View>}

        {title ? (
          <Text
            style={[
              styles.text,
              variant === 'kid' ? Typography.kidButton : s.text,
              { color: v.text },
              textStyle,
            ]}
          >
            {title}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Phản hồi nhấn tức thời: không phải chuyển động nên không cần tắt khi Giảm chuyển động
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  // Nút có đế "lún xuống": đế mỏng lại, thân hạ xuống đúng phần đế mất đi
  kidPressed: { borderBottomWidth: 1, transform: [{ translateY: 3 }] },
  disabled: { opacity: 0.5 },
  iconMargin: {
    marginRight: 6,
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
