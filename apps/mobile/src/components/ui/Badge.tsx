// apps/mobile/src/components/ui/Badge.tsx — R1: màu theo token, mọi cặp chữ/nền >= 4.5:1, chữ tối thiểu 12.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: Colors.surfaceMuted, fg: Colors.textMuted },
  success: { bg: Colors.successTint, fg: Colors.successText },
  warning: { bg: Colors.warningTint, fg: Colors.brandInk },
  danger: { bg: Colors.dangerTint, fg: Colors.danger },
  info: { bg: Colors.infoTint, fg: Colors.infoText },
};

export const Badge: React.FC<{ label: string; tone?: BadgeTone }> = ({ label, tone = 'neutral' }) => (
  <View style={[styles.badge, { backgroundColor: TONES[tone].bg }]}>
    <Text style={[styles.text, { color: TONES[tone].fg }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  text: {
    ...Typography.caption,
  },
});
