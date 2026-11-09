// apps/mobile/src/screens/legal/LegalScreen.tsx
// GĐ C – Trang "Chính sách bảo mật" / "Điều khoản dịch vụ" (Web components/legal/LegalPage.jsx): phiên bản + ngày hiệu lực,
// lời mở đầu, mục lục (chạm để cuộn tới mục), các mục đánh số, khối liên hệ. Nội dung tĩnh ở constants/legal.ts, không gọi API.
// Dùng cả khi chưa đăng nhập (AppNavigator) và khi đã đăng nhập (Trợ giúp).
import React, { useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { LEGAL_DOCS, LEGAL_EFFECTIVE_DATE, LEGAL_VERSION, LegalDocKey, SUPPORT_EMAIL } from '../../constants/legal';

export const LegalScreen: React.FC<{ doc: LegalDocKey; onBack: () => void }> = ({ doc, onBack }) => {
  const { title, intro, sections } = LEGAL_DOCS[doc];
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<number[]>([]);
  const jump = (i: number) => scrollRef.current?.scrollTo({ y: Math.max(0, (positions.current[i] ?? 0) - Spacing.md), animated: true });

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title={title} subtitle={`Phiên bản ${LEGAL_VERSION} • Hiệu lực từ ${LEGAL_EFFECTIVE_DATE}`} onBack={onBack} />
      <Text style={styles.muted}>Áp dụng cho bản thử nghiệm của đồ án SEP490</Text>
      <Text style={styles.intro}>{intro}</Text>

      <HeyCard style={styles.toc}>
        <Text style={styles.tocTitle} accessibilityRole="header">
          Mục lục
        </Text>
        {sections.map((s, i) => (
          <Pressable
            key={s.title}
            onPress={() => jump(i)}
            accessibilityRole="link"
            accessibilityLabel={`Đến mục ${i + 1}: ${s.title}`}
            style={(st) => [styles.tocRow, st.pressed && styles.pressed, focusRing(st)]}
          >
            <Text style={styles.tocText}>
              {i + 1}. {s.title}
            </Text>
          </Pressable>
        ))}
      </HeyCard>

      {sections.map((s, i) => (
        <View
          key={s.title}
          style={styles.section}
          onLayout={(e) => {
            positions.current[i] = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.heading} accessibilityRole="header">
            {i + 1}. {s.title}
          </Text>
          {s.body.map((b, j) =>
            Array.isArray(b) ? (
              <View key={j} style={styles.list}>
                {b.map((li) => (
                  <View key={li} style={styles.li}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={[styles.body, styles.flex1]}>{li}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text key={j} style={styles.body}>
                {b}
              </Text>
            ),
          )}
        </View>
      ))}

      <View style={styles.contact}>
        <Text style={styles.heading}>Liên hệ</Text>
        <Text style={styles.body}>
          {SUPPORT_EMAIL
            ? `Mọi câu hỏi về ${title.toLowerCase()} xin gửi về ${SUPPORT_EMAIL}.`
            : 'Mọi câu hỏi xin liên hệ nhóm phát triển StoryWeaver AI qua mục Trợ giúp sau khi đăng nhập.'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  flex1: { flex: 1 },
  pressed: { opacity: 0.7 },
  muted: { ...Typography.caption, color: Colors.textMuted },
  intro: { ...Typography.body, fontSize: 16, lineHeight: 24, color: Colors.text },
  toc: { gap: Spacing.xs },
  tocTitle: { ...Typography.bodyStrong, color: Colors.text },
  tocRow: { minHeight: Touch.min, justifyContent: 'center', borderRadius: Radius.md },
  tocText: { ...Typography.label, color: Colors.brandStrong },
  section: { gap: Spacing.sm, paddingTop: Spacing.sm },
  heading: { ...Typography.heading, color: Colors.text },
  body: { ...Typography.body, color: Colors.text },
  list: { gap: Spacing.xs },
  li: { flexDirection: 'row', gap: Spacing.sm, paddingLeft: Spacing.xs },
  bullet: { ...Typography.body, color: Colors.textMuted },
  contact: { gap: Spacing.xs, padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.surfaceMuted, marginTop: Spacing.sm },
});
