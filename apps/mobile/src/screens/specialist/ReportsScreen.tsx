// apps/mobile/src/screens/specialist/ReportsScreen.tsx
// Báo cáo vi phạm (Web ReportsPage), gom theo truyện. Đủ 3 phụ huynh khác nhau trong 24 giờ thì BE tự tạm gỡ và tạo lượt hậu kiểm.
// Thao tác: mở lượt hậu kiểm, tạm gỡ (lý do >= 5 ký tự), cảnh cáo tác giả (lý do >= 10 ký tự), bác báo cáo, ẩn đánh giá vi phạm.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { useDialog } from '../../components/ui/Dialog';
import { FilterChips, ManagementPage, ReasonSheet, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { LISTING_STATUS, REPORT_CATEGORIES, REPORT_STATUS, REVIEW_TYPES } from '../../constants/management';
import { moderationService } from '../../services/moderationService';
import { formatDateTime } from '../../utils/format';
import type { ContentReport, ReportGroup, ReportStatus } from '../../types/management';

const TABS: { value: ReportStatus; label: string }[] = [
  { value: 'open', label: 'Đang mở' },
  { value: 'resolved', label: 'Vi phạm' },
  { value: 'dismissed', label: 'Đã bác' },
  { value: 'all', label: 'Tất cả' },
];

type SheetState = { kind: 'suspend'; group: ReportGroup } | { kind: 'strike'; group: ReportGroup } | null;

export const ReportsScreen: React.FC<{ onOpenReview: (reviewId: string) => void; onChanged: () => void }> = ({ onOpenReview, onChanged }) => {
  const dialog = useDialog();
  const [status, setStatus] = useState<ReportStatus>('open');
  const list = useManagementResource(() => moderationService.getReportGroups(status), [status]);
  const { run, busyKey, busy } = useMutationRunner(list.reload);
  const [sheet, setSheet] = useState<SheetState>(null);

  const after = () => {
    void list.reload();
    onChanged();
  };

  const dismiss = async (r: ContentReport) => {
    const ok = await dialog.confirm({ title: 'Bác báo cáo', message: `Bác báo cáo “${REPORT_CATEGORIES[r.category] ?? r.category}” của ${r.reporter}?`, confirmLabel: 'Bác' });
    if (ok && (await run(`dismiss:${r.id}`, () => moderationService.dismissReport(r.id), 'Đã bác báo cáo'))) after();
  };

  const hide = async (r: ContentReport) => {
    if (!r.review) return;
    const reviewId = r.review.id;
    const ok = await dialog.confirm({ title: 'Ẩn đánh giá', message: 'Ẩn đánh giá vi phạm này? Các báo cáo đang mở của đánh giá sẽ được đóng.', confirmLabel: 'Ẩn đánh giá', destructive: true });
    if (ok && (await run(`hide:${reviewId}`, () => moderationService.hideProductReview(reviewId), 'Đã ẩn đánh giá'))) after();
  };

  const submitSheet = async (reason: string) => {
    if (!sheet) return;
    const { listing, reports } = sheet.group;
    const ok =
      sheet.kind === 'suspend'
        ? await run(`suspend:${listing.id}`, () => moderationService.suspendListing(listing.id, reason), 'Đã tạm gỡ — truyện vào hàng chờ hậu kiểm')
        : await run(
            `strike:${listing.id}`,
            () => moderationService.issueStrike({ sellerId: listing.sellerId, source: 'report', sourceId: reports[0]?.id, reason }),
            `Đã cảnh cáo ${listing.seller}`
          );
    if (ok) {
      setSheet(null);
      after();
    }
  };

  return (
    <ManagementPage
      title="Báo cáo vi phạm"
      subtitle="Đủ 3 phụ huynh khác nhau báo cáo một truyện trong 24 giờ thì hệ thống tự tạm gỡ. Xem lại truyện để giữ (bác các báo cáo) hoặc gỡ hẳn (tự cảnh cáo tác giả)."
      onRefresh={list.reload}
    >
      <FilterChips label="Trạng thái báo cáo" options={TABS} value={status} onChange={setStatus} />
      <ResourceBody status={list.status} error={list.error} empty={!list.data?.length} emptyTitle="Không có báo cáo nào." onRetry={list.reload}>
        {list.data?.map((g) => {
          const st = LISTING_STATUS[g.listing.status];
          const openCount = g.reports.filter((r) => r.status === 'open').length;
          return (
            <HeyCard key={g.listing.id} style={styles.card}>
              <Text style={styles.title}>{g.listing.title}</Text>
              {!!st && <Badge label={st.label} tone={st.tone} />}
              <Text style={styles.muted}>
                Người bán: {g.listing.seller} • {g.reports.length} báo cáo{openCount ? ` (${openCount} đang mở)` : ''}
              </Text>
              <View style={styles.actions}>
                {!!g.openReview && (
                  <HeyButton
                    title={`${REVIEW_TYPES[g.openReview.reviewType]?.label ?? 'Lượt duyệt'}: xem lại truyện`}
                    iconName="create-outline"
                    size="sm"
                    onPress={() => onOpenReview(g.openReview!.id)}
                  />
                )}
                {g.listing.status === 'published' && (
                  <HeyButton title="Tạm gỡ & hậu kiểm" iconName="pause-circle-outline" variant="outline" size="sm" disabled={busy} onPress={() => setSheet({ kind: 'suspend', group: g })} />
                )}
                <HeyButton title="Cảnh cáo" iconName="warning-outline" variant="outline" size="sm" disabled={busy} onPress={() => setSheet({ kind: 'strike', group: g })} />
              </View>
              {g.reports.map((r) => {
                const rs = REPORT_STATUS[r.status];
                return (
                  <View key={r.id} style={styles.report}>
                    <View style={styles.reportHead}>
                      <Text style={styles.bold}>
                        {REPORT_CATEGORIES[r.category] ?? r.category}
                        {r.pageOrder ? <Text style={styles.muted}> • trang {r.pageOrder}</Text> : null}
                      </Text>
                      {!!rs && <Badge label={rs.label} tone={rs.tone} />}
                    </View>
                    {!!r.review && (
                      <Text style={styles.body}>
                        <Text style={styles.bold}>
                          Đánh giá {r.review.rating}★{r.review.hidden ? ' (đã ẩn)' : ''}:
                        </Text>{' '}
                        {r.review.comment || 'không có nhận xét'}
                      </Text>
                    )}
                    {!!r.description && <Text style={styles.body}>“{r.description}”</Text>}
                    <Text style={styles.muted}>
                      {r.reporter} • {formatDateTime(r.createdAt)}
                      {r.handler ? ` • xử lý bởi ${r.handler}` : ''}
                    </Text>
                    {r.status === 'open' && (
                      <View style={styles.actions}>
                        {!!r.review && !r.review.hidden && (
                          <HeyButton title="Ẩn đánh giá" variant="danger" size="sm" loading={busyKey === `hide:${r.review.id}`} disabled={busy} onPress={() => void hide(r)} />
                        )}
                        <HeyButton title="Bác" variant="outline" size="sm" loading={busyKey === `dismiss:${r.id}`} disabled={busy} onPress={() => void dismiss(r)} />
                      </View>
                    )}
                  </View>
                );
              })}
            </HeyCard>
          );
        })}
      </ResourceBody>

      <ReasonSheet
        visible={!!sheet}
        title={sheet?.kind === 'suspend' ? 'Tạm gỡ truyện' : 'Cảnh cáo tác giả'}
        description={
          sheet?.kind === 'suspend'
            ? `“${sheet.group.listing.title}” ngừng bán và vào hàng chờ hậu kiểm.`
            : sheet
              ? `${sheet.group.listing.seller} — Nguồn: Báo cáo vi phạm. Cảnh cáo hiệu lực 90 ngày, người bán thấy lý do và được kháng nghị một lần.`
              : undefined
        }
        label={sheet?.kind === 'suspend' ? 'Lý do tạm gỡ' : 'Lý do cảnh cáo'}
        minLength={sheet?.kind === 'suspend' ? 5 : 10}
        confirmLabel={sheet?.kind === 'suspend' ? 'Tạm gỡ' : 'Cảnh cáo'}
        destructive
        busy={busy}
        onSubmit={(reason) => void submitSheet(reason)}
        onClose={() => setSheet(null)}
      />
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  title: { ...Typography.heading, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  body: { ...Typography.body, fontSize: 14, color: Colors.text },
  bold: { ...Typography.label, fontFamily: FontFamily.extraBold, color: Colors.text },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  report: { gap: Spacing.xs, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surfaceWarm },
  reportHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, flexWrap: 'wrap' },
});
