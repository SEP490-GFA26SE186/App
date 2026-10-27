// apps/mobile/src/screens/parent/HelpScreen.tsx
// B11 – Trợ giúp (Web: HelpPage): câu hỏi thường gặp dạng mở/đóng. R8: hàng là nút ≥ 44pt có trạng thái mở/đóng cho trình đọc màn hình.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { Icon } from '../../components/ui/Icon';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { FAQS } from '../../constants/faq';

export const HelpScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Ba mẹ cần giúp gì?" subtitle="Câu hỏi thường gặp" onBack={onBack} />
      {FAQS.map((f, i) => {
        const open = openIndex === i;
        return (
          <HeyCard key={f.q} style={styles.card}>
            <Pressable
              onPress={() => setOpenIndex(open ? null : i)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              aria-expanded={open}
              style={(s) => [styles.head, s.pressed && styles.pressed, focusRing(s)]}
            >
              <Text style={styles.q}>{f.q}</Text>
              <Icon name={open ? 'chevron-up' : 'chevron-down'} size={22} color={Colors.textMuted} />
            </Pressable>
            {open && (
              <View>
                <Text style={styles.a}>{f.a}</Text>
              </View>
            )}
          </HeyCard>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.sm },
  card: { gap: Spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: Touch.min, borderRadius: Radius.md },
  pressed: { opacity: 0.7 },
  q: { ...Typography.bodyStrong, color: Colors.text, flex: 1 },
  a: { ...Typography.body, fontSize: 14, color: Colors.text },
});
