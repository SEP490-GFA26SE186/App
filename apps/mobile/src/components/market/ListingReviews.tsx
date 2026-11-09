// apps/mobile/src/components/market/ListingReviews.tsx
// GĐ D2 – Đánh giá truyện (Web ListingReviews): phân bố sao, danh sách, viết / sửa đánh giá của mình khi BE cho (`canReview`),
// báo cáo đánh giá của người khác. Gửi đánh giá / báo cáo LUÔN qua Dialog xác nhận, chống bấm đúp, lỗi BE hiện câu đã dịch.
// Trả lời đánh giá (người bán) thuộc GĐ D3.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../ui/HeyCard';
import { HeyButton } from '../ui/HeyButton';
import { HeyChip } from '../ui/HeyChip';
import { HeyInput } from '../ui/HeyInput';
import { HeyProgressBar } from '../ui/HeyProgressBar';
import { Badge } from '../ui/Badge';
import { Sheet } from '../ui/Sheet';
import { StateView } from '../ui/StateView';
import { useDialog } from '../ui/Dialog';
import { useMutationRunner } from '../management/ManagementUi';
import { ReportSheet, StarPicker, Stars } from './MarketUi';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { marketService } from '../../services/marketService';
import { useAsyncResource } from '../../utils/useAsyncResource';
import { formatDate } from '../../utils/format';
import {
  REVIEW_COMMENT_MAX,
  REVIEW_TAG_LABELS,
  ReviewForm,
  distributionRows,
  reportBody,
  reportConfirm,
  reviewBody,
  reviewConfirm,
  reviewFormError,
  reviewHint,
} from '../../utils/market';
import type { ListingDetailDto, ReviewDto, ReviewTag } from '../../types/market';

export const ListingReviews: React.FC<{ listing: ListingDetailDto; onChanged: () => void }> = ({ listing, onChanged }) => {
  const dialog = useDialog();
  const res = useAsyncResource(() => marketService.getReviews(listing.id), [listing.id]);
  const { run, busy } = useMutationRunner(res.reload);
  const [form, setForm] = useState<ReviewForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [reporting, setReporting] = useState<ReviewDto | null>(null);
  const d = res.data;

  const openForm = () => {
    const mine = d?.myReview;
    setForm({ rating: mine?.rating ?? 0, comment: mine?.comment ?? '', tags: mine?.tags ?? [] });
    setFormError(null);
  };

  const save = async () => {
    if (!form || !d || busy) return;
    const e = reviewFormError(form);
    setFormError(e);
    if (e) return;
    const editing = !!d.myReview;
    if (!(await dialog.confirm(reviewConfirm(listing.title, form, editing)))) return;
    const ok = await run('review', () => marketService.saveReview(listing.id, reviewBody(form, d.tags)), editing ? 'Đã cập nhật đánh giá' : 'Cảm ơn ba mẹ đã đánh giá!');
    if (ok) {
      setForm(null);
      void res.reload();
      onChanged(); // điểm trung bình của truyện đổi
    }
  };

  const report = async (category: string, description: string) => {
    if (!reporting || busy) return;
    if (!(await dialog.confirm(reportConfirm('review', category)))) return;
    if (await run(`report:${reporting.id}`, () => marketService.reportReview(reporting.id, reportBody(category, description)), 'Đã gửi báo cáo, kiểm duyệt viên sẽ xem xét')) {
      setReporting(null);
    }
  };

  const toggleTag = (t: ReviewTag) =>
    setForm((f) => f && { ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] });

  const hint = d ? reviewHint(d, listing.owned) : null;
  const total = d ? distributionRows(d.distribution).reduce((n, r) => n + r.count, 0) : 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Đánh giá
      </Text>
      {res.status === 'loading' && !d && <StateView variant="skeleton" title="Đang tải đánh giá..." />}
      {res.status === 'error' && <StateView variant="error" title="Chưa tải được đánh giá" description={res.error ?? ''} actionLabel="Thử lại" onAction={() => void res.reload()} />}
      {d && (
        <>
          <HeyCard style={styles.card}>
            {total > 0 ? (
              <>
                <View style={styles.row}>
                  <Stars value={Math.round(listing.ratingAvg)} size={18} />
                  <Text style={styles.strong}>{listing.ratingAvg.toFixed(1)}</Text>
                  <Text style={styles.muted}>({total} đánh giá)</Text>
                </View>
                {distributionRows(d.distribution).map((r) => (
                  <View key={r.stars} style={styles.row} accessible accessibilityLabel={`${r.stars} sao: ${r.count} đánh giá`}>
                    <Text style={[styles.muted, styles.starCol]}>{r.stars} sao</Text>
                    <View style={styles.flex1}>
                      <HeyProgressBar progress={r.ratio * 100} color={Colors.gold} height={8} />
                    </View>
                    <Text style={[styles.muted, styles.countCol]}>{r.count}</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.muted}>Chưa có đánh giá</Text>
            )}
          </HeyCard>

          {!!hint && <Text style={d.myReview?.hidden ? styles.error : styles.muted}>{hint}</Text>}
          {d.canReview && !d.myReview?.hidden && (
            <View style={styles.row}>
              {d.myReview && <Text style={[styles.body, styles.flex1]}>Ba mẹ đã đánh giá {d.myReview.rating} sao.</Text>}
              <HeyButton title={d.myReview ? 'Sửa đánh giá' : 'Viết đánh giá'} iconName="create-outline" variant={d.myReview ? 'tertiary' : 'primary'} size="sm" onPress={openForm} disabled={busy} />
            </View>
          )}

          {d.reviews.map((r) => (
            <HeyCard key={r.id} style={styles.card}>
              <View style={styles.row}>
                <Stars value={r.rating} />
                <Text style={[styles.strong, styles.flex1]} numberOfLines={1}>
                  {r.author}
                </Text>
                <Text style={styles.muted}>{formatDate(r.updatedAt)}</Text>
              </View>
              {!!r.tags.length && (
                <View style={styles.tags}>
                  {r.tags.map((t) => (
                    <Badge key={t} label={REVIEW_TAG_LABELS[t] ?? t} tone="success" />
                  ))}
                </View>
              )}
              {!!r.comment && <Text style={styles.body}>{r.comment}</Text>}
              {!!r.sellerReply && (
                <Text style={styles.reply}>
                  <Text style={styles.strong}>Người bán: </Text>
                  {r.sellerReply}
                </Text>
              )}
              {!r.mine && !d.isSeller && (
                <HeyButton
                  title="Báo cáo"
                  iconName="flag-outline"
                  variant="ghost"
                  size="sm"
                  onPress={() => setReporting(r)}
                  disabled={busy}
                  accessibilityLabel={`Báo cáo đánh giá của ${r.author}`}
                  style={styles.selfStart}
                />
              )}
            </HeyCard>
          ))}
        </>
      )}

      <Sheet
        visible={!!form}
        title={d?.myReview ? 'Sửa đánh giá' : 'Viết đánh giá'}
        description={listing.title}
        onClose={() => setForm(null)}
        footer={<HeyButton title={d?.myReview ? 'Lưu đánh giá' : 'Gửi đánh giá'} iconName="checkmark" loading={busy} onPress={() => void save()} />}
      >
        {form && (
          <>
            <StarPicker value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
            <View style={styles.tags}>
              {(d?.tags ?? []).map((t) => (
                <HeyChip key={t} label={REVIEW_TAG_LABELS[t] ?? t} selected={form.tags.includes(t)} onPress={() => toggleTag(t)} />
              ))}
            </View>
            <HeyInput
              label="Nhận xét (không bắt buộc)"
              value={form.comment}
              onChangeText={(comment) => setForm({ ...form, comment })}
              placeholder="Bé thích đoạn nào? Truyện giúp bé điều gì?"
              multiline
              numberOfLines={3}
              hint={`Tối đa ${REVIEW_COMMENT_MAX} ký tự.`}
            />
            {!!formError && (
              <Text style={styles.error} accessibilityRole="alert">
                {formError}
              </Text>
            )}
          </>
        )}
      </Sheet>
      <ReportSheet
        visible={!!reporting}
        title="Báo cáo đánh giá"
        description={reporting ? `Đánh giá của ${reporting.author}. Thông tin của ba mẹ không được gửi cho người viết.` : undefined}
        busy={busy}
        onSubmit={(c, t) => void report(c, t)}
        onClose={() => setReporting(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.md },
  card: { gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex1: { flex: 1 },
  starCol: { width: 44 },
  countCol: { width: 28, textAlign: 'right' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginVertical: Spacing.xs },
  strong: { ...Typography.bodyStrong, color: Colors.text },
  body: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  error: { ...Typography.caption, color: Colors.danger },
  reply: { ...Typography.label, color: Colors.text, backgroundColor: Colors.surfaceMuted, padding: Spacing.sm, borderRadius: Radius.md },
  selfStart: { alignSelf: 'flex-start' },
});
