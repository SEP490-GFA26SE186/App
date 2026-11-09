// apps/mobile/src/screens/admin/FinanceScreen.tsx
// GĐ F – Doanh thu & đối soát (Web FinanceReportPage): chọn khoảng thời gian; số liệu dạng thẻ + danh sách (không bảng rộng);
// đối soát 3 mục (ví lệch sổ cái, đơn đã trả chưa có webhook, truyện lệch bộ đếm). "Tính lại bộ đếm" LUÔN qua Dialog xác nhận,
// chống bấm đúp, báo kết quả theo { fixed } của BE. Biểu đồ đã có ở Tổng quan Admin nên không lặp lại ở đây.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { Icon } from '../../components/ui/Icon';
import { useDialog } from '../../components/ui/Dialog';
import { FilterChips, InfoRow, KpiCard, ManagementPage, ResourceBody, SectionTitle, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { FINANCE_RANGES } from '../../constants/management';
import { adminService } from '../../services/adminService';
import { formatDateTime, formatNumber, money } from '../../utils/format';
import { fixCountersConfirm } from '../../utils/adminConfig';
import type { FinanceRange } from '../../types/management';

const CheckItem: React.FC<{ good: boolean; title: string; children?: React.ReactNode }> = ({ good, title, children }) => (
  <View style={styles.check}>
    <View style={styles.checkHead}>
      <Icon name={good ? 'checkmark-circle' : 'warning'} size={18} color={good ? Colors.successText : Colors.danger} />
      <Text style={[styles.checkTitle, { color: good ? Colors.successText : Colors.danger }]}>{title}</Text>
    </View>
    {children}
  </View>
);

export const FinanceScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dialog = useDialog();
  const [range, setRange] = useState<FinanceRange>('30d');
  const summary = useManagementResource(() => adminService.getFinanceSummary(range), [range]);
  const recon = useManagementResource(() => adminService.getReconciliation(), []);
  const { run, busy } = useMutationRunner(recon.reload);
  const r = summary.data?.revenue;
  const d = recon.data;

  const fix = async () => {
    if (busy || !d?.counterDrift.length) return;
    if (!(await dialog.confirm(fixCountersConfirm(d.counterDrift.length)))) return;
    if (await run('fix', () => adminService.fixCounters(), ({ fixed }) => `Đã tính lại ${fixed} truyện`)) void recon.reload();
  };

  return (
    <ManagementPage
      title="Doanh thu & đối soát"
      subtitle="Doanh thu gói và chợ truyện; hoàn tiền đã trừ. Cuối trang: đối soát sổ cái."
      onBack={onBack}
      onRefresh={() => Promise.all([summary.reload(), recon.reload()])}
    >
      <FilterChips label="Khoảng thời gian" options={FINANCE_RANGES} value={range} onChange={setRange} />
      <ResourceBody status={summary.status} error={summary.error} empty={false} emptyTitle="" onRetry={summary.reload}>
        {r && (
          <>
            <KpiCard icon="cash-outline" label="Khách đã trả" value={money(r.grossRevenue)} hint={`${formatNumber(r.orders)} mục thanh toán`} emphasis />
            <KpiCard icon="business-outline" label="Phần nền tảng giữ" value={money(r.platformRevenue)} />
            <KpiCard icon="people-outline" label="Phải trả người bán" value={money(r.sellerPayable)} />
            <HeyCard style={styles.card}>
              <InfoRow label="Doanh thu gói (nền tảng giữ 100%)" value={money(r.planRevenue)} />
              <InfoRow label="Doanh thu truyện (giá bán)" value={money(r.listingGross)} />
              <InfoRow label="− Phần người bán (chốt theo tỉ lệ lúc mua)" value={money(-r.sellerPayable)} />
              <InfoRow label="= Hoa hồng nền tảng" value={money(r.commission)} />
              <InfoRow label="Đã hoàn tiền (không tính vào trên)" value={money(r.refunded)} />
            </HeyCard>
          </>
        )}
      </ResourceBody>

      <SectionTitle>Đối soát</SectionTitle>
      <Text style={styles.muted}>Kiểm bất biến của sổ cái và bộ đếm. Không tự sửa số tiền — chỉ báo để kiểm tra.</Text>
      <HeyButton title="Kiểm lại" iconName="refresh" variant="tertiary" size="sm" onPress={() => void recon.reload()} disabled={busy} style={styles.selfStart} />
      <ResourceBody status={recon.status} error={recon.error} empty={false} emptyTitle="" onRetry={recon.reload}>
        {d && (
          <HeyCard style={styles.card}>
            <Text style={styles.muted}>
              Lúc {formatDateTime(d.checkedAt)} • {d.walletsChecked} ví
            </Text>
            <CheckItem good={!d.walletMismatches.length} title={d.walletMismatches.length ? `${d.walletMismatches.length} ví lệch sổ cái` : 'Số dư ví khớp sổ cái'}>
              {d.walletMismatches.map((m) => (
                <Text key={`${m.userId}:${m.walletType}`} style={styles.body} selectable>
                  {m.userId} • {m.walletType}: ví {formatNumber(m.walletBalance)} ≠ sổ cái {formatNumber(m.ledgerBalance)}
                </Text>
              ))}
            </CheckItem>
            <CheckItem
              good={!d.paidWithoutWebhook.length}
              title={d.paidWithoutWebhook.length ? `${d.paidWithoutWebhook.length} đơn đã trả nhưng chưa thấy webhook` : 'Mọi đơn đã trả đều có webhook payOS hợp lệ'}
            >
              {!!d.paidWithoutWebhook.length && (
                <Text style={styles.muted}>Đơn được xác nhận khi hỏi lại payOS (người dùng quay về trang kết quả). Đối chiếu trên trang payOS nếu cần.</Text>
              )}
              {d.paidWithoutWebhook.slice(0, 10).map((o) => (
                <Text key={o.orderId} style={styles.body}>
                  Mã {o.payosOrderCode} • {money(o.totalVnd)} • {formatDateTime(o.paidAt)}
                </Text>
              ))}
            </CheckItem>
            <CheckItem good={!d.counterDrift.length} title={d.counterDrift.length ? `${d.counterDrift.length} truyện lệch bộ đếm` : 'Bộ đếm lượt mua của truyện khớp'}>
              {d.counterDrift.map((c) => (
                <Text key={c.listingId} style={styles.body}>
                  {c.title}: mua {c.purchaseCount} → {c.paidActual}, nhận miễn phí {c.freeClaimCount} → {c.freeActual}
                </Text>
              ))}
              {!!d.counterDrift.length && (
                <HeyButton title="Tính lại bộ đếm" iconName="calculator-outline" size="sm" onPress={() => void fix()} loading={busy} disabled={busy} style={styles.selfStart} />
              )}
            </CheckItem>
          </HeyCard>
        )}
      </ResourceBody>
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  body: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  selfStart: { alignSelf: 'flex-start' },
  check: { gap: Spacing.xs, paddingTop: Spacing.xs },
  checkHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkTitle: { ...Typography.bodyStrong, flex: 1 },
});
