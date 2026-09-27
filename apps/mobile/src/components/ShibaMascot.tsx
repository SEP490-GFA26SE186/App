// apps/mobile/src/components/ShibaMascot.tsx
// Mascot Shiba Inu với 5 trạng thái cảm xúc + floating animation
// Không cần Lottie — dùng pure React Native + Reanimated v2/v3
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { soundFX } from '../../../../src/utils/sound-fx';
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

export type ShibaState = 'idle' | 'happy' | 'sleeping' | 'celebrate' | 'thinking';

interface ShibaMascotProps {
  state?: ShibaState;
  size?: number;
  onPress?: () => void;
  showLabel?: boolean;
}

// Emoji biểu diễn trạng thái (thay thế tạm trước khi có Lottie)
const STATE_VISUALS: Record<ShibaState, { emoji: string; bg: string; label: string }> = {
  idle: {
    emoji: '🐕',
    bg: '#FFF8D6',
    label: 'Lu Lu',
  },
  happy: {
    emoji: '🐶',
    bg: '#E8F9EB',
    label: 'Vui vẻ!',
  },
  sleeping: {
    emoji: '😴',
    bg: '#F3EDFB',
    label: 'Đang ngủ...',
  },
  celebrate: {
    emoji: '🎉',
    bg: '#FFF0D6',
    label: 'Tuyệt vời!',
  },
  thinking: {
    emoji: '🤔',
    bg: '#E8F4FD',
    label: 'Đang nghĩ...',
  },
};

export const ShibaMascot: React.FC<ShibaMascotProps> = ({
  state = 'idle',
  size = 80,
  onPress,
  showLabel = false,
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
    soundFX.playPuppy();
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
  const emojiSize = size * 0.52;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
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
          <Text style={[styles.mascotEmoji, { fontSize: emojiSize }]}>
            {visual.emoji}
          </Text>

          {/* State indicator dot */}
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

        {/* Level badge */}
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv.1</Text>
        </View>

        {/* Optional label */}
        {showLabel && (
          <View style={[styles.labelPill, { backgroundColor: visual.bg }]}>
            <Text style={styles.labelText}>{visual.label}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
    boxShadow: '0 8px 16px rgba(255, 217, 61, 0.30)',
  },
  mascotEmoji: {
    lineHeight: undefined,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#6BCB77',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
    boxShadow: '0 2px 4px rgba(77, 184, 90, 0.3)',
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  thinkDots: {
    fontSize: 10,
    fontWeight: '900',
    color: '#7F8C8D',
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
    color: '#2C3E50',
  },
});
