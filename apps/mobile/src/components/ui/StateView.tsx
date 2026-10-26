// apps/mobile/src/components/ui/StateView.tsx
// Trạng thái loading / empty / error / chưa hỗ trợ dùng chung cho mọi màn (ADR-018).
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { HeyButton } from './HeyButton';
import { Colors } from '../../theme/colors';

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
  <View style={styles.box}>
    {variant === 'loading' ? (
      <ActivityIndicator size="large" color={Colors.primaryDark} />
    ) : (
      <Text style={styles.icon}>{ICONS[variant]}</Text>
    )}
    {!!title && <Text style={styles.title}>{title}</Text>}
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
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 4,
  },
  desc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  btn: { marginTop: 10 },
});
