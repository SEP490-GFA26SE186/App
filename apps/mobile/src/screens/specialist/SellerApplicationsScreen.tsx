// apps/mobile/src/screens/specialist/SellerApplicationsScreen.tsx
// Hồ sơ người bán (Web SellerApplicationsPage): phụ huynh có gói được bán nộp biệt danh + giới thiệu; duyệt để mở quyền đăng bán.
// POST /moderation/sellers/:userId/decision { approve } — BE chỉ nhận hồ sơ đang chờ (đã xử lý → 404).
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { useDialog } from '../../components/ui/Dialog';
import { FilterChips, ManagementPage, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { moderationService } from '../../services/moderationService';
import { formatDateTime } from '../../utils/format';
import type { SellerApplication, SellerStatus } from '../../types/management';

const TABS: { value: SellerStatus; label: string }[] = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
];

export const SellerApplicationsScreen: React.FC<{ onChanged: () => void }> = ({ onChanged }) => {
  const dialog = useDialog();
  const [status, setStatus] = useState<SellerStatus>('pending');
  const list = useManagementResource(() => moderationService.getSellerApplications(status), [status]);
  const { run, busyKey, busy } = useMutationRunner(list.reload);

  const act = async (s: SellerApplication, approve: boolean) => {
    const ok = await dialog.confirm({
      title: approve ? 'Duyệt hồ sơ người bán' : 'Từ chối hồ sơ người bán',
      message: approve ? `Mở quyền đăng bán trên Chợ truyện cho ${s.displayName}?` : `Từ chối hồ sơ của ${s.displayName}?`,
      confirmLabel: approve ? 'Duyệt' : 'Từ chối',
      destructive: !approve,
    });
    if (!ok) return;
    if (await run(`seller:${s.userId}`, () => moderationService.decideSeller(s.userId, approve), approve ? `Đã duyệt ${s.displayName}` : `Đã từ chối ${s.displayName}`)) {
      void list.reload();
      onChanged();
    }
  };

  return (
    <ManagementPage title="Hồ sơ người bán" subtitle="Phụ huynh đăng ký bán truyện — duyệt để mở quyền đăng bán trên Chợ truyện." onRefresh={list.reload}>
      <FilterChips label="Trạng thái" options={TABS} value={status} onChange={setStatus} />
      <ResourceBody status={list.status} error={list.error} empty={!list.data?.length} emptyTitle="Không có hồ sơ nào." onRetry={list.reload}>
        {list.data?.map((s) => (
          <HeyCard key={s.userId} style={styles.card}>
            <Text style={styles.title}>{s.displayName}</Text>
            <Text style={styles.muted}>
              {s.fullName ?? '—'} • {s.email}
            </Text>
            {!!s.bio && <Text style={styles.body}>{s.bio}</Text>}
            {!!s.expertise && <Text style={styles.body}>Chuyên môn: {s.expertise}</Text>}
            <Text style={styles.muted}>Nộp lúc {formatDateTime(s.createdAt)}</Text>
            {status === 'pending' && (
              <View style={styles.actions}>
                <View style={styles.flex}>
                  <HeyButton title="Từ chối" iconName="close" variant="outline" disabled={busy} onPress={() => void act(s, false)} />
                </View>
                <View style={styles.flex}>
                  <HeyButton title="Duyệt" iconName="checkmark" loading={busyKey === `seller:${s.userId}`} disabled={busy} onPress={() => void act(s, true)} />
                </View>
              </View>
            )}
          </HeyCard>
        ))}
      </ResourceBody>
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: Spacing.xs },
  title: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  body: { ...Typography.body, fontSize: 14, color: Colors.text },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
});
