// apps/mobile/src/screens/parent/EqSkillsScreen.tsx
// Phase 2 – Tìm hiểu 5 năng lực CASEL (chỉ đọc, mở từ Tiến độ EQ). Danh sách GET /eq-skills; chạm một năng lực → sheet
// chi tiết GET /eq-skills/:code (bài học đang dùng) + GET /sub-skills?skillId (kỹ năng con đang dùng). Không điểm số.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { Sheet } from '../../components/ui/Sheet';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { CASEL } from '../../constants/eq';
import { eqSkillService } from '../../services';
import { useAsyncResource } from '../../utils/useAsyncResource';
import type { EqSkillDto } from '../../types/api';

interface EqSkillsScreenProps {
  onBack: () => void;
}

const ageRange = (min: number | null, max: number | null) => (min != null && max != null ? `${min}–${max} tuổi` : null);

const SkillDetailSheet: React.FC<{ skill: EqSkillDto | null; onClose: () => void }> = ({ skill, onClose }) => {
  const code = skill?.caselCode;
  const skillId = skill?.id;
  const detail = useAsyncResource(() => (code ? eqSkillService.getSkill(code) : Promise.resolve(null)), [code]);
  const subs = useAsyncResource(() => (skillId ? eqSkillService.getSubSkills(skillId) : Promise.resolve(null)), [skillId]);

  return (
    <Sheet visible={!!skill} title={skill?.nameVi ?? 'Năng lực'} description={skill?.description} onClose={onClose}>
      <View style={styles.sheetBody}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Kỹ năng con
        </Text>
        {subs.status === 'loading' ? (
          <StateView variant="loading" title="Đang tải kỹ năng con..." />
        ) : subs.status === 'error' || !subs.data ? (
          <StateView variant="error" title="Không tải được kỹ năng con" description={subs.error ?? ''} actionLabel="Thử lại" onAction={() => void subs.reload()} />
        ) : subs.data.length === 0 ? (
          <StateView variant="empty" title="Chưa có kỹ năng con đang dùng" />
        ) : (
          subs.data.map((s) => (
            <HeyCard key={s.id} style={styles.item}>
              <View style={styles.itemTop}>
                <Text style={styles.itemTitle}>{s.nameVi}</Text>
                {!!ageRange(s.ageMin, s.ageMax) && <Badge label={ageRange(s.ageMin, s.ageMax) as string} tone="neutral" />}
              </View>
              {!!s.descriptionVi && <Text style={styles.itemText}>{s.descriptionVi}</Text>}
            </HeyCard>
          ))
        )}

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Chủ đề truyện đang dùng
        </Text>
        {detail.status === 'loading' ? (
          <StateView variant="loading" title="Đang tải chủ đề..." />
        ) : detail.status === 'error' || !detail.data ? (
          <StateView variant="error" title="Không tải được chủ đề" description={detail.error ?? ''} actionLabel="Thử lại" onAction={() => void detail.reload()} />
        ) : detail.data.topics.length === 0 ? (
          <StateView variant="empty" title="Chưa có chủ đề nào cho năng lực này" />
        ) : (
          detail.data.topics.map((t) => (
            <View key={t.id} style={styles.topicRow}>
              <Icon name="book-outline" size={18} color={Colors.brandStrong} />
              <Text style={styles.itemText}>{t.title}</Text>
              {!!ageRange(t.ageMin, t.ageMax) && <Text style={styles.meta}>{ageRange(t.ageMin, t.ageMax)}</Text>}
            </View>
          ))
        )}
      </View>
    </Sheet>
  );
};

export const EqSkillsScreen: React.FC<EqSkillsScreenProps> = ({ onBack }) => {
  const res = useAsyncResource(() => eqSkillService.getSkills(), []);
  const [selected, setSelected] = useState<EqSkillDto | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="5 năng lực CASEL" subtitle="Những kỹ năng cảm xúc – xã hội mà truyện giúp bé luyện tập" onBack={onBack} />
      {res.status === 'loading' ? (
        <StateView variant="skeleton" title="Đang tải năng lực..." />
      ) : res.status === 'error' || !res.data ? (
        <StateView variant="error" title="Không tải được danh sách năng lực" description={res.error ?? ''} actionLabel="Thử lại" onAction={() => void res.reload()} />
      ) : res.data.length === 0 ? (
        <StateView variant="empty" title="Chưa có năng lực nào" />
      ) : (
        res.data.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setSelected(s)}
            accessibilityRole="button"
            accessibilityLabel={`${s.nameVi}. ${s.activeTopicsCount} chủ đề truyện. Xem kỹ năng con`}
            style={(st) => [st.pressed && styles.pressed, focusRing(st), styles.pressable]}
          >
            <HeyCard style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}>
                  <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
                    {CASEL[s.caselCode]?.icon ?? '⭐'}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.itemTitle}>{s.nameVi}</Text>
                  <Text style={styles.meta}>{s.nameEn}</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
              </View>
              {!!s.description && <Text style={styles.itemText}>{s.description}</Text>}
              <Text style={styles.meta}>{s.activeTopicsCount} chủ đề truyện đang dùng</Text>
            </HeyCard>
          </Pressable>
        ))
      )}
      <SkillDetailSheet skill={selected} onClose={() => setSelected(null)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.sm },
  pressable: { borderRadius: Radius.lg },
  pressed: { opacity: 0.85 },
  card: { gap: Spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardInfo: { flex: 1, minWidth: 0 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brandTint, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  sheetBody: { gap: Spacing.sm, paddingBottom: Spacing.md },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.xs },
  item: { gap: Spacing.xs },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  itemTitle: { ...Typography.bodyStrong, color: Colors.text, flexShrink: 1 },
  itemText: { ...Typography.label, color: Colors.text, flexShrink: 1 },
  meta: { ...Typography.caption, color: Colors.textMuted },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
