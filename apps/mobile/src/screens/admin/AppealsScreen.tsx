// apps/mobile/src/screens/admin/AppealsScreen.tsx
// Kháng nghị cảnh cáo (Web AppealsPage): Admin (khác người ra cảnh cáo — BE trả 403) xét. Chấp thuận → gỡ cảnh cáo, có thể mở lại
// tài khoản bán; từ chối BẮT BUỘC ghi chú (BE 422). POST /admin/appeals/:id/decision { approve, note? }.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { Badge } from '../../components/ui/Badge';
import { useDialog } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import { FilterChips, ManagementPage, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { APPEAL_STATUS, STRIKE_SOURCES } from '../../constants/management';
import { adminService } from '../../services/adminService';
import { formatDate, formatDateTime } from '../../utils/format';
import type { AppealStatus, StrikeAppeal } from '../../types/management';

const TABS: { value: AppealStatus; label: string }[] = [
  { value: 'pending', label: 'Chờ xét' },
  { value: 'approved', label: 'Đã chấp thuận' },
  { value: 'rejected', label: 'Đã từ chối' },
];

export const AppealsScreen: React.FC<{ onBack: () => void; onChanged: () => void }> = ({ onBack, onChanged }) => {
  const dialog = useDialog();
  const toast = useToast();
  const [status, setStatus] = useState<AppealStatus>('pending');
  const list = useManagementResource(() => adminService.getAppeals(status), [status]);
  const { run, busyKey, busy } = useMutationRunner(list.reload);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const decide = async (a: StrikeAppeal, approve: boolean) => {
    const note = notes[a.id]?.trim() ?? '';
    if (!approve && !note) {
      toast.show('Hãy ghi lý do từ chối để người bán biết.', 'danger');
      return;
    }
    const ok = await dialog.confirm({
      title: approve ? 'Chấp thuận kháng nghị' : 'Từ chối kháng nghị',
      message: approve
        ? `Gỡ cảnh cáo của ${a.strike.seller.displayName}? Nếu còn dưới ngưỡng, tài khoản bán đang khoá sẽ được mở lại.`
        : `Người bán ${a.strike.seller.displayName} sẽ nhận ghi chú lý do từ chối.`,
      confirmLabel: approve ? 'Chấp thuận' : 'Từ chối',
      destructive: !approve,
    });
    if (!ok) return;
    let reinstated = false;
    const done = await run(
      `appeal:${a.id}`,
      async () => {
        const res = await adminService.decideAppeal(a.id, { approve, note: note || undefined });
        reinstated = !!res?.sellerReinstated;
      },
      approve ? 'Đã gỡ cảnh cáo' : 'Đã từ chối kháng nghị'
    );
    if (done) {
      if (reinstated) toast.show('Đã gỡ cảnh cáo và mở lại tài khoản bán', 'success');
      void list.reload();
      onChanged();
    }
  };

  return (
    <ManagementPage
      title="Kháng nghị cảnh cáo"
      subtitle="Người bán kháng nghị cảnh cáo từ Chuyên gia sư phạm. Chấp nhận → gỡ cảnh cáo (và mở lại quyền bán nếu đủ điều kiện)."
      onBack={onBack}
      onRefresh={list.reload}
    >
      <FilterChips label="Trạng thái" options={TABS} value={status} onChange={setStatus} />
      <ResourceBody status={list.status} error={list.error} empty={!list.data?.length} emptyTitle="Không có kháng nghị nào." onRetry={list.reload}>
        {list.data?.map((a) => {
          const st = APPEAL_STATUS[a.status];
          return (
            <HeyCard key={a.id} style={styles.card}>
              <Text style={styles.title}>{a.strike.seller.displayName}</Text>
              <View style={styles.badges}>
                {a.strike.seller.status === 'suspended' && <Badge label="Tài khoản bán đang khoá" tone="danger" />}
                {!!st && <Badge label={st.label} tone={st.tone} />}
              </View>
              <View style={styles.box}>
                <Text style={styles.body}>
                  <Text style={styles.bold}>Cảnh cáo</Text> ({STRIKE_SOURCES[a.strike.source] ?? a.strike.source}, {formatDate(a.strike.issuedAt)}, bởi {a.strike.issuer?.name ?? '—'}): {a.strike.reason}
                </Text>
                <Text style={styles.body}>
                  <Text style={styles.bold}>Kháng nghị</Text> ({formatDateTime(a.createdAt)}): {a.reason}
                </Text>
                {!!a.decisionNote && (
                  <Text style={styles.body}>
                    <Text style={styles.bold}>Quyết định</Text> của {a.decider ?? '—'}: {a.decisionNote}
                  </Text>
                )}
              </View>
              {a.status === 'pending' && (
                <View style={styles.form}>
                  <HeyInput
                    label="Ghi chú cho người bán (bắt buộc khi từ chối)"
                    value={notes[a.id] ?? ''}
                    onChangeText={(t) => setNotes((m) => ({ ...m, [a.id]: t.slice(0, 2000) }))}
                    multiline
                    numberOfLines={2}
                  />
                  <HeyButton title="Chấp thuận" iconName="checkmark" loading={busyKey === `appeal:${a.id}`} disabled={busy} onPress={() => void decide(a, true)} />
                  <HeyButton title="Từ chối" iconName="close" variant="outline" disabled={busy} onPress={() => void decide(a, false)} />
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
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  box: { gap: Spacing.xs, backgroundColor: Colors.surfaceWarm, padding: Spacing.md, borderRadius: Radius.md },
  body: { ...Typography.body, fontSize: 14, color: Colors.text },
  bold: { fontFamily: FontFamily.extraBold },
  form: { gap: Spacing.sm },
});
