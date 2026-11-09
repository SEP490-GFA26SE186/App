// apps/mobile/src/components/auth/LegalLinks.tsx
// GĐ C – Hai liên kết chân trang Đăng nhập / Đăng ký (Web components/auth/AuthShell.jsx FOOTER_LINKS). Liên kết ≥ 44pt.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { AUTH_FOOTER_LINKS, LegalDocKey } from '../../constants/legal';

export const LegalLinks: React.FC<{ onOpen: (doc: LegalDocKey) => void }> = ({ onOpen }) => (
  <View style={styles.row}>
    {AUTH_FOOTER_LINKS.map((l) => (
      <Pressable
        key={l.doc}
        onPress={() => onOpen(l.doc)}
        accessibilityRole="link"
        accessibilityLabel={l.label}
        style={(s) => [styles.link, s.pressed && styles.pressed, focusRing(s)]}
      >
        <Text style={styles.text}>{l.label}</Text>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.lg, marginTop: Spacing.lg },
  link: { minHeight: Touch.min, justifyContent: 'center', paddingHorizontal: Spacing.xs, borderRadius: Radius.md },
  pressed: { opacity: 0.7 },
  text: { ...Typography.caption, color: Colors.textMuted, textDecorationLine: 'underline' },
});
