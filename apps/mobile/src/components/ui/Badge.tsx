// apps/mobile/src/components/ui/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: '#F1F5F9', fg: '#475569' },
  success: { bg: Colors.secondaryLight, fg: Colors.textOnGreen },
  warning: { bg: Colors.peachLight, fg: Colors.primaryText },
  danger: { bg: '#FEE2E2', fg: '#B91C1C' },
  info: { bg: Colors.accentLight, fg: Colors.accentDark },
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
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
  },
});
