// apps/mobile/src/screens/parent/EqReportScreen.tsx
// B8 – Hành trình EQ (Web: EqJourneyPage). Chỉ hiện MỨC theo 5 năng lực CASEL, không điểm/%.
// C7: báo cáo thật từ GET /children/:id/eq-report của bé đang chọn (loading/error/retry). Không số liệu dựng sẵn:
// level = null → "Chưa có dữ liệu". R8: thẻ tổng quan (đếm từ dữ liệu BE) + thẻ năng lực có thanh 3 mức kèm chữ + gợi ý chuyện mẫu của BE.
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChildProfile } from '../../types/domain';
import { HeyCard } from '../../components/ui/HeyCard';
import { Icon } from '../../components/ui/Icon';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ChildSwitcher } from '../../components/parent/ChildSwitcher';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { CASEL, EQ_LEVELS, EQ_REPORT_NOTE, EqLevel, levelLabel } from '../../constants/eq';
import { childService } from '../../services';
import { useAsyncResource } from '../../utils/useAsyncResource';

interface EqReportScreenProps {
  childrenProfiles: ChildProfile[];
  selectedChildId?: string;
  onSelectChild: (id: string) => void;
}

/** 3 đoạn = 3 mức; ngoài màu còn có chữ mức bên dưới và nhãn trợ năng (không chỉ dựa vào màu). */
const LevelBar: React.FC<{ level: EqLevel | null; name: string }> = ({ level, name }) => {
  const filled = level ? EQ_LEVELS[level].value : 0;
  const color = level ? EQ_LEVELS[level].color : Colors.outline;
  return (
    <View
      style={styles.barRow}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${name}: ${levelLabel(level)}${level ? `, mức ${filled} trên 3` : ''}`}
      accessibilityValue={{ min: 0, max: 3, now: filled }}
    >
      {[1, 2, 3].map((n) => (
        <View key={n} style={[styles.barSeg, { backgroundColor: n <= filled ? color : Colors.outline }]} />
      ))}
    </View>
  );
};

export const EqReportScreen: React.FC<EqReportScreenProps> = ({
  childrenProfiles,
  selectedChildId,
  onSelectChild,
}) => {
  const child = childrenProfiles.find((c) => c.id === selectedChildId) ?? childrenProfiles[0];
  const childId = child?.id;
  const res = useAsyncResource(
    () => (childId ? childService.getChildEqReport(childId) : Promise.resolve(null)),
    [childId]
  );
  const report = res.data;
  const withData = report ? report.competencies.filter((c) => c.level != null).length : 0;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Hành trình EQ"
        subtitle={child ? `Mức phát triển 5 năng lực CASEL của ${child.name}` : 'Theo dõi mức phát triển cảm xúc của bé'}
      />
      <ChildSwitcher childrenProfiles={childrenProfiles} selectedId={child?.id} onSelect={onSelectChild} />

      {!child ? (
        <StateView variant="empty" title="Chưa có hồ sơ bé" description="Thêm hồ sơ bé (Hồ sơ → Bé nhà mình) để xem báo cáo EQ." />
      ) : res.status === 'loading' ? (
        <StateView variant="skeleton" title="Đang tải báo cáo EQ..." />
      ) : res.status === 'error' ? (
        <StateView
          variant="error"
          title="Chưa tải được báo cáo EQ"
          description={res.error ?? ''}
          actionLabel="Thử lại"
          onAction={() => void res.reload()}
        />
      ) : !report ? null : (
        <>
          {/* Tổng quan: chỉ đếm từ dữ liệu BE, không suy diễn đánh giá */}
          <HeyCard variant="brand" style={styles.summary}>
            <Text style={styles.summaryValue}>
              {withData}/{report.competencies.length}
            </Text>
            <Text style={styles.summaryLabel}>năng lực đã có dữ liệu</Text>
          </HeyCard>

          {withData === 0 && (
            <StateView
              variant="empty"
              title="Chưa có dữ liệu EQ"
              description={`${child.name} cần đọc thêm truyện có điểm dừng để có mức phát triển.`}
            />
          )}

          {report.competencies.map((c) => {
            const meta = CASEL[c.caselCode];
            const name = meta?.label ?? c.nameVi;
            return (
              <HeyCard key={c.caselCode} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
                      {meta?.icon ?? '⭐'}
                    </Text>
                  </View>
                  <Text style={styles.label}>{name}</Text>
                </View>
                <LevelBar level={c.level} name={name} />
                <Text style={[styles.level, c.level == null && styles.levelNone]}>{levelLabel(c.level)}</Text>
              </HeyCard>
            );
          })}

          {report.recommendations.length > 0 && (
            <>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Chuyện mẫu nên đọc tiếp
              </Text>
              {report.recommendations.map((r) => (
                <HeyCard key={r.id} style={styles.rec}>
                  <Icon name="book-outline" size={22} color={Colors.brandStrong} />
                  <View style={styles.recText}>
                    <Text style={styles.label}>{r.title}</Text>
                    <Text style={styles.level}>Giúp bé tập: {r.skill.nameVi}</Text>
                  </View>
                </HeyCard>
              ))}
            </>
          )}
        </>
      )}

      <Text style={styles.note}>{EQ_REPORT_NOTE}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.sm },
  summary: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  summaryValue: { ...Typography.title, color: Colors.brandInk },
  summaryLabel: { ...Typography.label, color: Colors.text },
  card: { gap: Spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brandTint, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  label: { ...Typography.bodyStrong, color: Colors.text, flex: 1 },
  barRow: { flexDirection: 'row', gap: 6 },
  barSeg: { flex: 1, height: 10, borderRadius: Radius.sm },
  level: { ...Typography.label, color: Colors.text },
  levelNone: { color: Colors.textMuted },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.sm },
  rec: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  recText: { flex: 1, gap: 2 },
  note: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md },
});
