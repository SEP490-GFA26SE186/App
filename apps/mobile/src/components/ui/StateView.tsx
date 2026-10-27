// apps/mobile/src/components/ui/StateView.tsx
// Trạng thái loading / empty / error / chưa hỗ trợ dùng chung cho mọi màn (ADR-018).
// R1: chữ theo thang Typography; error có tiêu đề màu danger và được đọc ngay bởi trình đọc màn hình.
// R2: icon vector trong vòng màu theo trạng thái (lỗi đỏ ≠ rỗng xanh); `skeleton` cho danh sách đang tải.
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { HeyButton } from './HeyButton';
import { Icon, IconName } from './Icon';
import { SkeletonList } from './Skeleton';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

type Variant = 'loading' | 'skeleton' | 'empty' | 'error' | 'unsupported';

const ICONS: Record<'empty' | 'error' | 'unsupported', { name: IconName; color: string; bg: string }> = {
  empty: { name: 'leaf-outline', color: Colors.tealStrong, bg: Colors.tealTint },
  error: { name: 'alert-circle-outline', color: Colors.danger, bg: Colors.dangerTint },
  unsupported: { name: 'construct-outline', color: Colors.brandStrong, bg: Colors.brandTint },
};

interface StateViewProps {
  variant: Variant;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const StateView: React.FC<StateViewProps> = ({ variant, title, description, actionLabel, onAction }) => {
  if (variant === 'skeleton') {
    return (
      <View style={styles.skeletonBox}>
        <SkeletonList label={title || 'Đang tải'} />
      </View>
    );
  }
  return (
    <View
      style={styles.box}
      accessibilityRole={variant === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion={variant === 'error' ? 'assertive' : variant === 'loading' ? 'polite' : undefined}
    >
      {variant === 'loading' ? (
        <ActivityIndicator size="large" color={Colors.brandStrong} accessibilityLabel={title || 'Đang tải'} />
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: ICONS[variant].bg }]}>
          <Icon name={ICONS[variant].name} size={30} color={ICONS[variant].color} />
        </View>
      )}
      {!!title && <Text style={[styles.title, variant === 'error' && styles.titleError]}>{title}</Text>}
      {!!description && <Text style={styles.desc}>{description}</Text>}
      {!!actionLabel && !!onAction && (
        <HeyButton title={actionLabel} variant="outline" size="sm" onPress={onAction} style={styles.btn} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 6,
  },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  skeletonBox: { paddingVertical: 12 },
  title: {
    ...Typography.heading,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 4,
  },
  titleError: {
    color: Colors.danger,
  },
  desc: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  btn: { marginTop: 10 },
});
