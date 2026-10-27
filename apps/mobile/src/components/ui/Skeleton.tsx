// apps/mobile/src/components/ui/Skeleton.tsx — R2: khối giữ chỗ khi tải danh sách (audit G2).
// Giữ bố cục ổn định thay vì spinner rồi "nhảy" nội dung; nhấp nháy nhẹ, đứng yên khi bật Giảm chuyển động.
import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { useReduceMotion } from '../../utils/useReduceMotion';

// RN Web không có native animated module (chạy JS và cảnh báo nếu bật)
const NATIVE_DRIVER = Platform.OS !== 'web';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 14, radius = Radius.xs, style }) => {
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: NATIVE_DRIVER }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [reduceMotion, opacity]);

  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[{ width, height, borderRadius: radius, backgroundColor: Colors.surfaceMuted, opacity }, style]}
    />
  );
};

/** Danh sách dạng thẻ (ảnh vuông + 2 dòng chữ) — dùng cho trạng thái tải của các màn danh sách. */
export const SkeletonList: React.FC<{ rows?: number; label?: string }> = ({ rows = 3, label = 'Đang tải' }) => (
  <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={styles.list}>
    {Array.from({ length: rows }, (_, i) => (
      <View key={i} style={styles.row}>
        <Skeleton width={56} height={56} radius={Radius.md} />
        <View style={styles.lines}>
          <Skeleton width="72%" height={16} />
          <Skeleton width="44%" height={12} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  list: { gap: Spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outline,
    backgroundColor: Colors.surface,
  },
  lines: { flex: 1, gap: Spacing.sm },
});
