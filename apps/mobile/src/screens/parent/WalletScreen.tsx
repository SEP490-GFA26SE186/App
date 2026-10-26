// apps/mobile/src/screens/parent/WalletScreen.tsx
// B10/C12 – Gói dịch vụ & Credit, CHỈ XEM (Web: BillingPage). Dữ liệu từ BE: số dư (GET /auth/me), gói hiện tại + mức dùng
// (GET /subscriptions/me), danh sách gói (GET /plans), lịch sử credit (GET /subscriptions/me/credit-history).
// Không có nạp credit (BE không có endpoint), không rút tiền, không thanh toán/nâng gói (SCOPE PENDING).
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';
import { SessionUser } from '../../types/sessionUser';
import { billingService } from '../../services/billingService';
import { useAsyncResource } from '../../utils/useAsyncResource';
import type { CreditEntryDto, PlanDto } from '../../types/api';

interface WalletScreenProps {
  currentUser: SessionUser;
  /** Tải lại số dư (GET /auth/me) */
  onRefreshWallet: () => void;
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

const PlanRow: React.FC<{ plan: PlanDto; current: boolean }> = ({ plan, current }) => (
  <HeyCard variant={current ? 'mint' : 'white'} style={styles.planCard}>
    <View style={styles.planTop}>
      <Text style={styles.cardTitle}>{plan.name}</Text>
      {current && <Badge label="Đang dùng" tone="success" />}
    </View>
    <Text style={styles.text}>{money(plan.priceVnd)}{plan.durationMonths ? ` / ${plan.durationMonths} tháng` : ''}</Text>
    <Text style={styles.text}>💎 {plan.creditsPerMonth} credit mỗi tháng</Text>
    <Text style={styles.text}>
      👶 Tối đa {plan.maxChildren} bé · 👨‍👩‍👧 {plan.maxCharacters} nhân vật
    </Text>
  </HeyCard>
);

export const WalletScreen: React.FC<WalletScreenProps> = ({ currentUser, onRefreshWallet }) => {
  const sub = useAsyncResource(() => billingService.getSubscription(), []);
  const plans = useAsyncResource(() => billingService.getPlans(), []);

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
  };

  const s = sub.data;
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Gói dịch vụ & Credit"
        subtitle="Mỗi truyện AI viết giúp dùng credit theo độ dài. Truyện tự viết không dùng credit."
      />

      <View style={styles.summaryRow}>
        <HeyCard variant="yellow" style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Gói hiện tại</Text>
          <Text style={styles.summaryValue}>{s ? s.plan.name : '—'}</Text>
          <Text style={styles.summaryHint}>
            {sub.status === 'loading' ? 'Đang tải...' : sub.status === 'error' ? 'Chưa tải được' : s?.periodEnd ? `Đến ${day(s.periodEnd)}` : 'Không thời hạn'}
          </Text>
        </HeyCard>
        <HeyCard variant="mint" style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Credit còn lại</Text>
          <Text style={styles.summaryValue}>💎 {currentUser.creditBalance ?? '—'}</Text>
          <Text style={styles.summaryHint}>
            {currentUser.creditBalance == null ? 'Chưa tải được số dư' : 'Từ tài khoản của ba mẹ'}
          </Text>
        </HeyCard>
      </View>

      <HeyButton title="🔄 Tải lại" variant="outline" size="sm" onPress={refreshAll} style={styles.refresh} />

      {sub.status === 'error' && (
        <StateView variant="empty" title="Chưa tải được gói hiện tại" description={sub.error ?? ''} actionLabel="Thử lại" onAction={() => void sub.reload()} />
      )}
      {s && (
        <HeyCard style={styles.card}>
          <Text style={styles.cardTitle}>Mức đang dùng</Text>
          <Text style={styles.text}>👶 Hồ sơ bé: {s.usage.childrenCount}/{s.plan.maxChildren}</Text>
          <Text style={styles.text}>👨‍👩‍👧 Nhân vật: {s.usage.charactersCount}/{s.plan.maxCharacters}</Text>
          {!!s.nextCreditGrantAt && <Text style={styles.text}>Lần cấp credit tiếp theo: {day(s.nextCreditGrantAt)}</Text>}
          {s.isFallback && <Text style={styles.text}>Tài khoản chưa có gói đăng ký, đang áp dụng giới hạn gói Miễn phí.</Text>}
        </HeyCard>
      )}

      <Text style={styles.sectionTitle}>Các gói dịch vụ</Text>
      {plans.status === 'loading' && <StateView variant="loading" title="Đang tải danh sách gói..." />}
      {plans.status === 'error' && (
        <StateView variant="empty" title="Chưa tải được danh sách gói" description={plans.error ?? ''} actionLabel="Thử lại" onAction={() => void plans.reload()} />
      )}
      {plans.data?.map((p) => (
        <PlanRow key={p.code} plan={p} current={p.code === s?.plan.code} />
      ))}
      <Text style={styles.note}>Nâng cấp gói và thanh toán chưa được hỗ trợ trên ứng dụng. Ứng dụng không cho nạp hay rút tiền.</Text>

      <Text style={styles.sectionTitle}>Lịch sử credit</Text>
      {entries.length === 0 && histStatus === 'ready' && (
        <StateView variant="empty" title="Chưa có giao dịch credit" description="Credit được cấp theo gói mỗi tháng và dùng khi AI viết truyện." />
      )}
      {entries.map((e) => (
        <HeyCard key={e.id} style={styles.entry}>
          <View style={styles.entryText}>
            <Text style={styles.entryTitle}>{describeEntry(e)}</Text>
            <Text style={styles.entryMeta}>{new Date(e.createdAt).toLocaleString('vi-VN')} · còn {e.balanceAfter}</Text>
          </View>
          <Text style={[styles.amount, e.amount < 0 && styles.amountNeg]}>{e.amount > 0 ? `+${e.amount}` : e.amount}</Text>
        </HeyCard>
      ))}
      {histStatus === 'loading' && <StateView variant="loading" title="Đang tải lịch sử..." />}
      {histStatus === 'error' && (
        <StateView variant="empty" title="Chưa tải được lịch sử credit" description={histError} actionLabel="Thử lại" onAction={() => void loadHistory(page + 1)} />
      )}
      {histStatus === 'ready' && page < totalPages && (
        <HeyButton title="Xem thêm" variant="outline" size="sm" onPress={() => void loadHistory(page + 1)} style={styles.refresh} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  summaryCard: { flex: 1, gap: 2 },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary },
  summaryValue: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  summaryHint: { fontSize: 11, color: Colors.textSecondary },
  refresh: { alignSelf: 'flex-start', marginBottom: 12 },
  card: { marginBottom: 12, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  text: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary, marginTop: 6, marginBottom: 8 },
  planCard: { marginBottom: 10, gap: 4 },
  planTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  note: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginVertical: 8 },
  entry: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  entryText: { flex: 1, gap: 2 },
  entryTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  entryMeta: { fontSize: 11, color: Colors.textSecondary },
  amount: { fontSize: 16, fontWeight: '900', color: Colors.secondaryDark },
  amountNeg: { color: '#B91C1C' },
});
