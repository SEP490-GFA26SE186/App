// apps/mobile/src/screens/specialist/AuditsScreen.tsx
// GĐ E1 – Kiểm tra ngẫu nhiên (Web AuditsPage): danh sách đợt kiểm tra; "Chọn đợt ngay" (POST /moderation/audits/run) LUÔN qua
// Dialog xác nhận ghi rõ số truyện sẽ bốc; lượt chưa quyết định → mở màn Lượt duyệt có sẵn.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { useDialog } from '../../components/ui/Dialog';
import { ManagementPage, NumberStepper, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { DECISION_LABELS, LISTING_STATUS } from '../../constants/management';
import { moderationService } from '../../services/moderationService';
import { formatDateTime } from '../../utils/format';
import { AUDIT_COUNT_DEFAULT, AUDIT_COUNT_MAX, AUDIT_COUNT_MIN, runAuditsConfirm, runAuditsMessage } from '../../utils/monitoring';

export const AuditsScreen: React.FC<{ onBack: () => void; onOpenReview: (reviewId: string) => void; onChanged: () => void }> = ({ onBack, onOpenReview, onChanged }) => {
  const dialog = useDialog();
  const list = useManagementResource(() => moderationService.getAudits(), []);
  const { run, busy } = useMutationRunner(list.reload);
  const [count, setCount] = useState(AUDIT_COUNT_DEFAULT);

  const start = async () => {
    if (busy) return;
    if (!(await dialog.confirm(runAuditsConfirm(count)))) return;
    const ok = await run('run', () => moderationService.runAudits(count), (r) => runAuditsMessage(r.created));
    if (ok) {
      void list.reload();
      onChanged(); // lượt kiểm tra mới vào hàng chờ
    }
  };

  return (
    <ManagementPage
      title="Kiểm tra ngẫu nhiên"
      subtitle="Mỗi tuần hệ thống tự chọn vài truyện đang bán để xem lại theo checklist, kể cả truyện chưa ai báo cáo. Truyện vẫn bán bình thường trong lúc kiểm."
      onBack={onBack}
      onRefresh={list.reload}
    >
      <HeyCard style={styles.card}>
        <NumberStepper label="Số truyện" value={count} min={AUDIT_COUNT_MIN} max={AUDIT_COUNT_MAX} onChange={setCount} />
        <HeyButton title="Chọn đợt ngay" iconName="shuffle" size="sm" onPress={() => void start()} loading={busy} disabled={busy} style={styles.selfStart} />
      </HeyCard>
      <ResourceBody status={list.status} error={list.error} empty={!list.data?.length} emptyTitle="Chưa có đợt kiểm tra nào." onRetry={list.reload}>
        {list.data?.map((a) => {
          const st = LISTING_STATUS[a.listing.status];
          return (
            <HeyCard key={a.reviewId} style={styles.card}>
              <Text style={styles.title}>{a.listing.title}</Text>
              {!!st && <Badge label={st.label} tone={st.tone} />}
              <Text style={styles.muted}>
                {a.listing.seller} • chọn {formatDateTime(a.createdAt)}
                {a.decidedAt ? ` • ${(a.decision && DECISION_LABELS[a.decision]) || 'Đã quyết định'} bởi ${a.moderator ?? '—'} (${formatDateTime(a.decidedAt)})` : ''}
              </Text>
              {!!a.comment && <Text style={styles.body}>{a.comment}</Text>}
              {!a.decidedAt && (
                <View>
                  <HeyButton title="Kiểm tra" iconName="create-outline" size="sm" onPress={() => onOpenReview(a.reviewId)} style={styles.selfStart} />
                </View>
              )}
            </HeyCard>
          );
        })}
      </ResourceBody>
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  title: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  body: { ...Typography.label, color: Colors.text },
  selfStart: { alignSelf: 'flex-start' },
});
