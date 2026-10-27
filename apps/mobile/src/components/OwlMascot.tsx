// apps/mobile/src/components/OwlMascot.tsx
// Mascot cú phù thủy với 5 trạng thái cảm xúc + floating animation
// Không cần Lottie — dùng pure React Native + Reanimated v2/v3
import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { soundFX } from '../utils/sound-fx';
import { Colors } from '../theme/colors';
import { Elevation } from '../theme/shadows';
import { focusRing } from '../theme/focus';
import { MASCOT_IMAGE } from '../constants/mascot';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

export type MascotState = 'idle' | 'happy' | 'sleeping' | 'celebrate' | 'thinking';

interface OwlMascotProps {
  state?: MascotState;
  size?: number;
  onPress?: () => void;
  showLabel?: boolean;
  /** Nhãn trợ năng của nút (vd. mô tả điều xảy ra khi chạm). Có `onPress` thì mascot là một nút. */
  accessibilityLabel?: string;
}

// Mọi trạng thái dùng ảnh cú; trạng thái thể hiện qua màu nền, animation và chấm trạng thái
const STATE_VISUALS: Record<MascotState, { bg: string; label: string }> = {
  idle: { bg: Colors.brandTint, label: 'Lu Lu' },
  happy: { bg: Colors.tealTint, label: 'Vui vẻ!' },
  sleeping: { bg: Colors.lavenderLight, label: 'Đang ngủ...' },
  celebrate: { bg: Colors.brandTint, label: 'Tuyệt vời!' },
  thinking: { bg: Colors.infoTint, label: 'Đang nghĩ...' },
};

export const OwlMascot: React.FC<OwlMascotProps> = ({
  state = 'idle',
  size = 80,
  onPress,
  showLabel = false,
  accessibilityLabel = 'Cú Lu Lu',
}) => {
  const floatY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotateZ = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);

  // Floating idle loop
  useEffect(() => {
    if (state === 'idle' || state === 'happy') {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
      rotateZ.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(-2, { duration: 1800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
      // Glow pulse
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1200 }),
          withTiming(0.3, { duration: 1200 })
        ),
        -1,
        true
      );
    } else if (state === 'sleeping') {
      cancelAnimation(floatY);
      cancelAnimation(rotateZ);
      floatY.value = withSpring(3);
      rotateZ.value = withSpring(8); // Nghiêng nhẹ khi ngủ
    } else if (state === 'celebrate') {
      // Jump animation
      floatY.value = withRepeat(
        withSequence(
          withSpring(-18, { damping: 6, stiffness: 200 }),
          withSpring(0, { damping: 8, stiffness: 150 })
        ),
        4,
        false
      );
      rotateZ.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 200 }),
          withTiming(12, { duration: 200 })
        ),
        4,
        true
      );
    } else {
      cancelAnimation(floatY);
      cancelAnimation(rotateZ);
      floatY.value = withSpring(0);
      rotateZ.value = withSpring(0);
    }
  }, [state]);

  const handlePress = () => {
    // Âm "chíp" nhẹ của app (trước đây là playPuppy — tiếng chó, sai với mascot cú; R5 A3)
    soundFX.playSparkle();
    // 4-phase bounce: pop → squish → rebound → settle
    scale.value = withSequence(
      withSpring(1.28, { damping: 6, stiffness: 220 }),
      withSpring(0.88, { damping: 10, stiffness: 200 }),
      withSpring(1.08, { damping: 12, stiffness: 160 }),
      withSpring(1.00, { damping: 15, stiffness: 130 })
    );
    onPress?.();
  };

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: scale.value },
      { rotate: `${rotateZ.value}deg` },
    ] as any,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const visual = STATE_VISUALS[state];
  const circleSize = size;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={(st) => [styles.touch, focusRing(st)]}
    >
      <View style={styles.wrapper}>
        {/* Glow ring behind mascot */}
        <Animated.View
          style={[
            styles.glowRing,
            glowStyle,
            {
              width: circleSize + 20,
              height: circleSize + 20,
              borderRadius: (circleSize + 20) / 2,
              backgroundColor: visual.bg,
              pointerEvents: 'none' as any,
            },
          ]}
        />

        {/* Main mascot circle */}
        <Animated.View
          style={[
            mascotStyle,
            styles.mascotCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              backgroundColor: visual.bg,
            },
          ]}
        >
          <Image
            source={MASCOT_IMAGE}
            style={{ width: circleSize, height: circleSize, borderRadius: circleSize / 2 }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            accessible={false}
          />

          {/* State indicator dot */}
          {state === 'celebrate' && (
            <View style={styles.sleepDot}>
              <Text style={styles.sleepZzz}>🎉</Text>
            </View>
          )}
          {state === 'sleeping' && (
            <View style={styles.sleepDot}>
              <Text style={styles.sleepZzz}>💤</Text>
            </View>
          )}
          {state === 'thinking' && (
            <View style={styles.thinkDot}>
              <Text style={styles.thinkDots}>...</Text>
            </View>
          )}
        </Animated.View>

        {/* Optional label */}
        {showLabel && (
          <View style={[styles.labelPill, { backgroundColor: visual.bg }]}>
            <Text style={styles.labelText}>{visual.label}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  touch: { borderRadius: 9999 },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    zIndex: 0,
  },
  mascotCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    ...Elevation.low,
  },
  sleepDot: {
    position: 'absolute',
    top: -8,
    right: -4,
  },
  sleepZzz: {
    fontSize: 14,
  },
  thinkDot: {
    position: 'absolute',
    top: -8,
    right: -4,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  thinkDots: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  labelPill: {
    marginTop: 6,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text,
  },
});
