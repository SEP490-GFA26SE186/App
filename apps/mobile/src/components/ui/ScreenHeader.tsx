// apps/mobile/src/components/ui/ScreenHeader.tsx
// Tiêu đề màn hình con, kèm nút quay lại khi có onBack.
// R1: nút quay lại 44pt có nhãn trợ năng; tiêu đề Comfortaa như Web.
// R2: mũi tên là icon vector; viền focus trên Web.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { Icon } from './Icon';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, onBack, right }) => (
  <View style={styles.row}>
    {!!onBack && (
      <Pressable
        onPress={onBack}
        style={(state) => [styles.back, state.pressed && styles.backPressed, focusRing(state)]}
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
      >
        <Icon name="arrow-back" size={22} color={Colors.text} />
      </Pressable>
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
  backPressed: { backgroundColor: Colors.outline },
  texts: { flex: 1 },
  title: { ...Typography.title, color: Colors.text },
  subtitle: { ...Typography.caption, fontSize: 13, lineHeight: 18, color: Colors.textMuted, marginTop: 2 },
});
