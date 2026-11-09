// apps/mobile/src/components/parent/AppearanceHints.tsx
// GĐ B3 – Gợi ý cách tả ngoại hình (dùng để vẽ chân dung) + nhắc chi tiết dễ bị bộ lọc ảnh chặn. Chỉ nhắc, không chặn lưu
// (Web components/parent/AppearanceHints.jsx). GĐ C: tách khỏi CharacterFormSheet để form hồ sơ bé dùng chung.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { APPEARANCE_TIP, appearanceRisks } from '../../utils/characterPortrait';

export const AppearanceHints: React.FC<{ value: string }> = ({ value }) => (
  <View style={styles.hints}>
    <View style={styles.hintRow}>
      <Icon name="bulb-outline" size={16} color={Colors.brandStrong} />
      <Text style={styles.hintText}>{APPEARANCE_TIP}</Text>
    </View>
    {appearanceRisks(value).map((tip) => (
      <View key={tip} style={[styles.hintRow, styles.riskBox]}>
        <Icon name="warning-outline" size={16} color={Colors.warning} />
        <Text style={[styles.hintText, styles.riskText]}>{tip}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  hints: { gap: 6, marginTop: -4, marginBottom: 12 },
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  hintText: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
  riskBox: { backgroundColor: Colors.warningTint, padding: 8, borderRadius: 10 },
  riskText: { color: Colors.text },
});
