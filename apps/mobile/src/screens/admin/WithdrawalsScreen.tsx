// apps/mobile/src/screens/admin/WithdrawalsScreen.tsx
// Rút tiền người bán (Web WithdrawalsPage): Admin tự chuyển khoản bằng app ngân hàng rồi bấm "Đã chuyển khoản"
// (POST /admin/withdrawals/:id/mark-paid, mã GD tuỳ chọn); từ chối cần lý do >= 3 ký tự (BE) → tiền trả lại số dư người bán.
// Thông tin tài khoản chép được (chạm giữ). Ảnh VietQR của Web không đưa lên Mobile (gửi STK cho dịch vụ ngoài).
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { useDialog } from '../../components/ui/Dialog';
import { FilterChips, InfoRow, ManagementPage, ReasonSheet, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { adminService } from '../../services/adminService';
import { formatDateTime, formatNumber } from '../../utils/format';
import { transferNote } from '../../utils/managementRules';
import type { Withdrawal, WithdrawalStatus } from '../../types/management';

const TABS: { value: WithdrawalStatus; label: string }[] = [
  { value: 'requested', label: 'Chờ chuyển khoản' },
  { value: 'paid', label: 'Đã chuyển' },
  { value: 'rejected', label: 'Từ chối' },
];

export const WithdrawalsScreen: React.FC<{ onBack: () => void; onChanged: () => void }> = ({ onBack, onChanged }) => {
  const dialog = useDialog();
  const [status, setStatus] = useState<WithdrawalStatus>('requested');
  const list = useManagementResource(() => adminService.getWithdrawals(status), [status]);
  const { run, busyKey, busy } = useMutationRunner(list.reload);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState<Withdrawal | null>(null);

  const done = () => {
    void list.reload();
    onChanged();
  };

  const markPaid = async (w: Withdrawal) => {
    const ok = await dialog.confirm({
      title: 'Xác nhận đã chuyển khoản',
      message: `Xác nhận đã chuyển ${formatNumber(w.amountVnd)}đ cho ${w.bank.accountHolder ?? w.seller.displayName}?`,
      confirmLabel: 'Đã chuyển khoản',
    });
    if (!ok) return;
    const ref = refs[w.id]?.trim();
    if (await run(`paid:${w.id}`, () => adminService.markWithdrawalPaid(w.id, ref || undefined), 'Đã ghi nhận chuyển khoản')) done();
  };

  const reject = async (reason: string) => {
    const w = rejecting;
    if (!w) return;
    if (await run(`reject:${w.id}`, () => adminService.rejectWithdrawal(w.id, reason), 'Đã từ chối và trả tiền cho người bán')) {
      setRejecting(null);
      done();
    }
  };

  return (
    <ManagementPage
      title="Rút tiền người bán"
      subtitle="Chuyển khoản bằng app ngân hàng (chạm giữ để chép thông tin), rồi bấm “Đã chuyển khoản”. Từ chối → tiền trả lại số dư người bán."
      onBack={onBack}
      onRefresh={list.reload}
    >
      <FilterChips label="Trạng thái" options={TABS} value={status} onChange={setStatus} />
      <ResourceBody status={list.status} error={list.error} empty={!list.data?.length} emptyTitle="Không có yêu cầu nào." onRetry={list.reload}>
        {list.data?.map((w) => (
          <HeyCard key={w.id} style={styles.card}>
            <Text style={styles.amount}>{formatNumber(w.amountVnd)}đ</Text>
            <Text style={styles.seller}>
              {w.seller.displayName} <Text style={styles.muted}>({w.seller.email})</Text>
            </Text>
            <Text style={styles.muted}>Yêu cầu lúc {formatDateTime(w.createdAt)}</Text>
            <View style={styles.bank}>
              <InfoRow label="Ngân hàng" value={w.bank.bankName} selectable />
              <InfoRow label="Số tài khoản" value={w.bank.accountNumber} selectable />
              <InfoRow label="Chủ tài khoản" value={w.bank.accountHolder ?? '—'} selectable />
              {status === 'requested' && <InfoRow label="Nội dung chuyển khoản" value={transferNote(w)} selectable />}
              {!!w.handledAt && <InfoRow label="Xử lý lúc" value={formatDateTime(w.handledAt)} />}
              {!!w.bankTransactionRef && <InfoRow label="Mã giao dịch" value={w.bankTransactionRef} selectable />}
            </View>
            {!!w.rejectReason && <Text style={styles.danger}>{w.rejectReason}</Text>}
            {status === 'requested' && (
              <View style={styles.actions}>
                <HeyInput
                  label="Mã giao dịch ngân hàng (tuỳ chọn)"
                  value={refs[w.id] ?? ''}
                  onChangeText={(t) => setRefs((m) => ({ ...m, [w.id]: t.slice(0, 100) }))}
                  autoCapitalize="characters"
                />
                <HeyButton title="Đã chuyển khoản" iconName="checkmark" loading={busyKey === `paid:${w.id}`} disabled={busy} onPress={() => void markPaid(w)} />
                <HeyButton title="Từ chối" iconName="close" variant="outline" disabled={busy} onPress={() => setRejecting(w)} />
              </View>
            )}
          </HeyCard>
        ))}
      </ResourceBody>

      <ReasonSheet
        visible={!!rejecting}
        title="Từ chối yêu cầu rút tiền"
        description={rejecting ? `${formatNumber(rejecting.amountVnd)}đ — ${rejecting.seller.displayName}. Số tiền sẽ trả lại số dư người bán.` : undefined}
        label="Lý do từ chối"
        minLength={3}
        confirmLabel="Từ chối"
        destructive
        busy={!!rejecting && busyKey === `reject:${rejecting.id}`}
        onSubmit={(reason) => void reject(reason)}
        onClose={() => setRejecting(null)}
      />
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.xs },
  amount: { ...Typography.title, color: Colors.text },
  seller: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  bank: { marginTop: Spacing.sm, padding: Spacing.md, borderRadius: 14, backgroundColor: Colors.surfaceWarm },
  danger: { ...Typography.label, color: Colors.danger },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
});
