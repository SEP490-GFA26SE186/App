// apps/mobile/src/components/selling/EarningsSection.tsx
// GĐ D3 – Doanh thu người bán (Web EarningsPanel): đang giữ / rút được / đang rút, tài khoản nhận tiền (số TK luôn che, chỉ hiện
// đủ trong ô đang nhập), rút tiền, huỷ yêu cầu đang chờ. Mọi thao tác ghi qua Dialog xác nhận, chống bấm đúp.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../ui/HeyCard';
import { HeyButton } from '../ui/HeyButton';
import { HeyChip } from '../ui/HeyChip';
import { HeyInput } from '../ui/HeyInput';
import { Badge } from '../ui/Badge';
import { Sheet } from '../ui/Sheet';
import { StateView } from '../ui/StateView';
import { useDialog } from '../ui/Dialog';
import { KpiCard, useMutationRunner } from '../management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { BANKS } from '../../constants/banks';
import { sellingService } from '../../services/sellingService';
import { useAsyncResource } from '../../utils/useAsyncResource';
import { formatDateTime, money } from '../../utils/format';
import {
  BankForm,
  WITHDRAWAL_STATUS,
  bankBody,
  bankConfirm,
  bankFormErrors,
  cancelWithdrawConfirm,
  withdrawConfirm,
  withdrawError,
} from '../../utils/selling';
import type { BankDto } from '../../types/selling';

const BankSheet: React.FC<{ visible: boolean; current: BankDto | null; busy: boolean; onSave: (f: BankForm) => void; onClose: () => void }> = ({ visible, current, busy, onSave, onClose }) => {
  const [form, setForm] = useState<BankForm>({ bankBin: '', accountNumber: '', accountHolder: '' });
  const [errors, setErrors] = useState<ReturnType<typeof bankFormErrors>>({});
  React.useEffect(() => {
    if (!visible) return;
    setForm({ bankBin: current?.bankBin ?? '', accountNumber: '', accountHolder: current?.accountHolder ?? '' }); // số TK cũ không điền lại
    setErrors({});
  }, [visible]);
  const set = (patch: Partial<BankForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors({});
  };
  const save = () => {
    const e = bankFormErrors(form);
    setErrors(e);
    if (!Object.keys(e).length) onSave(form);
  };
  return (
    <Sheet
      visible={visible}
      title={current ? 'Đổi tài khoản nhận tiền' : 'Tài khoản nhận tiền'}
      description={current ? 'Đổi tài khoản thì 24 giờ sau mới rút được.' : 'Quản trị viên chuyển khoản doanh thu vào tài khoản này.'}
      onClose={onClose}
      footer={<HeyButton title="Lưu tài khoản" iconName="checkmark" loading={busy} onPress={save} />}
    >
      <Text style={styles.label}>Ngân hàng</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Ngân hàng" style={styles.chips}>
        {BANKS.map((b) => (
          <HeyChip key={b.bin} label={b.name} selected={form.bankBin === b.bin} onPress={() => set({ bankBin: b.bin })} />
        ))}
      </View>
      {!!errors.bankBin && <Text style={styles.error}>{errors.bankBin}</Text>}
      <HeyInput label="Số tài khoản" value={form.accountNumber} onChangeText={(t) => set({ accountNumber: t.trim() })} keyboardType="numeric" autoCorrect={false} error={errors.accountNumber} />
      <HeyInput label="Tên chủ tài khoản" value={form.accountHolder} onChangeText={(t) => set({ accountHolder: t })} autoCapitalize="characters" error={errors.accountHolder} />
    </Sheet>
  );
};

export const EarningsSection: React.FC = () => {
  const dialog = useDialog();
  const res = useAsyncResource(() => sellingService.getEarnings(), []);
  const { run, busy, busyKey } = useMutationRunner(res.reload);
  const [bankOpen, setBankOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const d = res.data;

  const saveBank = async (f: BankForm) => {
    if (busy) return;
    const body = bankBody(f);
    if (!(await dialog.confirm(bankConfirm(body, !!d?.bank)))) return;
    if (await run('bank', () => sellingService.updateBank(body), 'Đã lưu tài khoản nhận tiền')) {
      setBankOpen(false);
      void res.reload();
    }
  };

  const withdraw = async () => {
    if (!d?.bank || busy) return;
    const e = withdrawError(amount, d.minWithdrawalVnd, d.balance.availableVnd);
    setAmountError(e);
    if (e) return;
    const amountVnd = Number(amount.trim());
    if (!(await dialog.confirm(withdrawConfirm(amountVnd, d.bank)))) return;
    if (await run('withdraw', () => sellingService.requestWithdrawal(amountVnd), 'Đã gửi yêu cầu rút tiền')) {
      setAmount('');
      void res.reload();
    }
  };

  const cancel = async (id: string, amountVnd: number) => {
    if (busy) return;
    if (!(await dialog.confirm(cancelWithdrawConfirm(amountVnd)))) return;
    if (await run(`cancel:${id}`, () => sellingService.cancelWithdrawal(id), 'Đã huỷ yêu cầu rút tiền')) void res.reload();
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Doanh thu
      </Text>
      {res.status === 'loading' && !d && <StateView variant="skeleton" title="Đang tải doanh thu..." />}
      {res.status === 'error' && <StateView variant="error" title="Chưa tải được doanh thu" description={res.error ?? ''} actionLabel="Thử lại" onAction={() => void res.reload()} />}
      {d && (
        <>
          <Text style={styles.muted}>
            Ba mẹ nhận {Math.round(d.sellerShareRate * 100)}% giá bán mỗi lượt mua. Doanh thu được giữ {d.holdDays} ngày (để xử lý hoàn tiền) rồi mới rút được.
          </Text>
          <KpiCard icon="time-outline" label="Đang giữ" value={money(d.balance.pendingVnd)} />
          <KpiCard icon="cash-outline" label="Rút được" value={money(d.balance.availableVnd)} emphasis />
          <KpiCard icon="business-outline" label="Đang rút" value={money(d.balance.lockedVnd)} />

          <HeyCard style={styles.card}>
            <Text style={styles.strong}>Tài khoản nhận tiền</Text>
            {d.bank ? (
              <Text style={styles.body}>
                {d.bank.bankName} • {d.bank.accountNumber} • {d.bank.accountHolder}
              </Text>
            ) : (
              <Text style={styles.muted}>Chưa có tài khoản. Ba mẹ thêm tài khoản để rút doanh thu.</Text>
            )}
            <HeyButton title={d.bank ? 'Đổi tài khoản' : 'Thêm tài khoản'} iconName="card-outline" variant="tertiary" size="sm" onPress={() => setBankOpen(true)} disabled={busy} style={styles.selfStart} />
          </HeyCard>

          {d.bank && (
            <HeyCard style={styles.card}>
              <HeyInput
                label={`Số tiền rút (tối thiểu ${money(d.minWithdrawalVnd)})`}
                value={amount}
                onChangeText={(t) => {
                  setAmount(t);
                  setAmountError(null);
                }}
                keyboardType="numeric"
                error={amountError ?? undefined}
              />
              <HeyButton
                title="Rút tiền"
                iconName="arrow-down-circle-outline"
                onPress={() => void withdraw()}
                loading={busyKey === 'withdraw'}
                disabled={busy || d.balance.availableVnd < d.minWithdrawalVnd}
              />
            </HeyCard>
          )}

          {d.withdrawals.map((w) => {
            const s = WITHDRAWAL_STATUS[w.status] ?? { label: w.status, tone: 'neutral' as const };
            return (
              <HeyCard key={w.id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={[styles.strong, styles.flex1]}>{money(w.amountVnd)}</Text>
                  <Badge label={s.label} tone={s.tone} />
                </View>
                <Text style={styles.muted}>{formatDateTime(w.createdAt)}</Text>
                {!!w.rejectReason && <Text style={styles.error}>{w.rejectReason}</Text>}
                {w.status === 'requested' && (
                  <HeyButton
                    title="Huỷ yêu cầu"
                    iconName="close"
                    variant="ghost"
                    size="sm"
                    onPress={() => void cancel(w.id, w.amountVnd)}
                    loading={busyKey === `cancel:${w.id}`}
                    disabled={busy}
                    accessibilityLabel={`Huỷ yêu cầu rút ${money(w.amountVnd)}`}
                    style={styles.selfStart}
                  />
                )}
              </HeyCard>
            );
          })}
        </>
      )}
      <BankSheet visible={bankOpen} current={d?.bank ?? null} busy={busyKey === 'bank'} onSave={(f) => void saveBank(f)} onClose={() => setBankOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.md },
  card: { gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flex1: { flex: 1 },
  strong: { ...Typography.bodyStrong, color: Colors.text },
  body: { ...Typography.label, color: Colors.text },
  label: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  error: { ...Typography.caption, color: Colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs, marginBottom: Spacing.md },
  selfStart: { alignSelf: 'flex-start' },
});
