// apps/mobile/src/screens/parent/EqReportScreen.tsx
// B8 – Hành trình EQ (Web: EqJourneyPage). Chỉ hiện MỨC theo 5 năng lực CASEL, không điểm/%.
// Báo cáo thật (GET /children/:id/eq-report) chưa được nối (C7): khi `report` chưa có, hiện trạng thái chưa kết nối,
// KHÔNG hiện số liệu dựng sẵn. Khi có `report`, hiển thị đúng dữ liệu BE; level = null → "Chưa có dữ liệu".
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ChildProfile } from '../../../../../packages/shared-types';
import { HeyCard } from '../../components/ui/HeyCard';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ChildSwitcher } from '../../components/parent/ChildSwitcher';
import { Colors } from '../../theme/colors';
import { CASEL, EQ_LEVELS, EQ_REPORT_NOTE, EqLevel, levelLabel } from '../../constants/eq';
import type { EqReportDto } from '../../types/api';

interface EqReportScreenProps {
  childrenProfiles: ChildProfile[];
  selectedChildId?: string;
  onSelectChild: (id: string) => void;
  /** Báo cáo của bé đang chọn do BE trả; chưa nối API → undefined */
  report?: EqReportDto | null;
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
  report,
}) => {
  const child = childrenProfiles.find((c) => c.id === selectedChildId) ?? childrenProfiles[0];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Hành trình EQ"
        subtitle={child ? `Mức phát triển 5 năng lực CASEL của ${child.name}` : 'Theo dõi mức phát triển cảm xúc của bé'}
      />
      <ChildSwitcher childrenProfiles={childrenProfiles} selectedId={child?.id} onSelect={onSelectChild} />

      {!child ? (
        <StateView variant="empty" title="Chưa có hồ sơ bé" description="Thêm hồ sơ bé (menu Thêm → Bé nhà mình) để xem báo cáo EQ." />
      ) : !report ? (
        <StateView
          variant="unsupported"
          title="Báo cáo EQ chưa được kết nối"
          description="Mức EQ và gợi ý chuyện mẫu sẽ lấy từ dữ liệu đọc truyện thật của bé khi ứng dụng kết nối đầy đủ với máy chủ. Hiện chưa có số liệu nào để hiển thị."
        />
      ) : (
        <>
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
