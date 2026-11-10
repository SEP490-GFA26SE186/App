// apps/mobile/src/screens/parent/selling/SellingScreen.tsx
// GĐ D3 – Bán truyện (Web SellingPage). Khối trên cùng theo trạng thái (sellerView): gói chưa cho bán → lối tới Gói & Credit;
// chưa đăng ký / bị từ chối → nộp hồ sơ; chờ duyệt / đã duyệt → sửa hồ sơ; bị khoá → giải thích. Người bán thấy cảnh cáo,
// doanh thu, truyện đã đăng (trạng thái, giọng đọc + tạo lại, cập nhật phiên bản) và đăng truyện mới.
// Mọi thao tác ghi qua Dialog xác nhận, chống bấm đúp (useMutationRunner), lỗi BE hiện câu đã dịch.
// Giọng đọc đang tạo: hỏi lại 10 s/lần, tối đa 30 lần, dừng khi rời màn.
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../../components/ui/HeyCard';
import { HeyButton } from '../../../components/ui/HeyButton';
import { HeyInput } from '../../../components/ui/HeyInput';
import { Badge } from '../../../components/ui/Badge';
import { Icon } from '../../../components/ui/Icon';
import { Sheet } from '../../../components/ui/Sheet';
import { StateView } from '../../../components/ui/StateView';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { StoryCover } from '../../../components/ui/StoryCover';
import { useDialog } from '../../../components/ui/Dialog';
import { useMutationRunner } from '../../../components/management/ManagementUi';
import { EarningsSection } from '../../../components/selling/EarningsSection';
import { StrikesSection } from '../../../components/selling/StrikesSection';
import { ListingSheet } from '../../../components/selling/ListingSheet';
import { Colors } from '../../../theme/colors';
import { Radius, Spacing } from '../../../theme/spacing';
import { Typography } from '../../../theme/typography';
import { ApiError } from '../../../services/apiClient';
import { sellingService } from '../../../services/sellingService';
import { storyService } from '../../../services/storyService';
import { useAsyncResource } from '../../../utils/useAsyncResource';
import { listingPrice } from '../../../utils/market';
import {
  ListingForm,
  NARRATION_POLL_MAX,
  NARRATION_POLL_MS,
  SellerForm,
  canUpdateVersion,
  fieldErrorsFromBe,
  isSeller,
  listingBody,
  listingConfirm,
  listingStatusLabel,
  narrationLabel,
  needsNarrationPoll,
  sellerBody,
  sellerConfirm,
  sellerForm,
  sellerFormErrors,
  sellerView,
  versionPending,
} from '../../../utils/selling';
import type { MyListingDto } from '../../../types/selling';

const SellerSheet: React.FC<{ visible: boolean; initial: SellerForm; editing: boolean; busy: boolean; onSave: (f: SellerForm) => void; onClose: () => void }> = ({
  visible,
  initial,
  editing,
  busy,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<ReturnType<typeof sellerFormErrors>>({});
  useEffect(() => {
    if (!visible) return;
    setForm(initial);
    setErrors({});
  }, [visible]);
  const set = (patch: Partial<SellerForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors({});
  };
  const save = () => {
    const e = sellerFormErrors(form);
    setErrors(e);
    if (!Object.keys(e).length) onSave(form);
  };
  return (
    <Sheet
      visible={visible}
      title={editing ? 'Sửa hồ sơ bán' : 'Đăng ký làm người bán'}
      description="Biệt danh và giới thiệu hiện công khai trên trang người bán ở Chợ truyện."
      onClose={onClose}
      footer={<HeyButton title={editing ? 'Lưu hồ sơ' : 'Gửi hồ sơ'} iconName="checkmark" loading={busy} onPress={save} />}
    >
      <HeyInput label="Biệt danh công khai *" value={form.displayName} onChangeText={(displayName) => set({ displayName })} placeholder="Nhập tên hiển thị trên chợ truyện" error={errors.displayName} />
      <HeyInput label="Giới thiệu (không bắt buộc)" value={form.bio} onChangeText={(bio) => set({ bio })} multiline numberOfLines={3} error={errors.bio} />
      <HeyInput
        label="Chuyên môn / kinh nghiệm (không bắt buộc)"
        value={form.expertise}
        onChangeText={(expertise) => set({ expertise })}
        placeholder="Kinh nghiệm hoặc chuyên môn của ba mẹ"
        error={errors.expertise}
      />
    </Sheet>
  );
};

export const SellingScreen: React.FC<{
  /** Truyện của phụ huynh (data.stories) — chọn truyện đã hoàn tất để đăng bán */
  stories: { id: string; title: string; reviewedAt?: string | null; kind?: string }[];
  onBack: () => void;
  onOpenWallet: () => void;
  onOpenSellerPage: (sellerId: string) => void;
}> = ({ stories, onBack, onOpenWallet, onOpenSellerPage }) => {
  const dialog = useDialog();
  const me = useAsyncResource(() => sellingService.getMySeller(), []);
  const seller = me.data && isSeller(me.data);
  const listings = useAsyncResource(() => (seller ? sellingService.getMyListings() : Promise.resolve([] as MyListingDto[])), [seller]);
  const { run, busy, busyKey } = useMutationRunner(me.reload);
  const [profileOpen, setProfileOpen] = useState(false);
  const [listingOpen, setListingOpen] = useState<MyListingDto | 'new' | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  // Giọng đọc đang tạo → hỏi lại có trần; rời màn / hết việc thì dừng
  const polls = useRef(0);
  useEffect(() => {
    if (!listings.data || !needsNarrationPoll(listings.data) || polls.current >= NARRATION_POLL_MAX) return;
    const t = setTimeout(() => {
      polls.current += 1;
      void listings.reload();
    }, NARRATION_POLL_MS);
    return () => clearTimeout(t);
  }, [listings.data]);

  const view = me.data ? sellerView(me.data) : null;
  const editingProfile = view === 'pending' || view === 'approved';
  const finished = stories.filter((s) => !!s.reviewedAt && (s.kind ?? 'private') === 'private');

  const saveProfile = async (f: SellerForm) => {
    if (busy) return;
    if (!(await dialog.confirm(sellerConfirm(f, editingProfile)))) return;
    const body = sellerBody(f, editingProfile);
    const ok = await run(
      'profile',
      () => (editingProfile ? sellingService.updateMySeller(body) : sellingService.applySeller(body)),
      editingProfile ? 'Đã cập nhật hồ sơ bán' : 'Đã gửi hồ sơ, chuyên gia sẽ duyệt sớm'
    );
    if (ok) {
      setProfileOpen(false);
      void me.reload();
    }
  };

  const submitListing = async (form: ListingForm, tokens: string[]) => {
    if (busy || !listingOpen) return;
    const live = listingOpen === 'new' ? undefined : listingOpen;
    const body = listingBody(form, tokens);
    if (!(await dialog.confirm(listingConfirm(body, live?.title)))) return;
    setServerErrors({});
    const ok = await run(
      'listing',
      async () => {
        try {
          return await (live ? sellingService.createListingVersion(live.id, body) : sellingService.createListing(body));
        } catch (e) {
          if (e instanceof ApiError) setServerErrors(fieldErrorsFromBe(e.errors)); // 422: tô đỏ đúng ô
          throw e;
        }
      },
      live ? 'Đã gửi phiên bản mới cho chuyên gia duyệt — bản đang bán vẫn bán bình thường' : 'Đã gửi truyện cho chuyên gia duyệt'
    );
    if (ok) {
      setListingOpen(null);
      polls.current = 0;
      void listings.reload();
    }
  };

  const retryNarration = async (l: MyListingDto) => {
    if (busy) return;
    const yes = await dialog.confirm({
      title: 'Tạo lại giọng đọc?',
      message: `Hệ thống đọc lại các đoạn lỗi / thiếu của “${l.title}” bằng tên chung. Chuyên gia chỉ duyệt khi giọng đọc xong.`,
      confirmLabel: 'Tạo lại',
    });
    if (!yes) return;
    if (await run(`retry:${l.id}`, () => storyService.retryNarration(l.publishedStoryId), 'Đang tạo lại giọng đọc')) {
      polls.current = 0;
      void listings.reload();
    }
  };

  const s = me.data?.seller;
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Bán truyện" subtitle="Đăng bán truyện ba mẹ đã viết lên Chợ truyện. Tên thật của gia đình được thay bằng tên chung trước khi đăng." onBack={onBack} />
      {me.status === 'loading' && !me.data && <StateView variant="skeleton" title="Đang tải hồ sơ người bán..." />}
      {me.status === 'error' && <StateView variant="error" title="Chưa tải được hồ sơ người bán" description={me.error ?? ''} actionLabel="Thử lại" onAction={() => void me.reload()} />}

      {view && (
        <HeyCard style={styles.card}>
          {view === 'need_plan' && (
            <>
              <Text style={styles.body}>Gói hiện tại chưa cho phép đăng bán. Nâng cấp gói Gia đình để mở tính năng này.</Text>
              <HeyButton title="Xem Gói & Credit" iconName="diamond-outline" onPress={onOpenWallet} />
            </>
          )}
          {(view === 'apply' || view === 'reapply') && (
            <>
              <Text style={styles.strong}>{view === 'reapply' ? 'Hồ sơ chưa được duyệt — nộp lại' : 'Đăng ký làm người bán'}</Text>
              <Text style={styles.muted}>Chuyên gia duyệt hồ sơ trước khi ba mẹ đăng bán truyện.</Text>
              <HeyButton title={view === 'reapply' ? 'Nộp lại hồ sơ' : 'Đăng ký'} iconName="storefront-outline" onPress={() => setProfileOpen(true)} disabled={busy} />
            </>
          )}
          {view === 'pending' && s && (
            <>
              <View style={styles.row}>
                <Icon name="time-outline" size={20} color={Colors.tealStrong} />
                <Text style={[styles.strong, styles.flex1]}>Hồ sơ “{s.displayName}” đang chờ chuyên gia duyệt.</Text>
              </View>
              <HeyButton title="Sửa hồ sơ" iconName="create-outline" variant="tertiary" size="sm" onPress={() => setProfileOpen(true)} disabled={busy} style={styles.selfStart} />
            </>
          )}
          {view === 'approved' && s && (
            <>
              <View style={styles.row}>
                <Icon name="checkmark-circle" size={20} color={Colors.successText} />
                <Text style={[styles.strong, styles.flex1]}>Ba mẹ là người bán: {s.displayName}</Text>
              </View>
              <View style={styles.actions}>
                <HeyButton title="Xem trang công khai" iconName="open-outline" variant="tertiary" size="sm" onPress={() => onOpenSellerPage(s.userId)} />
                <HeyButton title="Sửa hồ sơ" iconName="create-outline" variant="tertiary" size="sm" onPress={() => setProfileOpen(true)} disabled={busy} />
              </View>
            </>
          )}
          {view === 'suspended' && s && (
            <>
              <View style={styles.row}>
                <Icon name="ban-outline" size={20} color={Colors.danger} />
                <Text style={[styles.strong, styles.flex1, styles.danger]}>Tài khoản bán “{s.displayName}” đang bị khoá</Text>
              </View>
              <Text style={styles.body}>
                Do có đủ cảnh cáo còn hiệu lực. Truyện của ba mẹ tạm ẩn khỏi Chợ truyện và chưa đăng bán mới được. Ba mẹ có thể kháng nghị từng cảnh cáo bên dưới;
                doanh thu đã có vẫn rút được.
              </Text>
            </>
          )}
        </HeyCard>
      )}

      {seller && <StrikesSection />}
      {seller && <EarningsSection />}

      {seller && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Truyện đã đăng bán
          </Text>
          <Text style={styles.muted}>Muốn sửa truyện đang bán: sửa truyện gốc, bấm hoàn tất, rồi bấm “Cập nhật phiên bản”.</Text>
          {view === 'approved' && (
            <HeyButton title="Đăng truyện mới" iconName="add" onPress={() => { setServerErrors({}); setListingOpen('new'); }} disabled={busy} />
          )}
          {listings.status === 'loading' && !listings.data && <StateView variant="skeleton" title="Đang tải truyện đã đăng..." />}
          {listings.status === 'error' && (
            <StateView variant="error" title="Chưa tải được truyện đã đăng" description={listings.error ?? ''} actionLabel="Thử lại" onAction={() => void listings.reload()} />
          )}
          {listings.data?.length === 0 && <StateView variant="empty" title="Chưa có truyện nào" description="Đăng một truyện đã hoàn tất để bán trên Chợ truyện." />}
          {listings.data?.map((l, _, all) => {
            const st = listingStatusLabel(l, all);
            const n = narrationLabel(l);
            const prev = l.previousListingId ? all.find((x) => x.id === l.previousListingId) : undefined;
            return (
              <HeyCard key={l.id} style={styles.card}>
                <View style={styles.listingRow}>
                  <StoryCover uri={l.cover?.imageUrl ?? undefined} style={styles.cover} />
                  <View style={styles.flex1}>
                    <Text style={styles.strong}>{l.title}</Text>
                    <View style={styles.tags}>
                      <Badge label={st.label} tone={st.tone} />
                      <Text style={styles.muted}>{listingPrice(l.priceVnd)}</Text>
                    </View>
                  </View>
                </View>
                {!!prev && <Text style={styles.muted}>Phiên bản mới của “{prev.title}”</Text>}
                <Text style={[styles.muted, n.tone === 'broken' && styles.danger, n.tone === 'ok' && styles.ok]}>{n.text}</Text>
                {n.canRetry && (
                  <HeyButton title="Tạo lại giọng đọc" iconName="refresh" variant="danger" size="sm" onPress={() => void retryNarration(l)} loading={busyKey === `retry:${l.id}`} disabled={busy} style={styles.selfStart} />
                )}
                {!!l.lastDecision?.comment && <Text style={styles.body}>Chuyên gia: {l.lastDecision.comment}</Text>}
                {versionPending(l, all) && <Text style={styles.muted}>Đang có phiên bản mới chờ duyệt — bản này vẫn bán bình thường.</Text>}
                {canUpdateVersion(l, all) && (
                  <HeyButton
                    title="Cập nhật phiên bản"
                    iconName="sync-outline"
                    variant="tertiary"
                    size="sm"
                    onPress={() => { setServerErrors({}); setListingOpen(l); }}
                    disabled={busy}
                    accessibilityLabel={`Cập nhật phiên bản ${l.title}`}
                    style={styles.selfStart}
                  />
                )}
              </HeyCard>
            );
          })}
        </View>
      )}

      <SellerSheet visible={profileOpen} initial={sellerForm(editingProfile ? s : null)} editing={editingProfile} busy={busyKey === 'profile'} onSave={(f) => void saveProfile(f)} onClose={() => setProfileOpen(false)} />
      <ListingSheet
        visible={!!listingOpen}
        stories={finished}
        live={listingOpen && listingOpen !== 'new' ? listingOpen : undefined}
        busy={busyKey === 'listing'}
        serverErrors={serverErrors}
        onSubmit={(f, tokens) => void submitListing(f, tokens)}
        onClose={() => setListingOpen(null)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.sm },
  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.md },
  card: { gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  listingRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  cover: { width: 64, height: 64, borderRadius: Radius.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  flex1: { flex: 1 },
  strong: { ...Typography.bodyStrong, color: Colors.text },
  body: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  danger: { color: Colors.danger },
  ok: { color: Colors.successText },
  selfStart: { alignSelf: 'flex-start' },
});
