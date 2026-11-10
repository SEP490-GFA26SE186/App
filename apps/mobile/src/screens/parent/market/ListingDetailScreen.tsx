// apps/mobile/src/screens/parent/market/ListingDetailScreen.tsx
// GĐ D2 – Chi tiết truyện đang bán (Web ListingDetailPage + PurchaseResultPage): nhãn, mô tả, xem trước trang 1, khung người bán,
// nút theo trạng thái sở hữu, báo cáo truyện, đánh giá.
// Mua: Dialog → POST /market/checkout qua `checkoutAndOpen` (D1). 0đ: nhận ngay, không mở trình duyệt. > 0đ: mở payOS; payOS trả
// ba mẹ về Web nên khi app quay lại `active` hoặc bấm "Kiểm tra thanh toán" thì hỏi GET /payments/orders/:id MỘT lần (`watchAppReturn`).
// Đã có truyện: đưa lên tủ sách từng bé (GET /bookshelf/check, POST/DELETE /bookshelf) — BE không cho phụ huynh đọc bản đăng bán
// ngoài tủ sách bé, nên "Đọc" là vào Chế độ Bé qua đường sẵn có.
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../../components/ui/HeyCard';
import { HeyButton } from '../../../components/ui/HeyButton';
import { Badge } from '../../../components/ui/Badge';
import { Icon } from '../../../components/ui/Icon';
import { StateView } from '../../../components/ui/StateView';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { StoryCover } from '../../../components/ui/StoryCover';
import { useDialog } from '../../../components/ui/Dialog';
import { useToast } from '../../../components/ui/Toast';
import { useMutationRunner } from '../../../components/management/ManagementUi';
import { ReportSheet } from '../../../components/market/MarketUi';
import { ListingReviews } from '../../../components/market/ListingReviews';
import { Colors } from '../../../theme/colors';
import { Radius, Spacing, Touch } from '../../../theme/spacing';
import { Typography } from '../../../theme/typography';
import { focusRing } from '../../../theme/focus';
import { CASEL } from '../../../constants/eq';
import { marketService } from '../../../services/marketService';
import { billingService } from '../../../services/billingService';
import { storyService } from '../../../services/storyService';
import { useAsyncResource } from '../../../utils/useAsyncResource';
import { formatNumber, money } from '../../../utils/format';
import { checkoutAndOpen, watchAppReturn } from '../../../utils/billing';
import { buyConfirm, listingAction, listingPrice, purchaseView, ratingLabel, reportBody, reportConfirm, reportOutcome } from '../../../utils/market';
import type { OrderDto } from '../../../types/api';
import type { ListingDetailDto } from '../../../types/market';

/** Truyện đã có: đưa lên / gỡ khỏi tủ sách từng bé (Web OwnedShelf) */
const OwnedShelf: React.FC<{ storyId: string }> = ({ storyId }) => {
  const dialog = useDialog();
  const toast = useToast();
  const res = useAsyncResource(() => storyService.checkShelf(storyId), [storyId]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toggle = async (c: { childId: string; name: string; inBookshelf: boolean }) => {
    if (busyId) return;
    if (c.inBookshelf) {
      const ok = await dialog.confirm({
        title: `Gỡ truyện khỏi tủ sách của ${c.name}?`,
        message: 'Bé sẽ không thấy truyện này trong Chế độ Bé nữa. Ba mẹ vẫn có truyện và đưa lên lại được.',
        confirmLabel: 'Gỡ khỏi tủ',
        destructive: true,
      });
      if (!ok) return;
    }
    setBusyId(c.childId);
    try {
      if (c.inBookshelf) await storyService.removeFromShelf(c.childId, storyId);
      else await storyService.addToShelf(c.childId, storyId);
      toast.show(c.inBookshelf ? `Đã bỏ khỏi giá của ${c.name}` : `Đã đưa lên giá của ${c.name}`, 'success');
    } catch (e: any) {
      toast.show(e?.message || 'Không thực hiện được, vui lòng thử lại.', 'danger');
    } finally {
      setBusyId(null);
      void res.reload();
    }
  };
  if (res.status === 'loading' && !res.data) return <StateView variant="loading" title="Đang kiểm tra tủ sách..." />;
  if (res.status === 'error' || !res.data)
    return <StateView variant="error" title="Chưa kiểm tra được tủ sách" description={res.error ?? ''} actionLabel="Thử lại" onAction={() => void res.reload()} />;
  if (!res.data.children.length) return <Text style={styles.muted}>Ba mẹ thêm hồ sơ bé để đưa truyện lên giá sách.</Text>;
  return (
    <>
      {res.data.children.map((c) => (
        <View key={c.childId} style={styles.shelfRow}>
          <Text style={[styles.body, styles.flex1]} numberOfLines={1}>
            {c.name}
          </Text>
          <Badge label={c.inBookshelf ? 'Đã có trên tủ' : 'Chưa có trên tủ'} tone={c.inBookshelf ? 'success' : 'neutral'} />
          <HeyButton
            title={c.inBookshelf ? 'Gỡ' : 'Thêm'}
            iconName={c.inBookshelf ? 'trash-outline' : 'bookmark-outline'}
            variant="tertiary"
            size="sm"
            loading={busyId === c.childId}
            disabled={!!busyId}
            accessibilityLabel={c.inBookshelf ? `Gỡ truyện khỏi tủ sách của ${c.name}` : `Đưa truyện lên tủ sách của ${c.name}`}
            onPress={() => void toggle(c)}
          />
        </View>
      ))}
    </>
  );
};

export const ListingDetailScreen: React.FC<{
  listingId: string;
  onBack: () => void;
  onOpenSeller: (sellerId: string) => void;
  onOpenKidMode: () => void;
}> = ({ listingId, onBack, onOpenSeller, onOpenKidMode }) => {
  const dialog = useDialog();
  const res = useAsyncResource(() => marketService.getListing(listingId), [listingId]);
  const { run, busy, busyKey } = useMutationRunner(res.reload);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  // Đơn đang chờ thanh toán (chỉ trong state của màn) + kết quả lần kiểm tra gần nhất
  const [pending, setPending] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [check, setCheck] = useState<{ checking: boolean; error: string | null }>({ checking: false, error: null });
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );
  const l = res.data;

  const buy = async (listing: ListingDetailDto) => {
    if (busy || pending) return;
    if (!(await dialog.confirm(buyConfirm(listing)))) return;
    const out: { r?: { order: OrderDto; opened: boolean } } = {};
    const ok = await run(
      'buy',
      async () => (out.r = await checkoutAndOpen(listing.id, marketService.checkoutListing, Linking)),
      (r) => (r.opened ? 'Đã mở trang thanh toán payOS' : 'Đã nhận truyện — đưa lên giá sách cho bé nhé!')
    );
    if (!ok || !out.r || !alive.current) return;
    setCheck({ checking: false, error: null });
    setOrder(out.r.order);
    if (out.r.opened) setPending(out.r.order.id);
    else void res.reload(); // 0đ: đã có truyện ngay
  };

  // Hỏi BE trạng thái đơn đang chờ MỘT lần (BE tự hỏi payOS); xong thì tải lại truyện (owned)
  const checkingRef = useRef(false);
  const checkOrder = async () => {
    const orderId = pending;
    if (!orderId || checkingRef.current) return;
    checkingRef.current = true;
    setCheck({ checking: true, error: null });
    try {
      const o = await billingService.getOrder(orderId);
      if (!alive.current) return;
      setOrder(o);
      setCheck({ checking: false, error: null });
      if (o.status !== 'pending') {
        setPending(null);
        void res.reload();
      }
    } catch (e: any) {
      if (alive.current) setCheck({ checking: false, error: e?.message || 'Không kiểm tra được đơn thanh toán.' });
    } finally {
      checkingRef.current = false;
    }
  };
  const checkRef = useRef(checkOrder);
  checkRef.current = checkOrder;
  useEffect(() => watchAppReturn(AppState, () => void checkRef.current()), []);

  const report = async (category: string, description: string) => {
    if (!l || busy) return;
    if (!(await dialog.confirm(reportConfirm('listing', category)))) return;
    const ok = await run('report', () => reportOutcome(marketService.reportListing(l.id, reportBody(category, description))), (r) =>
      r === 'duplicate' ? 'Ba mẹ đã báo cáo truyện này rồi. Kiểm duyệt viên đang xem xét.' : 'Cảm ơn ba mẹ! Kiểm duyệt viên sẽ xem lại truyện này.'
    );
    if (ok && alive.current) {
      setReported(true);
      setReportOpen(false);
    }
  };

  if (!l) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Chợ truyện" onBack={onBack} />
        {res.status === 'error' ? (
          <StateView variant="error" title="Không tải được truyện" description={res.error ?? ''} actionLabel="Thử lại" onAction={() => void res.reload()} />
        ) : (
          <StateView variant="skeleton" title="Đang tải truyện..." />
        )}
      </ScrollView>
    );
  }

  const action = listingAction(l);
  const view = order ? purchaseView(order.status) : null;
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Chợ truyện" onBack={onBack} />
      <StoryCover uri={l.cover?.imageUrl ?? undefined} style={styles.cover} />
      <View style={styles.tags}>
        {!!l.topic && <Badge label={CASEL[l.topic.competency]?.label ?? l.topic.title} tone="info" />}
        {!!l.topic && <Badge label={`${l.topic.ageMin}–${l.topic.ageMax} tuổi`} tone="neutral" />}
        {l.hasAiContent && <Badge label="AI hỗ trợ" tone="neutral" />}
        <Badge label={l.hasNarration ? 'Có giọng đọc' : 'Chỉ có chữ — ba mẹ đọc cùng bé'} tone={l.hasNarration ? 'success' : 'neutral'} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {l.title}
      </Text>
      {!!l.description && <Text style={styles.body}>{l.description}</Text>}
      <Text style={styles.muted}>
        {l.topic ? `Bài học: ${l.topic.title} • ` : ''}
        {l.totalPages} trang • {l.checkpointCount} điểm dừng • {formatNumber(l.purchaseCount)} lượt mua
      </Text>
      <Text style={styles.price}>{listingPrice(l.priceVnd)}</Text>

      <Pressable
        onPress={() => onOpenSeller(l.seller.id)}
        accessibilityRole="button"
        accessibilityLabel={`Xem hồ sơ người bán ${l.seller.displayName}`}
        style={(s) => [styles.seller, s.pressed && styles.pressed, focusRing(s)]}
      >
        <Icon name="storefront-outline" size={24} color={Colors.brandInk} />
        <View style={styles.flex1}>
          <Text style={styles.muted}>Người bán</Text>
          <Text style={styles.strong} numberOfLines={1}>
            {l.seller.displayName}
          </Text>
          <Text style={styles.muted}>
            {ratingLabel(l.seller.ratingAvg)} • {formatNumber(l.seller.totalSales ?? 0)} lượt bán
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
      </Pressable>

      {!!l.preview && (
        <HeyCard variant="muted" style={styles.card}>
          <Text style={styles.muted}>Trang 1</Text>
          <Text style={styles.body}>{l.preview}</Text>
        </HeyCard>
      )}
      <View style={styles.note}>
        <Icon name="shield-checkmark-outline" size={18} color={Colors.successText} />
        <Text style={[styles.muted, styles.flex1]}>
          Chuyên gia sư phạm đã duyệt từng trang theo checklist sư phạm. Truyện dùng tên nhân vật chung, có thể đọc ngay trên giá sách của bé.
        </Text>
      </View>

      {!!view && order && (
        <HeyCard style={styles.card}>
          <View style={styles.rowCenter} accessible accessibilityLiveRegion="polite">
            <Icon
              name={view.tone === 'success' ? 'checkmark-circle' : view.tone === 'danger' ? 'close-circle' : 'time-outline'}
              size={28}
              color={view.tone === 'success' ? Colors.successText : view.tone === 'danger' ? Colors.danger : Colors.tealStrong}
            />
            <Text style={[styles.strong, styles.flex1]}>{view.title}</Text>
          </View>
          <Text style={styles.body}>{view.text}</Text>
          <Text style={styles.muted}>
            {l.title} • {money(order.totalVnd)}
            {order.payosOrderCode != null ? ` • mã ${order.payosOrderCode}` : ''}
          </Text>
          {!!check.error && <Text style={styles.error}>{check.error}</Text>}
          {view.final ? (
            <HeyButton title="Đóng" variant="tertiary" size="sm" onPress={() => setOrder(null)} style={styles.selfStart} />
          ) : (
            <HeyButton title="Kiểm tra thanh toán" iconName="refresh" onPress={() => void checkOrder()} loading={check.checking} disabled={check.checking} />
          )}
        </HeyCard>
      )}

      {action.kind === 'mine' && <Text style={styles.strong}>{action.label}</Text>}
      {action.kind === 'owned' && (
        <HeyCard style={styles.card}>
          <View style={styles.rowCenter}>
            <Icon name="checkmark-circle" size={20} color={Colors.successText} />
            <Text style={styles.strong}>Ba mẹ đã có truyện này</Text>
          </View>
          <Text style={styles.muted}>Đưa truyện lên tủ sách của bé, rồi vào Chế độ Bé để bé đọc.</Text>
          <OwnedShelf storyId={l.publishedStoryId} />
          <HeyButton title={action.label} iconName="happy-outline" onPress={onOpenKidMode} />
        </HeyCard>
      )}
      {(action.kind === 'buy' || action.kind === 'claim') && (
        <HeyButton
          title={action.label}
          iconName={action.kind === 'buy' ? 'cart-outline' : 'gift-outline'}
          size="lg"
          onPress={() => void buy(l)}
          loading={busyKey === 'buy'}
          disabled={busy || !!pending}
        />
      )}

      {!l.isMine &&
        (reported ? (
          <Text style={styles.muted}>Ba mẹ đã báo cáo truyện này.</Text>
        ) : (
          <HeyButton title="Báo cáo nội dung không phù hợp" iconName="flag-outline" variant="ghost" size="sm" onPress={() => setReportOpen(true)} disabled={busy} style={styles.selfStart} />
        ))}

      <ListingReviews listing={l} onChanged={() => void res.reload()} />

      <ReportSheet visible={reportOpen} title="Báo cáo truyện" busy={busyKey === 'report'} onSubmit={(c, t) => void report(c, t)} onClose={() => setReportOpen(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.sm },
  cover: { width: '100%', aspectRatio: 1, borderRadius: Radius.lg },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  title: { ...Typography.title, color: Colors.text },
  price: { ...Typography.heading, color: Colors.text },
  body: { ...Typography.body, fontSize: 15, color: Colors.text },
  strong: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  error: { ...Typography.caption, color: Colors.danger },
  card: { gap: Spacing.sm },
  flex1: { flex: 1 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  seller: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.outline,
    minHeight: Touch.min,
  },
  pressed: { opacity: 0.8 },
  shelfRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: Touch.min },
  selfStart: { alignSelf: 'flex-start' },
});
