// apps/mobile/src/screens/parent/WalletScreen.tsx
// B10/C12 – Gói dịch vụ & Credit (Web: BillingPage). Dữ liệu từ BE: số dư (GET /auth/me), gói hiện tại + mức dùng
// (GET /subscriptions/me), danh sách gói (GET /plans), lịch sử credit (GET /subscriptions/me/credit-history).
// Không có nạp credit lẻ (BE không có endpoint), không rút tiền.
// Phase 2: "Xem chi tiết" trên thẻ gói mở sheet chỉ đọc từ GET /plans/:id.
// GĐ D1: nút mua / gia hạn / chuyển gói theo luật Web → Dialog xác nhận → POST /payments/plans/checkout → mở trang payOS bằng
// Linking. payOS trả ba mẹ về Web (BE chưa nhận returnUrl của app) nên khi app quay lại `active` hoặc bấm "Kiểm tra thanh toán"
// thì hỏi GET /payments/orders/:id MỘT lần (không polling); xong thì tải lại gói + credit. Lịch sử thanh toán + hoàn tiền bên dưới.
// R8: thẻ số dư lớn, mức dùng có thanh, gói dạng thẻ, lịch sử nhóm theo ngày (cộng/trừ có dấu, không chỉ dựa vào màu).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking, View, Text, ScrollView, StyleSheet } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyProgressBar } from '../../components/ui/HeyProgressBar';
import { Badge } from '../../components/ui/Badge';
import { Icon, IconName } from '../../components/ui/Icon';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Sheet } from '../../components/ui/Sheet';
import { useDialog } from '../../components/ui/Dialog';
import { useMutationRunner } from '../../components/management/ManagementUi';
import { PaymentHistory } from '../../components/parent/PaymentHistory';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { SessionUser } from '../../types/sessionUser';
import { billingService } from '../../services/billingService';
import { useAsyncResource } from '../../utils/useAsyncResource';
import { PAYMENT_NOTE, PlanAction, checkoutAndOpen, checkoutConfirm, orderView, planAction, watchAppReturn } from '../../utils/billing';
import { money as formatMoney } from '../../utils/format';
import type { CreditEntryDto, OrderDto, PlanDto } from '../../types/api';

interface WalletScreenProps {
  currentUser: SessionUser;
  /** Tải lại số dư (GET /auth/me) */
  onRefreshWallet: () => void;
  /** Ví không còn là tab (R3): mở từ pill credit hoặc Hồ sơ nên có nút quay lại */
  onBack?: () => void;
}

const AI_LABELS: Record<string, string> = {
  story_text: 'AI viết truyện',
  character_portrait: 'Vẽ chân dung',
  scene_image: 'Vẽ tranh cảnh',
  narration: 'Giọng đọc',
};

/** Một dòng sổ cái → câu dễ hiểu (khớp Web CreditHistory) */
const describeEntry = (e: CreditEntryDto): string => {
  const c = e.context;
  if (e.entryType === 'credit_grant') return c?.kind === 'plan' ? `Cấp credit tháng — ${c.planName}` : 'Cấp credit';
  if (e.entryType === 'credit_expire') return 'Credit tháng cũ hết hạn';
  const what = c?.kind === 'ai' ? AI_LABELS[c.requestType] ?? 'Dùng AI' : 'Dùng AI';
  const target = c?.kind === 'ai' ? (c.storyTitle ? ` “${c.storyTitle}”` : c.characterName ? ` — ${c.characterName}` : '') : '';
  if (e.entryType === 'credit_hold') return `${what}${target}`;
  if (e.entryType === 'credit_release') return `Hoàn credit: ${what.toLowerCase()}${target} không thành công`;
  return what;
};

const money = (v: string | number): string => {
  const n = Number(v);
  return n === 0 ? 'Miễn phí' : `${n.toLocaleString('vi-VN')}đ`;
};
const day = (iso: string | null): string => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '');

const Line: React.FC<{ icon: IconName; text: string }> = ({ icon, text }) => (
  <View style={styles.line}>
    <Icon name={icon} size={18} color={Colors.textMuted} />
    <Text style={styles.text}>{text}</Text>
  </View>
);

/** Chi tiết gói: chỉ trường BE trả cho GET /plans/:id */
const PlanDetailSheet: React.FC<{ planId: string | null; onClose: () => void }> = ({ planId, onClose }) => {
  const res = useAsyncResource(() => (planId ? billingService.getPlan(planId) : Promise.resolve(null)), [planId]);
  const p = res.data;
  return (
    <Sheet visible={!!planId} title={p?.name ?? 'Chi tiết gói'} description="Thông tin gói."onClose={onClose}>
      <View style={styles.planDetail}>
        {res.status === 'loading' ? (
          <StateView variant="loading" title="Đang tải gói..." />
        ) : res.status === 'error' || !p ? (
          <StateView variant="error" title="Không tải được gói" description={res.error ?? ''} actionLabel="Thử lại" onAction={() => void res.reload()} />
        ) : (
          <>
            <Text style={styles.price}>
              {money(p.priceVnd)}
              {p.durationMonths ? ` / ${p.durationMonths} tháng` : ''}
            </Text>
            <Line icon="pricetag-outline" text={`Mã gói: ${p.code}`} />
            <Line icon="diamond-outline" text={`${p.creditsPerMonth} credit mỗi tháng`} />
            <Line icon="happy-outline" text={`Tối đa ${p.maxChildren} bé`} />
            <Line icon="people-outline" text={`Tối đa ${p.maxCharacters} nhân vật`} />
            <Line icon="storefront-outline" text={p.canSell ? 'Được đăng bán truyện' : 'Không gồm quyền đăng bán truyện'} />
            <Line icon="information-circle-outline" text={p.isActive ? 'Gói đang được cung cấp' : 'Gói đã ngừng cung cấp'} />
          </>
        )}
      </View>
    </Sheet>
  );
};

const PlanRow: React.FC<{ plan: PlanDto; current: boolean; onOpen?: () => void; action?: PlanAction; busy?: boolean; locked?: boolean; onBuy?: () => void }> = ({
  plan,
  current,
  onOpen,
  action,
  busy,
  locked,
  onBuy,
}) => (
  <HeyCard variant={current ? 'info' : 'surface'} style={styles.planCard}>
    <View style={styles.planTop}>
      <Text style={styles.cardTitle}>{plan.name}</Text>
      {current && <Badge label="Đang dùng" tone="success" />}
    </View>
    <Text style={styles.price}>
      {money(plan.priceVnd)}
      {plan.durationMonths ? ` / ${plan.durationMonths} tháng` : ''}
    </Text>
    <Line icon="diamond-outline" text={`${plan.creditsPerMonth} credit mỗi tháng`} />
    <Line icon="happy-outline" text={`Tối đa ${plan.maxChildren} bé`} />
    <Line icon="people-outline" text={`Tối đa ${plan.maxCharacters} nhân vật`} />
    {plan.canSell != null && <Line icon="storefront-outline" text={plan.canSell ? 'Được đăng bán truyện trên Chợ truyện' : 'Chưa đăng bán truyện'} />}
    {!!action && !!onBuy && (
      <HeyButton
        title={action.label}
        iconName={action.kind === 'current' ? 'checkmark' : action.kind === 'renew' ? 'refresh' : 'card-outline'}
        variant={action.kind === 'current' ? 'outline' : 'primary'}
        size="md"
        onPress={onBuy}
        loading={busy}
        disabled={action.disabled || locked}
        accessibilityLabel={`${action.label} — gói ${plan.name}`}
      />
    )}
    {!!action?.newExpiry && <Text style={styles.expiry}>Hết hạn mới: {action.newExpiry} — không mất ngày còn lại</Text>}
    {!!onOpen && (
      <HeyButton title="Xem chi tiết" iconName="information-circle-outline" variant="tertiary" size="sm" onPress={onOpen} accessibilityLabel={`Xem chi tiết gói ${plan.name}`} style={styles.planBtn} />
    )}
  </HeyCard>
);

/** Kết quả đơn vừa tạo / vừa kiểm tra (Web BillingResultPage) */
const OrderResultCard: React.FC<{
  result: { order: OrderDto; planName: string };
  checking: boolean;
  error: string | null;
  onCheck: () => void;
  onClose: () => void;
}> = ({ result, checking, error, onCheck, onClose }) => {
  const v = orderView(result.order.status);
  const color = v.tone === 'success' ? Colors.successText : v.tone === 'danger' ? Colors.danger : Colors.tealStrong;
  return (
    <HeyCard style={styles.card}>
      <View style={styles.planTop} accessible accessibilityLiveRegion="polite">
        <Icon name={v.tone === 'success' ? 'checkmark-circle' : v.tone === 'danger' ? 'close-circle' : 'time-outline'} size={28} color={color} />
        <Text style={[styles.cardTitle, styles.flex1]}>{v.title}</Text>
      </View>
      <Text style={styles.text}>{v.text}</Text>
      <Text style={styles.hint}>
        {result.planName} • {formatMoney(result.order.totalVnd)}
        {result.order.payosOrderCode != null ? ` • mã ${result.order.payosOrderCode}` : ''}
      </Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {v.final ? (
        <HeyButton title="Đóng" variant="tertiary" size="sm" onPress={onClose} style={styles.refresh} />
      ) : (
        <HeyButton title="Kiểm tra thanh toán" iconName="refresh" size="md" onPress={onCheck} loading={checking} disabled={checking} />
      )}
    </HeyCard>
  );
};

const UsageBar: React.FC<{ label: string; used: number; max: number }> = ({ label, used, max }) => (
  <View style={styles.usage} accessible accessibilityLabel={`${label}: ${used} trên ${max}`}>
    <View style={styles.usageTop}>
      <Text style={styles.text}>{label}</Text>
      <Text style={styles.usageNum}>
        {used}/{max}
      </Text>
    </View>
    <HeyProgressBar progress={max > 0 ? (used / max) * 100 : 0} color={Colors.tealStrong} height={8} />
  </View>
);

export const WalletScreen: React.FC<WalletScreenProps> = ({ currentUser, onRefreshWallet, onBack }) => {
  const sub = useAsyncResource(() => billingService.getSubscription(), []);
  const plans = useAsyncResource(() => billingService.getPlans(), []);
  const [planId, setPlanId] = useState<string | null>(null);
  const dialog = useDialog();
  const { run, busy, busyKey } = useMutationRunner();
  // Đơn đang chờ thanh toán (chỉ trong state của màn) + kết quả lần kiểm tra gần nhất
  const [pending, setPending] = useState<{ orderId: string; planName: string } | null>(null);
  const [result, setResult] = useState<{ order: OrderDto; planName: string } | null>(null);
  const [checkState, setCheckState] = useState<{ checking: boolean; error: string | null }>({ checking: false, error: null });
  const [paymentsKey, setPaymentsKey] = useState(0);

  // Lịch sử credit: trang đầu + "Xem thêm"
  const [entries, setEntries] = useState<CreditEntryDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [histStatus, setHistStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [histError, setHistError] = useState('');
  const loadingRef = useRef(false);
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );

  const loadHistory = async (next: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setHistStatus('loading');
    try {
      const res = await billingService.getCreditHistory(next);
      if (!alive.current) return;
      setEntries((prev) => (next === 1 ? res.entries : [...prev, ...res.entries]));
      setPage(next);
      setTotalPages(res.pagination.totalPages);
      setHistStatus('ready');
    } catch (e: any) {
      if (!alive.current) return;
      setHistError(e?.message || 'Không tải được lịch sử credit.');
      setHistStatus('error');
    } finally {
      loadingRef.current = false;
    }
  };
  useEffect(() => {
    void loadHistory(1);
  }, []);

  const refreshAll = () => {
    onRefreshWallet();
    void sub.reload();
    void plans.reload();
    void loadHistory(1);
    setPaymentsKey((k) => k + 1);
  };

  // Mua / gia hạn / chuyển gói: Dialog trước, rồi tạo đơn và mở payOS (gói 0đ: BE đổi gói ngay)
  const buy = async (plan: PlanDto) => {
    const s0 = sub.data;
    if (busy || pending || !s0 || !plan.id) return;
    const action = planAction(plan, s0);
    if (action.disabled) return;
    if (!(await dialog.confirm(checkoutConfirm(plan, action, s0)))) return;
    const out: { r?: { order: OrderDto; opened: boolean } } = {};
    const ok = await run(
      `buy:${plan.id}`,
      async () => (out.r = await checkoutAndOpen(plan.id as string, billingService.checkoutPlan, Linking)),
      (r) => (r.opened ? 'Đã mở trang thanh toán payOS' : `Đã chuyển sang ${plan.name}`)
    );
    if (!ok || !out.r || !alive.current) return;
    setCheckState({ checking: false, error: null });
    if (out.r.opened) {
      setPending({ orderId: out.r.order.id, planName: plan.name });
      setResult({ order: out.r.order, planName: plan.name });
    } else {
      setResult(null);
      refreshAll();
    }
  };

  // Hỏi BE trạng thái đơn đang chờ MỘT lần (BE tự hỏi payOS); xong (đã trả / huỷ / hết hạn) thì bỏ đơn chờ, tải lại gói + credit
  const checkingRef = useRef(false);
  const checkOrder = async () => {
    const p = pending;
    if (!p || checkingRef.current) return;
    checkingRef.current = true;
    setCheckState({ checking: true, error: null });
    try {
      const order = await billingService.getOrder(p.orderId);
      if (!alive.current) return;
      setResult({ order, planName: order.items[0]?.plan?.name ?? p.planName });
      setCheckState({ checking: false, error: null });
      if (order.status !== 'pending') {
        setPending(null);
        refreshAll();
      }
    } catch (e: any) {
      if (alive.current) setCheckState({ checking: false, error: e?.message || 'Không kiểm tra được đơn thanh toán.' });
    } finally {
      checkingRef.current = false;
    }
  };
  // Ba mẹ quay lại app sau trang payOS / Web → kiểm tra một lần (ref để luôn dùng state mới nhất)
  const checkRef = useRef(checkOrder);
  checkRef.current = checkOrder;
  useEffect(() => watchAppReturn(AppState, () => void checkRef.current()), []);

  // Nhóm theo ngày (giữ thứ tự BE trả)
  const groups = useMemo(() => {
    const out: { date: string; items: CreditEntryDto[] }[] = [];
    for (const e of entries) {
      const d = day(e.createdAt);
      const last = out[out.length - 1];
      if (last && last.date === d) last.items.push(e);
      else out.push({ date: d, items: [e] });
    }
    return out;
  }, [entries]);

  const s = sub.data;
  const balance = currentUser.creditBalance;
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Gói dịch vụ & Credit"
        onBack={onBack}
        subtitle="Mỗi truyện AI viết giúp dùng credit theo độ dài. Truyện tự viết không dùng credit."
      />

      {/* Thẻ số dư lớn */}
      <HeyCard variant="brand" style={styles.balanceCard}>
        <View style={styles.balanceTop}>
          <Icon name="diamond" size={26} color={Colors.brandInk} />
          <Text style={styles.balanceLabel}>Credit còn lại</Text>
        </View>
        <Text style={styles.balanceValue} accessibilityLabel={balance == null ? 'Chưa tải được số dư' : `${balance} credit`}>
          {balance ?? '—'}
        </Text>
        <Text style={styles.balanceHint}>{balance == null ? 'Chưa tải được số dư' : 'Từ tài khoản của ba mẹ'}</Text>
      </HeyCard>

      <HeyButton title="Tải lại" iconName="refresh" variant="tertiary" size="sm" onPress={refreshAll} style={styles.refresh} />

      {/* Gói hiện tại + mức dùng */}
      {sub.status === 'loading' && !s && <StateView variant="skeleton" title="Đang tải gói hiện tại..." />}
      {sub.status === 'error' && (
        <StateView variant="error" title="Chưa tải được gói hiện tại" description={sub.error ?? ''} actionLabel="Thử lại" onAction={() => void sub.reload()} />
      )}
      {s && (
        <HeyCard style={styles.card}>
          <View style={styles.planTop}>
            <Text style={styles.cardTitle}>Gói hiện tại: {s.plan.name}</Text>
          </View>
          <Text style={styles.hint}>{s.periodEnd ? `Đến ${day(s.periodEnd)}` : 'Không thời hạn'}</Text>
          <UsageBar label="Hồ sơ bé" used={s.usage.childrenCount} max={s.plan.maxChildren} />
          <UsageBar label="Nhân vật" used={s.usage.charactersCount} max={s.plan.maxCharacters} />
          {!!s.nextCreditGrantAt && <Line icon="calendar-outline" text={`Lần cấp credit tiếp theo: ${day(s.nextCreditGrantAt)}`} />}
          {s.isFallback && <Text style={styles.hint}>Tài khoản chưa có gói đăng ký, đang áp dụng giới hạn gói Miễn phí.</Text>}
        </HeyCard>
      )}

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Các gói dịch vụ
      </Text>
      {plans.status === 'loading' && <StateView variant="skeleton" title="Đang tải danh sách gói..." />}
      {plans.status === 'error' && (
        <StateView variant="error" title="Chưa tải được danh sách gói" description={plans.error ?? ''} actionLabel="Thử lại" onAction={() => void plans.reload()} />
      )}
      {result && <OrderResultCard result={result} checking={checkState.checking} error={checkState.error} onCheck={() => void checkOrder()} onClose={() => setResult(null)} />}
      {plans.data?.map((p) => (
        <PlanRow
          key={p.code}
          plan={p}
          current={p.code === s?.plan.code}
          onOpen={p.id ? () => setPlanId(p.id ?? null) : undefined}
          action={s && p.id ? planAction(p, s) : undefined}
          busy={busyKey === `buy:${p.id}`}
          locked={busy || !!pending}
          onBuy={() => void buy(p)}
        />
      ))}
      <PlanDetailSheet planId={planId} onClose={() => setPlanId(null)} />
      <View style={styles.noteRow}>
        <Icon name="information-circle-outline" size={18} color={Colors.textMuted} />
        <Text style={styles.note}>{PAYMENT_NOTE}</Text>
      </View>

      <PaymentHistory reloadKey={paymentsKey} />

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Lịch sử credit
      </Text>
      {entries.length === 0 && histStatus === 'ready' && (
        <StateView variant="empty" title="Chưa có giao dịch credit" description="Credit được cấp theo gói mỗi tháng và dùng khi AI viết truyện." />
      )}
      {groups.map((g) => (
        <View key={g.date} style={styles.group}>
          <Text style={styles.groupDate}>{g.date}</Text>
          {g.items.map((e) => (
            <HeyCard
              key={e.id}
              style={styles.entry}
            >
              <View style={styles.entryText}>
                <Text style={styles.entryTitle}>{describeEntry(e)}</Text>
                <Text style={styles.entryMeta}>
                  {new Date(e.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · còn {e.balanceAfter}
                </Text>
              </View>
              <Text
                style={[styles.amount, e.amount < 0 && styles.amountNeg]}
                accessibilityLabel={e.amount > 0 ? `cộng ${e.amount} credit` : `trừ ${Math.abs(e.amount)} credit`}
              >
                {e.amount > 0 ? `+${e.amount}` : e.amount}
              </Text>
            </HeyCard>
          ))}
        </View>
      ))}
      {histStatus === 'loading' && <StateView variant="skeleton" title="Đang tải lịch sử..." />}
      {histStatus === 'error' && (
        <StateView variant="error" title="Chưa tải được lịch sử credit" description={histError} actionLabel="Thử lại" onAction={() => void loadHistory(page + 1)} />
      )}
      {histStatus === 'ready' && page < totalPages && (
        <HeyButton title="Xem thêm" variant="tertiary" size="sm" onPress={() => void loadHistory(page + 1)} style={styles.refresh} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.sm },
  balanceCard: { gap: Spacing.xs },
  balanceTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  balanceLabel: { ...Typography.label, color: Colors.brandInk },
  balanceValue: { ...Typography.display, color: Colors.brandInk },
  balanceHint: { ...Typography.caption, color: Colors.brandInk },
  refresh: { alignSelf: 'flex-start' },
  card: { gap: Spacing.sm },
  cardTitle: { ...Typography.heading, color: Colors.text, flexShrink: 1 },
  text: { ...Typography.body, fontSize: 14, color: Colors.text, flexShrink: 1 },
  hint: { ...Typography.caption, color: Colors.textMuted },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  usage: { gap: 6 },
  usageTop: { flexDirection: 'row', justifyContent: 'space-between' },
  usageNum: { fontFamily: FontFamily.extraBold, fontSize: 14, color: Colors.text },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.md },
  planCard: { gap: Spacing.xs },
  planBtn: { alignSelf: 'flex-start' },
  planDetail: { gap: Spacing.sm, paddingBottom: Spacing.md },
  planTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  price: { ...Typography.title, fontSize: 20, color: Colors.text },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginVertical: Spacing.sm },
  note: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
  expiry: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  error: { ...Typography.caption, color: Colors.danger },
  flex1: { flex: 1 },
  group: { gap: Spacing.xs },
  groupDate: { ...Typography.label, color: Colors.textMuted, marginTop: Spacing.xs },
  entry: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  entryText: { flex: 1, gap: 2 },
  entryTitle: { ...Typography.bodyStrong, fontSize: 14, color: Colors.text },
  entryMeta: { ...Typography.caption, color: Colors.textMuted },
  // +: tealStrong; −: danger (có dấu +/−, màu chỉ là phụ)
  amount: { fontFamily: FontFamily.extraBold, fontSize: 17, color: Colors.tealStrong, borderRadius: Radius.sm },
  amountNeg: { color: Colors.danger },
});
