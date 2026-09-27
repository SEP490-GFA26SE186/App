// apps/mobile/src/components/ui/HeyButton.tsx — v2.0 Fairy Garden
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
import { soundFX } from '../../../../../src/utils/sound-fx';

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

  const getContainerStyle = (): any => {
    switch (variant) {
      case 'primary':
      case 'yellow':
        return {
          backgroundColor: Colors.primary,
          boxShadow: '0 6px 12px rgba(245, 196, 0, 0.35)',
        };
      case 'secondary':
        return {
          backgroundColor: Colors.secondary,
          boxShadow: '0 6px 12px rgba(77, 184, 90, 0.28)',
        };
      case 'teal':
        return {
          backgroundColor: Colors.mint,
          boxShadow: '0 6px 12px rgba(91, 175, 135, 0.28)',
        };
      case 'sky':
        return {
          backgroundColor: Colors.accent,
          boxShadow: '0 6px 12px rgba(26, 133, 214, 0.28)',
        };
      case 'outline':
        return {
          backgroundColor: '#FFFFFF',
          borderWidth: 1.5,
          borderColor: Colors.borderMedium,
          boxShadow: '0 3px 8px rgba(107, 203, 119, 0.12)',
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'kid':
        return {
          backgroundColor: Colors.primary,
          borderRadius: 24,
          boxShadow: '0 8px 16px rgba(245, 196, 0, 0.40)',
        };
      default:
        return {
          backgroundColor: Colors.primary,
          boxShadow: '0 6px 12px rgba(245, 196, 0, 0.35)',
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'yellow':
      case 'kid':
        return Colors.textOnYellow;
      case 'outline':
      case 'ghost':
        return Colors.textPrimary;
      case 'secondary':
        return '#FFFFFF';
      case 'teal':
        return '#FFFFFF';
      case 'sky':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':  return { paddingVertical: 8,  paddingHorizontal: 14, fontSize: 13 };
      case 'lg':  return { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16 };
      case 'xl':  return { paddingVertical: 18, paddingHorizontal: 30, fontSize: 18 };
      case 'md':
      default:    return { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15 };
    }
  };

  const sizeInfo = getSizeStyle();

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        activeOpacity={1}
        disabled={disabled || loading}
        onPress={handlePress}
        style={[
          styles.base,
          getContainerStyle(),
          {
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
              { color: getTextColor(), fontSize: sizeInfo.fontSize },
              variant === 'kid' && styles.kidText,
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
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  kidText: {
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.3,
  },
});
