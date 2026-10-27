// apps/mobile/src/screens/parent/EqReportScreen.tsx
// B8 – Hành trình EQ (Web: EqJourneyPage). Chỉ hiện MỨC theo 5 năng lực CASEL, không điểm/%.
// C7: báo cáo thật từ GET /children/:id/eq-report của bé đang chọn (loading/error/retry). Không số liệu dựng sẵn:
// level = null → "Chưa có dữ liệu".
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChildProfile } from '../../types/domain';
import { HeyCard } from '../../components/ui/HeyCard';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ChildSwitcher } from '../../components/parent/ChildSwitcher';
import { Colors } from '../../theme/colors';
import { CASEL, EQ_LEVELS, EQ_REPORT_NOTE, EqLevel, levelLabel } from '../../constants/eq';
import { childService } from '../../services';
import { useAsyncResource } from '../../utils/useAsyncResource';

interface EqReportScreenProps {
  childrenProfiles: ChildProfile[];
  selectedChildId?: string;
  onSelectChild: (id: string) => void;
}

const LevelBar: React.FC<{ level: EqLevel | null }> = ({ level }) => {
  const filled = level ? EQ_LEVELS[level].value : 0;
  const color = level ? EQ_LEVELS[level].color : '#E2E8F0';
  return (
    <View style={styles.barRow}>
      {[1, 2, 3].map((n) => (
        <View key={n} style={[styles.barSeg, { backgroundColor: n <= filled ? color : '#E2E8F0' }]} />
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

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Hành trình EQ"
        subtitle={child ? `Mức phát triển 5 năng lực CASEL của ${child.name}` : 'Theo dõi mức phát triển cảm xúc của bé'}
      />
      <ChildSwitcher childrenProfiles={childrenProfiles} selectedId={child?.id} onSelect={onSelectChild} />

      {!child ? (
        <StateView variant="empty" title="Chưa có hồ sơ bé" description="Thêm hồ sơ bé (menu Thêm → Bé nhà mình) để xem báo cáo EQ." />
      ) : res.status === 'loading' ? (
        <StateView variant="loading" title="Đang tải báo cáo EQ..." />
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
          {report.competencies.every((c) => c.level == null) && (
            <StateView
              variant="empty"
              title="Chưa có dữ liệu EQ"
              description={`${child?.name ?? 'Bé'} cần đọc thêm truyện có điểm dừng để có mức phát triển.`}
            />
          )}
          {report.competencies.map((c) => {
            const meta = CASEL[c.caselCode];
            return (
              <HeyCard key={c.caselCode} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.icon}>{meta?.icon ?? '⭐'}</Text>
                  <Text style={styles.label}>{meta?.label ?? c.nameVi}</Text>
                </View>
                <LevelBar level={c.level} />
                <Text style={styles.level}>{levelLabel(c.level)}</Text>
              </HeyCard>
            );
          })}

          {report.recommendations.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Chuyện mẫu nên đọc tiếp</Text>
              {report.recommendations.map((r) => (
                <HeyCard key={r.id} variant="yellow" style={styles.card}>
                  <Text style={styles.label}>{r.title}</Text>
                  <Text style={styles.level}>{r.skill.nameVi}</Text>
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
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 10, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { fontSize: 22 },
  label: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  barRow: { flexDirection: 'row', gap: 6 },
  barSeg: { flex: 1, height: 10, borderRadius: 5 },
  level: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary, marginTop: 8, marginBottom: 8 },
  note: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 16 },
});
