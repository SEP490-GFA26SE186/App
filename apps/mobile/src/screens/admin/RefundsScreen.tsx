// apps/mobile/src/screens/admin/RefundsScreen.tsx
// Hoàn tiền (Web RefundsPage): payOS không có API hoàn → Admin chuyển trả thủ công rồi duyệt kèm mã giao dịch.
// Theo BE (refunds.service decideRefund): duyệt BẮT BUỘC mã giao dịch, từ chối BẮT BUỘC ghi chú — Mobile kiểm trước khi gửi
// (Web cho bấm duyệt khi trống mã và để BE trả 422).
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { Badge } from '../../components/ui/Badge';
import { useDialog } from '../../components/ui/Dialog';
import { FilterChips, ManagementPage, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { adminService } from '../../services/adminService';
import { formatDateTime, money } from '../../utils/format';
import { refundDecisionError } from '../../utils/managementRules';
import type { RefundRequest, RefundStatus } from '../../types/management';

const TABS: { value: RefundStatus; label: string }[] = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'approved', label: 'Đã hoàn' },
  { value: 'rejected', label: 'Đã từ chối' },
];
const EARNING: Record<string, string> = { pending: 'đang giữ — sẽ trừ lại', available: 'đã mở khoá — trừ từ số rút được', none: 'không có' };

/** Hệ quả khi duyệt (câu chữ của Web) */
export const refundImpactText = (r: RefundRequest): string | null => {
  if (!r.impact) return null;
  return r.item.itemType === 'plan'
    ? `Gói đang ${r.impact.subscriptionStatus === 'active' ? 'dùng' : r.impact.subscriptionStatus ?? '—'}, đã dùng ${r.impact.creditsUsed ?? 0} credit trong kỳ. Duyệt: huỷ gói, xoá credit còn lại, chuyển về gói Miễn phí.`
    : `Doanh thu người bán ${money(r.impact.sellerEarning)} ${EARNING[r.impact.earningState ?? 'none'] ?? ''}. Duyệt: thu hồi quyền đọc, gỡ khỏi giá sách của bé.`;
};

const RefundCard: React.FC<{ r: RefundRequest; onDone: () => void; runner: ReturnType<typeof useMutationRunner> }> = ({ r, onDone, runner }) => {
  const dialog = useDialog();
  const [ref, setRef] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const i = r.item;
  const impact = refundImpactText(r);

  const act = async (approve: boolean) => {
    const err = refundDecisionError(approve, ref, note);
    setFormError(err);
    if (err) return;
    const ok = await dialog.confirm({
      title: approve ? 'Duyệt hoàn tiền' : 'Từ chối hoàn tiền',
      message: approve ? `Xác nhận đã chuyển trả ${money(i.unitPriceVnd)} cho ${r.requester.fullName ?? r.requester.email}?${impact ? `\n\n${impact}` : ''}` : 'Phụ huynh sẽ nhận ghi chú lý do từ chối.',
      confirmLabel: approve ? 'Đã chuyển trả — duyệt' : 'Từ chối',
      destructive: !approve,
    });
    if (!ok) return;
    const body = { approve, bankTransactionRef: ref.trim() || undefined, note: note.trim() || undefined };
    if (await runner.run(`refund:${r.id}`, () => adminService.decideRefund(r.id, body), approve ? 'Đã hoàn tiền' : 'Đã từ chối yêu cầu')) onDone();
  };

  return (
    <HeyCard style={styles.card}>
      <Text style={styles.title}>
        {money(i.unitPriceVnd)} — {i.itemType === 'plan' ? `Gói ${i.title}` : `Truyện “${i.title}”`}
        {!!i.seller && <Text style={styles.muted}> của {i.seller}</Text>}
      </Text>
      {r.status !== 'pending' && (
        <Badge label={r.status === 'approved' ? `Đã hoàn${r.bankTransactionRef ? ` • ${r.bankTransactionRef}` : ''}` : 'Đã từ chối'} tone={r.status === 'approved' ? 'success' : 'danger'} />
      )}
      <Text style={styles.muted}>
        {r.requester.fullName ?? '—'} ({r.requester.email}) • trả lúc {formatDateTime(i.paidAt)} • mã payOS {i.payosOrderCode ?? '—'} • yêu cầu {formatDateTime(r.createdAt)}
      </Text>
      <Text style={styles.quote}>“{r.reason}”</Text>
      {!!impact && <Text style={styles.body}>{impact}</Text>}
      {!!r.decisionNote && (
        <Text style={styles.body}>
          Ghi chú: {r.decisionNote}
          {r.handler ? ` — ${r.handler}` : ''}
        </Text>
      )}
      {r.status === 'pending' && (
        <View style={styles.form}>
          <Text style={styles.body} selectable>
            Chuyển trả thủ công vào:{' '}
            {r.payer ? `${r.payer.accountNumber} • ${r.payer.accountName} • ${r.payer.bankName}` : 'không có STK người trả trong webhook payOS — liên hệ phụ huynh qua email để lấy STK.'}
          </Text>
          <HeyInput label="Mã giao dịch đã chuyển trả (bắt buộc khi duyệt)" value={ref} onChangeText={(t) => setRef(t.slice(0, 100))} autoCapitalize="characters" />
          <HeyInput label="Ghi chú cho phụ huynh (bắt buộc khi từ chối)" value={note} onChangeText={(t) => setNote(t.slice(0, 2000))} multiline numberOfLines={2} />
          {!!formError && (
            <Text style={styles.error} accessibilityRole="alert">
              {formError}
            </Text>
          )}
          <HeyButton title="Đã chuyển trả — duyệt" iconName="checkmark" loading={runner.busyKey === `refund:${r.id}`} disabled={runner.busy} onPress={() => void act(true)} />
          <HeyButton title="Từ chối" iconName="close" variant="outline" disabled={runner.busy} onPress={() => void act(false)} />
        </View>
      )}
    </HeyCard>
  );
};

export const RefundsScreen: React.FC<{ onBack: () => void; onChanged: () => void }> = ({ onBack, onChanged }) => {
  const [status, setStatus] = useState<RefundStatus>('pending');
  const list = useManagementResource(() => adminService.getRefunds(status), [status]);
  const runner = useMutationRunner(list.reload);
  return (
    <ManagementPage
      title="Yêu cầu hoàn tiền"
      subtitle="Phụ huynh gửi trong thời hạn cấu hình (mặc định 3 ngày). Doanh thu của giao dịch đang chờ xử lý không được mở khoá."
      onBack={onBack}
      onRefresh={list.reload}
    >
      <FilterChips label="Trạng thái" options={TABS} value={status} onChange={setStatus} />
      <ResourceBody status={list.status} error={list.error} empty={!list.data?.length} emptyTitle="Không có yêu cầu nào." onRetry={list.reload}>
        {list.data?.map((r) => (
          <RefundCard
            key={r.id}
            r={r}
            runner={runner}
            onDone={() => {
              void list.reload();
              onChanged();
            }}
          />
        ))}
      </ResourceBody>
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  title: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  body: { ...Typography.body, fontSize: 14, color: Colors.text },
  quote: { ...Typography.body, fontSize: 14, color: Colors.text, backgroundColor: Colors.surfaceWarm, padding: Spacing.md, borderRadius: Radius.md },
  form: { gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.outline, paddingTop: Spacing.md },
  error: { ...Typography.label, color: Colors.danger },
});
