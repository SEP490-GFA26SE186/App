// apps/mobile/src/components/ui/ScreenHeader.tsx
// Tiêu đề màn hình con, kèm nút quay lại khi có onBack.
// R1: nút quay lại 44pt có nhãn trợ năng; tiêu đề Comfortaa như Web.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, onBack, right }) => (
  <View style={styles.row}>
    {!!onBack && (
      <TouchableOpacity
        onPress={onBack}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
    )}
    <View style={styles.texts}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  back: {
    width: Touch.min,
    height: Touch.min,
    borderRadius: Touch.min / 2,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 20, fontWeight: '800', color: Colors.text },
  texts: { flex: 1 },
  title: { ...Typography.title, color: Colors.text },
  subtitle: { ...Typography.caption, fontSize: 13, lineHeight: 18, color: Colors.textMuted, marginTop: 2 },
});
