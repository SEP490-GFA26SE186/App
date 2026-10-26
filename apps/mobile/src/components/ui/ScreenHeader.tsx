// apps/mobile/src/components/ui/ScreenHeader.tsx
// Tiêu đề màn hình con, kèm nút quay lại khi có onBack.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, onBack, right }) => (
  <View style={styles.row}>
    {!!onBack && (
      <TouchableOpacity onPress={onBack} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
    )}
    <View style={styles.texts}>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  texts: { flex: 1 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 17 },
});
