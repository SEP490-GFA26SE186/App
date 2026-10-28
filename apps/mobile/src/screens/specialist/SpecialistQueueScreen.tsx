// apps/mobile/src/screens/specialist/SpecialistQueueScreen.tsx
// Tổng quan kiểm duyệt (Web SpecialistDashboardPage): số truyện chờ duyệt / hồ sơ người bán / báo cáo đang mở, rồi hàng chờ
// (nộp bán + hậu kiểm báo cáo + kiểm tra ngẫu nhiên, cũ nhất trước). Chạm một truyện để mở lượt duyệt; bài người khác đang giữ có nhãn khoá.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { KpiCard, ManagementPage, ResourceBody } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { REVIEW_TYPES } from '../../constants/management';
import { CASEL } from '../../constants/eq';
import { listingPrice, since } from '../../utils/format';
import type { QueueItem } from '../../types/management';
import type { ResourceStatus } from '../../utils/useAsyncResource';

export interface SpecialistOverview {
  queue: QueueItem[];
  sellerApplications: number;
  openReports: number;
}

const QueueRow: React.FC<{ q: QueueItem; onPress: () => void }> = ({ q, onPress }) => {
  const type = REVIEW_TYPES[q.reviewType];
  const narrationPending = q.hasNarration && q.narration && !q.narration.complete;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${q.title}, ${q.seller}${q.claimedBy && !q.claimedBy.mine ? `, ${q.claimedBy.name ?? 'người khác'} đang duyệt` : ''}. Mở lượt duyệt`}
      style={(s) => [styles.rowPress, s.pressed && styles.pressed, focusRing(s)]}
    >
      <HeyCard style={styles.row}>
        <View style={[styles.rowIcon, q.reviewType === 'report_followup' && styles.rowIconDanger]}>
          <Icon name="book-outline" size={20} color={q.reviewType === 'report_followup' ? Colors.danger : Colors.tealStrong} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.title} numberOfLines={2}>
            {q.title}
          </Text>
          <Text style={styles.muted}>
            {q.seller}, {q.pageCount} trang, {listingPrice(q.priceVnd)} · {since(q.reviewType === 'submission' ? q.submittedAt : q.createdAt)}
          </Text>
          <View style={styles.badges}>
            {q.reviewType !== 'submission' && <Badge label={`${type.label}${q.openReports > 0 ? `, ${q.openReports} báo cáo` : ''}`} tone={type.tone} />}
            {narrationPending && q.narration && <Badge label={`Giọng đọc ${q.narration.ready}/${q.narration.total}`} tone="warning" />}
            {!!q.competency && <Badge label={CASEL[q.competency]?.label ?? q.competency} tone="success" />}
            {q.hasAiContent && <Badge label="AI" tone="info" />}
            {q.claimedBy && <Badge label={q.claimedBy.mine ? 'Bạn đang duyệt' : `${q.claimedBy.name ?? 'Người khác'} đang duyệt`} tone={q.claimedBy.mine ? 'warning' : 'danger'} />}
          </View>
        </View>
        <Icon name="chevron-forward" size={18} color={Colors.textMuted} />
      </HeyCard>
    </Pressable>
  );
};

export const SpecialistQueueScreen: React.FC<{
  overview: SpecialistOverview | null;
  status: ResourceStatus;
  error: string | null;
  onReload: () => Promise<unknown>;
  onOpenReview: (reviewId: string) => void;
}> = ({ overview, status, error, onReload, onOpenReview }) => (
  <ManagementPage title="Tổng quan kiểm duyệt" subtitle="Hàng chờ gồm truyện nộp bán, hậu kiểm báo cáo và kiểm tra ngẫu nhiên. Cũ nhất lên trước." onRefresh={onReload}>
    <ResourceBody
      status={status}
      error={error}
      empty={false}
      emptyTitle=""
      onRetry={() => void onReload()}
    >
      {overview && (
        <View style={styles.stack}>
          <View style={styles.kpis}>
            <View style={styles.kpiCell}>
              <KpiCard icon="book-outline" label="Truyện chờ duyệt" value={String(overview.queue.length)} emphasis />
            </View>
            <View style={styles.kpiCell}>
              <KpiCard icon="id-card-outline" label="Hồ sơ người bán chờ duyệt" value={String(overview.sellerApplications)} />
            </View>
            <View style={styles.kpiCell}>
              <KpiCard icon="flag-outline" label="Báo cáo vi phạm đang mở" value={String(overview.openReports)} />
            </View>
          </View>
          <Text style={styles.section} accessibilityRole="header">
            Hàng chờ duyệt truyện
          </Text>
          <Text style={styles.muted}>Chạm vào truyện để nhận duyệt. Truyện đang có người duyệt sẽ được khoá.</Text>
          {overview.queue.length === 0 ? (
            <HeyCard variant="accent">
              <Text style={styles.title}>Hàng chờ trống</Text>
              <Text style={styles.muted}>Không có truyện nào đang chờ duyệt. Truyện mới nộp sẽ hiện ở đây.</Text>
            </HeyCard>
          ) : (
            overview.queue.map((q) => <QueueRow key={q.reviewId} q={q} onPress={() => onOpenReview(q.reviewId)} />)
          )}
        </View>
      )}
    </ResourceBody>
  </ManagementPage>
);

const styles = StyleSheet.create({
  stack: { gap: Spacing.md },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  kpiCell: { flexGrow: 1, flexBasis: 150 },
  section: { ...Typography.heading, color: Colors.text },
  rowPress: { borderRadius: Radius.lg },
  pressed: { opacity: 0.75 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: Touch.min },
  rowIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.tealTint, alignItems: 'center', justifyContent: 'center' },
  rowIconDanger: { backgroundColor: Colors.dangerTint },
  rowText: { flex: 1, gap: 4 },
  title: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
});
