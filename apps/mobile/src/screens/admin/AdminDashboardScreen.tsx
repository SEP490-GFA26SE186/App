// apps/mobile/src/screens/admin/AdminDashboardScreen.tsx
// Dashboard điều hành (Web AdminDashboardPage): KPI tài chính theo khoảng thời gian (GET /admin/finance/summary),
// doanh thu theo ngày (cột chồng Gói + Truyện, hoặc bảng số liệu), việc đang chờ (GET /admin/overview), người dùng & tiền người bán.
// Mọi số liệu lấy nguyên từ BE, Mobile không tự tính. Xuất CSV chỉ có trên Web.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { Badge } from '../../components/ui/Badge';
import { Icon, IconName } from '../../components/ui/Icon';
import { FilterChips, InfoRow, KpiCard, ManagementPage, ResourceBody, SectionTitle, useManagementResource } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { FINANCE_RANGES } from '../../constants/management';
import { adminService } from '../../services/adminService';
import { formatNumber, money } from '../../utils/format';
import type { AdminNavBadges, FinanceRange, FinanceSeriesPoint } from '../../types/management';
import { ADMIN_ROUTES, ManagementRoute } from '../../navigation/managementRoutes';

const dayLabel = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const BAR_AREA = 140;

/** Cột chồng theo ngày; nhiều ngày thì cuộn ngang (mỗi cột rộng cố định để không bị mảnh như sợi chỉ) */
const RevenueBars: React.FC<{ series: FinanceSeriesPoint[] }> = ({ series }) => {
  const max = Math.max(0, ...series.map((d) => d.plan + d.listing));
  const total = series.reduce((s, d) => s + d.plan + d.listing, 0);
  if (max === 0) return <Text style={styles.muted}>Chưa có doanh thu trong khoảng này.</Text>;
  const every = Math.max(1, Math.ceil(series.length / 8));
  return (
    <View accessible accessibilityLabel={`Biểu đồ doanh thu ${series.length} ngày, tổng ${money(total)}, ngày cao nhất ${money(max)}. Chọn Bảng số liệu để nghe từng ngày.`}>
      <Text style={styles.axis}>Cao nhất: {money(max)}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={series.length > 31} contentContainerStyle={styles.bars}>
        {series.map((d, i) => {
          const planH = (BAR_AREA * d.plan) / max;
          const listingH = (BAR_AREA * d.listing) / max;
          return (
            <View key={d.day} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.barSeg, { height: listingH, backgroundColor: Colors.brand }]} />
                <View style={[styles.barSeg, { height: planH, backgroundColor: Colors.brandDeep }]} />
              </View>
              <Text style={styles.barLabel}>{i % every === 0 ? dayLabel(d.day) : ' '}</Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: Colors.brandDeep }]} />
        <Text style={styles.legendText}>Gói</Text>
        <View style={[styles.dot, { backgroundColor: Colors.brand }]} />
        <Text style={styles.legendText}>Truyện (giá bán)</Text>
      </View>
    </View>
  );
};

const RevenueTable: React.FC<{ series: FinanceSeriesPoint[] }> = ({ series }) => (
  <View>
    <View style={[styles.tr, styles.thead]}>
      <Text style={[styles.td, styles.th]}>Ngày</Text>
      <Text style={[styles.tdNum, styles.th]}>Gói</Text>
      <Text style={[styles.tdNum, styles.th]}>Truyện</Text>
      <Text style={[styles.tdNum, styles.th]}>Hoa hồng</Text>
    </View>
    {series
      .filter((d) => d.plan || d.listing || d.commission)
      .map((d) => (
        <View key={d.day} style={styles.tr}>
          <Text style={styles.td}>{dayLabel(d.day)}</Text>
          <Text style={styles.tdNum}>{formatNumber(d.plan)}</Text>
          <Text style={styles.tdNum}>{formatNumber(d.listing)}</Text>
          <Text style={styles.tdNum}>{formatNumber(d.commission)}</Text>
        </View>
      ))}
    <Text style={styles.muted}>Đơn vị: đồng. Chỉ liệt kê ngày có phát sinh.</Text>
  </View>
);

export const QueueRow: React.FC<{ icon: IconName; label: string; count?: number; onPress: () => void }> = ({ icon, label, count, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={count == null ? label : `${label}: ${count}`}
    style={(s) => [styles.queueRow, s.pressed && styles.pressed, focusRing(s)]}
  >
    <View style={[styles.queueIcon, !!count && styles.queueIconActive]}>
      <Icon name={icon} size={20} color={count ? Colors.brandStrong : Colors.textMuted} />
    </View>
    <Text style={styles.queueLabel}>{label}</Text>
    <Badge label={count == null ? '—' : String(count)} tone={count ? 'danger' : 'neutral'} />
    <Icon name="chevron-forward" size={18} color={Colors.textMuted} />
  </Pressable>
);

export const ADMIN_QUEUES: { route: ManagementRoute; key: keyof AdminNavBadges; icon: IconName; label: string }[] = [
  { route: ADMIN_ROUTES.WITHDRAWALS, key: 'withdrawals', icon: 'wallet-outline', label: 'Rút tiền chờ duyệt' },
  { route: ADMIN_ROUTES.REFUNDS, key: 'refunds', icon: 'swap-horizontal-outline', label: 'Hoàn tiền chờ xử lý' },
  { route: ADMIN_ROUTES.APPEALS, key: 'appeals', icon: 'hammer-outline', label: 'Kháng nghị chờ xét' },
];

export const AdminDashboardScreen: React.FC<{
  badges: AdminNavBadges | null;
  onRefreshBadges: () => Promise<unknown>;
  onOpen: (route: ManagementRoute) => void;
}> = ({ badges, onRefreshBadges, onOpen }) => {
  const [range, setRange] = useState<FinanceRange>('30d');
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const finance = useManagementResource(() => adminService.getFinanceSummary(range), [range]);
  const label = FINANCE_RANGES.find((r) => r.value === range)?.label ?? '';
  const d = finance.data;
  const pendingTotal = badges ? badges.withdrawals + badges.refunds + badges.appeals : null;

  return (
    <ManagementPage
      title="Dashboard điều hành"
      subtitle="Số liệu từ đơn đã thanh toán (trừ hoàn tiền). Ngày tính theo giờ Việt Nam."
      onRefresh={() => Promise.all([finance.reload(), onRefreshBadges()])}
    >
      <FilterChips label="Khoảng thời gian" options={FINANCE_RANGES} value={range} onChange={setRange} />

      <ResourceBody status={finance.status} error={finance.error} empty={false} emptyTitle="" onRetry={finance.reload}>
        {d && (
          <View style={styles.stack}>
            <KpiCard
              icon="cash-outline"
              label="Khách đã trả"
              value={money(d.revenue.grossRevenue)}
              hint={`${formatNumber(d.revenue.orders)} mục thanh toán, hoàn ${money(d.revenue.refunded)}`}
            />
            <KpiCard
              icon="business-outline"
              emphasis
              label="Phần nền tảng giữ"
              value={money(d.revenue.platformRevenue)}
              hint={`Gói ${money(d.revenue.planRevenue)} + hoa hồng ${money(d.revenue.commission)}`}
            />
            <KpiCard
              icon="hand-left-outline"
              label="Phải trả người bán"
              value={money(d.revenue.sellerPayable)}
              hint={`Truyện bán được ${money(d.revenue.listingGross)}`}
            />

            <HeyCard style={styles.stack}>
              <Text style={styles.cardTitle} accessibilityRole="header">
                Doanh thu theo ngày
              </Text>
              <Text style={styles.muted}>{label}, cột chồng theo nguồn doanh thu</Text>
              <FilterChips
                label="Kiểu hiển thị"
                options={[
                  { value: 'chart', label: 'Biểu đồ' },
                  { value: 'table', label: 'Bảng số liệu' },
                ]}
                value={view}
                onChange={setView}
              />
              {view === 'chart' ? <RevenueBars series={d.series} /> : <RevenueTable series={d.series} />}
            </HeyCard>
          </View>
        )}
      </ResourceBody>

      <HeyCard style={styles.stack}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            Việc đang chờ
          </Text>
          {pendingTotal != null && <Badge label={pendingTotal > 0 ? `${pendingTotal} việc` : 'Đã xong'} tone={pendingTotal > 0 ? 'danger' : 'success'} />}
        </View>
        {ADMIN_QUEUES.map((q) => (
          <QueueRow key={q.route} icon={q.icon} label={q.label} count={badges?.[q.key]} onPress={() => onOpen(q.route)} />
        ))}
      </HeyCard>

      {d && (
        <HeyCard>
          <SectionTitle>Người dùng & tiền người bán</SectionTitle>
          <InfoRow label={`Phụ huynh mới (${label.toLowerCase()})`} value={formatNumber(d.newParents)} />
          <InfoRow
            label="Gói trả phí đang dùng"
            value={d.activePaidSubscriptions.length ? d.activePaidSubscriptions.map((s) => `${s.plan}: ${s.count}`).join(' · ') : 'Chưa có'}
          />
          <InfoRow label="Doanh thu người bán đang giữ" value={money(d.sellerFunds.pendingVnd)} />
          <InfoRow label="Người bán rút được" value={money(d.sellerFunds.availableVnd)} />
          <InfoRow label="Đang rút" value={`${money(d.sellerFunds.lockedVnd)} · ${d.sellerFunds.withdrawalsInFlight.count} yêu cầu`} />
          <Text style={styles.muted}>Xuất CSV báo cáo tài chính hiện chỉ có trên bản Web.</Text>
        </HeyCard>
      )}
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  stack: { gap: Spacing.md },
  pressed: { opacity: 0.7 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  cardTitle: { ...Typography.heading, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  axis: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.xs },
  // Nhãn ngày (rộng 40) căn giữa trên cột 14 → chừa lề hai đầu để nhãn đầu/cuối không bị cắt
  bars: { alignItems: 'flex-end', gap: 4, paddingVertical: Spacing.xs, paddingHorizontal: 14 },
  barCol: { width: 14, alignItems: 'center' },
  barTrack: { height: BAR_AREA, width: 10, justifyContent: 'flex-end', borderRadius: 3, overflow: 'hidden', backgroundColor: Colors.surfaceMuted },
  barSeg: { width: '100%' },
  barLabel: { ...Typography.caption, fontSize: 10, lineHeight: 14, color: Colors.textMuted, width: 40, textAlign: 'center', marginTop: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm, flexWrap: 'wrap' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...Typography.caption, color: Colors.text, marginRight: Spacing.sm },
  tr: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.outline },
  thead: { borderBottomColor: Colors.outlineStrong },
  th: { fontFamily: FontFamily.extraBold, color: Colors.textMuted },
  td: { ...Typography.caption, color: Colors.text, width: 48 },
  tdNum: { ...Typography.caption, color: Colors.text, flex: 1, textAlign: 'right' },
  queueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: Touch.min + 4, borderRadius: Radius.md },
  queueIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  queueIconActive: { backgroundColor: Colors.brandTint },
  queueLabel: { ...Typography.label, color: Colors.text, flex: 1 },
});
