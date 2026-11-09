// apps/mobile/src/components/parent/PaymentHistory.tsx
// GĐ D1 – Lịch sử thanh toán (Web PaymentHistory): mỗi mục đã trả là một thẻ (tên, giá, ngày, mã đơn, trạng thái hoàn tiền).
// "Yêu cầu hoàn tiền" chỉ hiện khi BE cho phép và còn trong hạn; lý do nhập trong sheet (10–2000 ký tự như BE), gửi LUÔN qua
// Dialog xác nhận, chống bấm đúp, lỗi BE hiện câu đã dịch.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../ui/HeyCard';
import { HeyButton } from '../ui/HeyButton';
import { Badge } from '../ui/Badge';
import { StateView } from '../ui/StateView';
import { useDialog } from '../ui/Dialog';
import { ReasonSheet, useMutationRunner } from '../management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { billingService } from '../../services/billingService';
import { useAsyncResource } from '../../utils/useAsyncResource';
import { formatDate, money } from '../../utils/format';
import { REFUND_REASON_MAX, REFUND_REASON_MIN, REFUND_STATUS, canRequestRefund, itemTitle, paymentRows, refundConfirm } from '../../utils/billing';
import type { PaidOrderDto, PaidOrderItemDto } from '../../types/api';

/** `reloadKey` đổi → tải lại (vd. sau khi thanh toán xong) */
export const PaymentHistory: React.FC<{ reloadKey: number }> = ({ reloadKey }) => {
  const dialog = useDialog();
  const res = useAsyncResource(() => billingService.getMyOrders(), [reloadKey]);
  const { run, busy } = useMutationRunner(res.reload);
  const [target, setTarget] = useState<{ order: PaidOrderDto; item: PaidOrderItemDto } | null>(null);
  const rows = res.data ? paymentRows(res.data.orders) : [];

  const submit = async (reason: string) => {
    if (!target || busy) return;
    if (!(await dialog.confirm(refundConfirm(target.order, target.item)))) return;
    const ok = await run(
      `refund:${target.item.id}`,
      () => billingService.requestRefund(target.item.id, reason),
      'Đã gửi yêu cầu hoàn tiền. Quản trị viên sẽ chuyển trả vào tài khoản đã thanh toán.'
    );
    if (ok) {
      setTarget(null);
      void res.reload();
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Lịch sử thanh toán
      </Text>
      {res.status === 'loading' && !res.data && <StateView variant="skeleton" title="Đang tải lịch sử thanh toán..." />}
      {res.status === 'error' && (
        <StateView variant="error" title="Chưa tải được lịch sử thanh toán" description={res.error ?? ''} actionLabel="Thử lại" onAction={() => void res.reload()} />
      )}
      {res.data && !rows.length && <StateView variant="empty" title="Chưa có thanh toán nào" description="Các lần mua gói có phí sẽ hiện ở đây." />}
      {!!rows.length && <Text style={styles.muted}>Ba mẹ có thể yêu cầu hoàn tiền trong {res.data?.refundWindowDays} ngày kể từ lúc thanh toán.</Text>}
      {rows.map(({ order, item }) => {
        const st = item.refund ? REFUND_STATUS[item.refund.status] : undefined;
        return (
          <HeyCard key={item.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.title}>{itemTitle(item)}</Text>
              {!!st && <Badge label={st.label} tone={st.tone} />}
            </View>
            <Text style={styles.muted}>
              {money(item.unitPriceVnd)} • {formatDate(order.paidAt)} • mã {order.payosOrderCode ?? '—'}
            </Text>
            {!!item.refund?.decisionNote && <Text style={styles.body}>Quản trị viên: {item.refund.decisionNote}</Text>}
            {canRequestRefund(item) && (
              <HeyButton
                title={`Yêu cầu hoàn tiền${item.deadline ? ` (đến ${formatDate(item.deadline)})` : ''}`}
                iconName="arrow-undo-outline"
                variant="tertiary"
                size="sm"
                onPress={() => setTarget({ order, item })}
                disabled={busy}
                accessibilityLabel={`Yêu cầu hoàn tiền ${itemTitle(item)}`}
                style={styles.selfStart}
              />
            )}
          </HeyCard>
        );
      })}
      <ReasonSheet
        visible={!!target}
        title="Yêu cầu hoàn tiền"
        description={target ? `${itemTitle(target.item)} • ${money(target.item.unitPriceVnd)}` : undefined}
        label="Lý do hoàn tiền"
        placeholder="Nhập lý do hoàn tiền"
        minLength={REFUND_REASON_MIN}
        maxLength={REFUND_REASON_MAX}
        confirmLabel="Gửi yêu cầu"
        busy={busy}
        onSubmit={(reason) => void submit(reason)}
        onClose={() => setTarget(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.md },
  card: { gap: Spacing.xs },
  title: { ...Typography.bodyStrong, color: Colors.text, flexShrink: 1 },
  body: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  selfStart: { alignSelf: 'flex-start' },
});
