// apps/mobile/src/components/animations/CloudPopEntrance.tsx
// Hiệu ứng "đám mây bung mở" khi reveal màn hình mới
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

interface CloudPopEntranceProps {
  children: React.ReactNode;
  onRevealComplete?: () => void;
  /** Màu mây — mặc định trắng */
  cloudColor?: string;
}

export const CloudPopEntrance: React.FC<CloudPopEntranceProps> = ({
  children,
  onRevealComplete,
  cloudColor = '#FFFFFF',
}) => {
  const cloudScale = useSharedValue(0.05);
  const cloudOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(28);

  useEffect(() => {
    // Phase 1: Mây bùng nổ từ trung tâm
    cloudOpacity.value = withTiming(1, { duration: 80 });
    cloudScale.value = withSequence(
      withSpring(1.6, { damping: 10, stiffness: 120 }),
      withSpring(1.0, { damping: 16, stiffness: 90 })
    );

    // Phase 2: Nội dung bay lên từ dưới mây
    contentOpacity.value = withDelay(360, withTiming(1, { duration: 280 }));
    contentTranslateY.value = withDelay(
      360,
      withSpring(0, { damping: 18, stiffness: 80, velocity: -2 })
    );

    // Phase 3: Mây tan biến — lộ ra nội dung
    cloudOpacity.value = withDelay(
      520,
      withTiming(0, { duration: 240 }, (finished) => {
        if (finished && onRevealComplete) runOnJS(onRevealComplete)();
      })
    );
  }, []);

  const cloudStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cloudScale.value }],
    opacity: cloudOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Fluffy Cloud Overlay — 3 vòng tròn chồng lên nhau */}
      <Animated.View style={[styles.cloudOverlay, cloudStyle, { pointerEvents: 'none' }]}>
        <View style={styles.cloudBody}>
          <View style={[styles.cloudPuff, styles.cloudLeft, { backgroundColor: cloudColor }]} />
          <View style={[styles.cloudPuff, styles.cloudCenter, { backgroundColor: cloudColor }]} />
          <View style={[styles.cloudPuff, styles.cloudRight, { backgroundColor: cloudColor }]} />
          {/* Extra puffs for fluffier look */}
          <View style={[styles.cloudPuff, styles.cloudTopLeft, { backgroundColor: cloudColor }]} />
          <View style={[styles.cloudPuff, styles.cloudTopRight, { backgroundColor: cloudColor }]} />
        </View>
      </Animated.View>

      {/* Nội dung thực sự được reveal */}
      <Animated.View style={[styles.content, contentStyle]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  cloudOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudBody: {
    width: 400,
    height: 280,
  },
  cloudPuff: {
    position: 'absolute',
    borderRadius: 9999,
  },
  cloudLeft: {
    width: 200,
    height: 150,
    bottom: 30,
    left: 0,
  },
  cloudCenter: {
    width: 220,
    height: 200,
    bottom: 60,
    left: '50%',
    transform: [{ translateX: -110 }],
    zIndex: 2,
  },
  cloudRight: {
    width: 180,
    height: 140,
    bottom: 30,
    right: 0,
  },
  cloudTopLeft: {
    width: 130,
    height: 100,
    bottom: 150,
    left: 40,
  },
  cloudTopRight: {
    width: 120,
    height: 95,
    bottom: 145,
    right: 40,
  },
  content: { flex: 1 },
});
