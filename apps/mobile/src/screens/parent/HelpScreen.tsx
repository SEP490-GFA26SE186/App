// apps/mobile/src/screens/parent/HelpScreen.tsx
// B11 – Trợ giúp (Web: HelpPage): câu hỏi thường gặp dạng mở/đóng.
import React, { useState } from 'react';
import { Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';
import { FAQS } from '../../constants/faq';

export const HelpScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Ba mẹ cần giúp gì?" subtitle="Câu hỏi thường gặp" onBack={onBack} />
      {FAQS.map((f, i) => {
        const open = openIndex === i;
        return (
          <TouchableOpacity key={f.q} activeOpacity={0.85} onPress={() => setOpenIndex(open ? null : i)}>
            <HeyCard style={styles.card}>
              <Text style={styles.q}>
                {open ? '▾ ' : '▸ '}
                {f.q}
              </Text>
              {open && <Text style={styles.a}>{f.a}</Text>}
            </HeyCard>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 10, gap: 8 },
  q: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  a: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
