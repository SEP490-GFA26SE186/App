// apps/mobile/src/components/ui/HeyButton.tsx — R1 Warm Storybook Guardian
// Giữ nguyên props/variant cũ; màu theo token mới đã đạt tương phản AA, vùng chạm >= 44pt (kid >= 56pt).
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { Elevation } from '../../theme/shadows';
import { Touch, hitSlopFor } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { soundFX } from '../../utils/sound-fx';

interface HeyButtonProps {
  title?: string;
  variant?: 'primary' | 'secondary' | 'teal' | 'yellow' | 'outline' | 'ghost' | 'kid' | 'sky';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  onPress?: () => void;
}

export const HeyButton: React.FC<HeyButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  children,
  loading = false,
  disabled = false,
  style,
  textStyle,
  onPress,
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    soundFX.playPop();
    scale.value = withSequence(
      withSpring(0.93, { damping: 8, stiffness: 220 }),
      withSpring(1.04, { damping: 10, stiffness: 180 }),
      withSpring(1.00, { damping: 14, stiffness: 140 })
    );
    onPress?.();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Nền cam đi với chữ navy (5.6:1); nền teal/xanh đậm đi với chữ trắng (>= 5.2:1). Không chữ trắng trên cam.
  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
      case 'teal':
        return { backgroundColor: Colors.tealStrong, ...Elevation.low };
      case 'sky':
        return { backgroundColor: Colors.info, ...Elevation.low };
      case 'outline':
        return { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.outlineStrong };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'kid':
        // Nút "có đế" của Kid Mode: viền dưới đậm tạo khối, không phụ thuộc bóng đổ
        return {
          backgroundColor: Colors.brand,
          borderRadius: 24,
          borderBottomWidth: 4,
          borderBottomColor: Colors.brandStrong,
        };
      case 'primary':
      case 'yellow':
      default:
        return { backgroundColor: Colors.brand, ...Elevation.low };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'secondary':
      case 'teal':
      case 'sky':
        return Colors.onStrong;
      case 'outline':
      case 'ghost':
        return Colors.text;
      case 'primary':
      case 'yellow':
      case 'kid':
      default:
        return Colors.onBrand;
    }
  };

  // sm hiển thị 36pt và bù hitSlop lên 44pt để không đổi bố cục các màn đang dùng nút nhỏ
  const getSizeStyle = () => {
    switch (size) {
      case 'sm':  return { minHeight: 36, paddingVertical: 8,  paddingHorizontal: 14, text: Typography.buttonSmall };
      case 'lg':  return { minHeight: 52, paddingVertical: 14, paddingHorizontal: 24, text: Typography.buttonLarge };
      case 'xl':  return { minHeight: 60, paddingVertical: 16, paddingHorizontal: 30, text: Typography.buttonLarge };
      case 'md':
      default:    return { minHeight: Touch.min + 4, paddingVertical: 12, paddingHorizontal: 20, text: Typography.button };
    }
  };

  const sizeInfo = getSizeStyle();
  const minHeight = variant === 'kid' ? Math.max(sizeInfo.minHeight, Touch.kid) : sizeInfo.minHeight;
  const isDisabled = disabled || loading;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        activeOpacity={1}
        disabled={isDisabled}
        onPress={handlePress}
        hitSlop={hitSlopFor(minHeight)}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[
          styles.base,
          getContainerStyle(),
          {
            minHeight,
            paddingVertical: sizeInfo.paddingVertical,
            paddingHorizontal: sizeInfo.paddingHorizontal,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" style={styles.iconMargin} />
        ) : icon ? (
          <View style={styles.iconMargin}>{icon}</View>
        ) : null}

        {title ? (
          <Text
            style={[
              styles.text,
              variant === 'kid' ? Typography.kidButton : sizeInfo.text,
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: 6,
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
