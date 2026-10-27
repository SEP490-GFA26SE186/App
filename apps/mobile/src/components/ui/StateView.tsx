// apps/mobile/src/components/ui/StateView.tsx
// Trạng thái loading / empty / error / chưa hỗ trợ dùng chung cho mọi màn (ADR-018).
// R1: chữ theo thang Typography; error có tiêu đề màu danger và được đọc ngay bởi trình đọc màn hình.
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { HeyButton } from './HeyButton';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

type Variant = 'loading' | 'empty' | 'error' | 'unsupported';

const ICONS: Record<Exclude<Variant, 'loading'>, string> = {
  empty: '🌱',
  error: '⚠️',
  unsupported: '🚧',
};

interface StateViewProps {
  variant: Variant;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const StateView: React.FC<StateViewProps> = ({ variant, title, description, actionLabel, onAction }) => (
  <View
    style={styles.box}
    accessibilityRole={variant === 'error' ? 'alert' : undefined}
    accessibilityLiveRegion={variant === 'error' ? 'assertive' : variant === 'loading' ? 'polite' : undefined}
  >
    {variant === 'loading' ? (
      <ActivityIndicator size="large" color={Colors.brandStrong} accessibilityLabel={title || 'Đang tải'} />
    ) : (
      <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
        {ICONS[variant]}
      </Text>
    )}
    {!!title && <Text style={[styles.title, variant === 'error' && styles.titleError]}>{title}</Text>}
    {!!description && <Text style={styles.desc}>{description}</Text>}
    {!!actionLabel && !!onAction && (
      <HeyButton title={actionLabel} variant="outline" size="sm" onPress={onAction} style={styles.btn} />
    )}
  </View>
);

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 6,
  },
  icon: { fontSize: 36 },
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
