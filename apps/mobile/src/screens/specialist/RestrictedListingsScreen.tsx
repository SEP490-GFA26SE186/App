// apps/mobile/src/screens/specialist/RestrictedListingsScreen.tsx
// GĐ E1 – Truyện tạm gỡ (Web SuspendedPage): lọc Đang tạm gỡ / Đã gỡ hẳn; lượt hậu kiểm đang mở → mở màn Lượt duyệt có sẵn;
// "Cảnh cáo" tác giả (nguồn takedown, lý do ≥ 10 ký tự) qua ReasonSheet. Truyện tạm gỡ: ẩn khỏi Chợ, bé đã mua tạm không đọc được.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { FilterChips, ManagementPage, ReasonSheet, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { DECISION_LABELS, REVIEW_TYPES } from '../../constants/management';
import { moderationService } from '../../services/moderationService';
import { formatDateTime } from '../../utils/format';
import { STRIKE_REASON_MIN, strikeResultMessage } from '../../utils/monitoring';
import type { RestrictedListing, RestrictedStatus } from '../../types/management';

const TABS: { value: RestrictedStatus; label: string }[] = [
  { value: 'suspended', label: 'Đang tạm gỡ' },
  { value: 'archived', label: 'Đã gỡ hẳn' },
];

export const RestrictedListingsScreen: React.FC<{ onBack: () => void; onOpenReview: (reviewId: string) => void; onChanged: () => void }> = ({
  onBack,
  onOpenReview,
  onChanged,
}) => {
  const [status, setStatus] = useState<RestrictedStatus>('suspended');
  const list = useManagementResource(() => moderationService.getRestrictedListings(status), [status]);
  const { run, busy } = useMutationRunner(list.reload);
  const [strikeFor, setStrikeFor] = useState<RestrictedListing | null>(null);

  const issue = async (reason: string) => {
    if (!strikeFor?.seller) return;
    const seller = strikeFor.seller;
    const ok = await run(`strike:${strikeFor.id}`, () => moderationService.issueStrike({ sellerId: seller.id, source: 'takedown', reason }), strikeResultMessage);
    if (ok) {
      setStrikeFor(null);
      void list.reload();
      onChanged();
    }
  };

  return (
    <ManagementPage
      title="Truyện tạm gỡ"
      subtitle="Truyện tạm gỡ bị ẩn khỏi Chợ truyện, không mua được, và bé đã mua cũng tạm không đọc được cho tới khi có quyết định."
      onBack={onBack}
      onRefresh={list.reload}
    >
      <FilterChips label="Trạng thái truyện" options={TABS} value={status} onChange={setStatus} />
      <ResourceBody status={list.status} error={list.error} empty={!list.data?.length} emptyTitle="Không có truyện nào." onRetry={list.reload}>
        {list.data?.map((l) => {
          const r = l.review;
          const open = !!r && !r.decidedAt;
          return (
            <HeyCard key={l.id} style={styles.card}>
              <Text style={styles.title}>{l.title}</Text>
              <Text style={styles.muted}>
                {l.seller.displayName} • {l.reportsCount} báo cáo • {l.buyersCount} người đã mua • cập nhật{' '}
                {formatDateTime(l.updatedAt)}
              </Text>
              {l.seller.status === 'suspended' && <Badge label="Tài khoản bán đang khoá" tone="danger" />}
              {!!r?.decidedAt && (
                <Text style={styles.body}>
                  {(r.decision && DECISION_LABELS[r.decision]) || 'Đã quyết định'} bởi {r.moderator ?? '—'}: {r.comment ?? ''}
                </Text>
              )}
              <View style={styles.actions}>
                {open && r && (
                  <HeyButton title={`${REVIEW_TYPES[r.reviewType]?.label ?? 'Lượt duyệt'}: xem lại`} iconName="create-outline" size="sm" onPress={() => onOpenReview(r.id)} />
                )}
                <HeyButton title="Cảnh cáo" iconName="warning-outline" variant="outline" size="sm" disabled={busy} onPress={() => setStrikeFor(l)} />
              </View>
            </HeyCard>
          );
        })}
      </ResourceBody>
      <ReasonSheet
        visible={!!strikeFor}
        title="Cảnh cáo tác giả"
        description={`Người bán: ${strikeFor?.seller.displayName ?? ''}. Nguồn: truyện bị gỡ. Cảnh cáo hiệu lực 90 ngày, người bán thấy lý do và được kháng nghị một lần.`}
        label="Lý do (người bán sẽ đọc)"
        placeholder="Mô tả vi phạm: trang nào, nội dung gì…"
        minLength={STRIKE_REASON_MIN}
        confirmLabel="Cảnh cáo"
        destructive
        busy={busy}
        onSubmit={(reason) => void issue(reason)}
        onClose={() => setStrikeFor(null)}
      />
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  title: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  body: { ...Typography.label, color: Colors.text },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
