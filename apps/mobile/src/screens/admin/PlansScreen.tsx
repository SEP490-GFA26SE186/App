// apps/mobile/src/screens/admin/PlansScreen.tsx
// GĐ F – Gói & định giá (Web PlansPage): danh sách gói dạng thẻ; thêm / sửa gói trong bottom sheet theo đúng trường + luật BE
// (planFields, mã + thời hạn chỉ khi tạo, gói FREE khoá giá và công tắc mở bán). Lưu LUÔN qua Dialog xác nhận liệt kê thay đổi
// (giá / credit ảnh hưởng người dùng thật). Nhóm cài đặt market / moderation của trang Web không làm ở đây (ngoài phạm vi GĐ F).
import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyChip } from '../../components/ui/HeyChip';
import { HeyInput } from '../../components/ui/HeyInput';
import { Badge } from '../../components/ui/Badge';
import { Sheet } from '../../components/ui/Sheet';
import { useDialog } from '../../components/ui/Dialog';
import { ManagementPage, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing, Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { adminService } from '../../services/adminService';
import { money } from '../../utils/format';
import {
  FREE_PLAN_CODE,
  PLAN_FIELD_LABELS,
  PLAN_NUMBER_FIELDS,
  PlanForm,
  createPlanBody,
  planConfirm,
  planForm,
  planFormErrors,
  updatePlanBody,
} from '../../utils/adminConfig';
import type { AdminPlan } from '../../types/management';

const SwitchRow: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean; error?: string }> = ({ label, value, onChange, disabled, error }) => (
  <View>
    <View style={styles.switchRow}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} disabled={disabled} accessibilityLabel={label} trackColor={{ true: Colors.tealStrong, false: Colors.outline }} thumbColor={Colors.surface} />
    </View>
    {!!error && <Text style={styles.error}>{error}</Text>}
  </View>
);

/** Sheet thêm / sửa gói. `plan` = sửa, undefined = thêm */
const PlanSheet: React.FC<{ visible: boolean; plan?: AdminPlan; busy: boolean; onSave: (form: PlanForm) => void; onClose: () => void }> = ({ visible, plan, busy, onSave, onClose }) => {
  const [form, setForm] = useState<PlanForm>(planForm(plan));
  const [errors, setErrors] = useState<ReturnType<typeof planFormErrors>>({});
  useEffect(() => {
    if (!visible) return;
    setForm(planForm(plan));
    setErrors({});
  }, [visible, plan?.id]);
  const isFree = plan?.code === FREE_PLAN_CODE;
  const set = (patch: Partial<PlanForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors({});
  };
  const save = () => {
    const e = planFormErrors(form, plan);
    setErrors(e);
    if (!Object.keys(e).length) onSave(form);
  };

  return (
    <Sheet
      visible={visible}
      title={plan ? `Sửa gói ${plan.name}` : 'Thêm gói'}
      description="Giá và credit mới áp dụng cho lần mua sau; đơn cũ giữ nguyên giá đã trả, kỳ đang chạy nhận credit theo gói mới từ tháng kế tiếp."
      onClose={onClose}
      footer={<HeyButton title={plan ? 'Lưu' : 'Tạo gói'} iconName="checkmark" loading={busy} onPress={save} />}
    >
      {!plan && (
        <>
          <HeyInput
            label="Mã gói *"
            placeholder="Chữ in hoa, số, dấu _"
            value={form.code}
            onChangeText={(t) => set({ code: t.toUpperCase() })}
            autoCapitalize="characters"
            autoCorrect={false}
            error={errors.code}
          />
          <Text style={styles.label}>Thời hạn</Text>
          <View accessibilityRole="radiogroup" style={styles.chips}>
            {([1, 12] as const).map((m) => (
              <HeyChip key={m} label={m === 12 ? '12 tháng' : '1 tháng'} selected={form.durationMonths === m} onPress={() => set({ durationMonths: m })} />
            ))}
          </View>
        </>
      )}
      <HeyInput label="Tên gói *" value={form.name} onChangeText={(t) => set({ name: t })} error={errors.name} />
      {PLAN_NUMBER_FIELDS.map((k) => (
        <HeyInput
          key={k}
          label={PLAN_FIELD_LABELS[k]}
          value={form[k]}
          onChangeText={(t) => set({ [k]: t } as Partial<PlanForm>)}
          keyboardType="numeric"
          editable={!(isFree && k === 'priceVnd')}
          error={errors[k]}
          hint={isFree && k === 'priceVnd' ? 'Gói Miễn phí luôn có giá 0đ.' : undefined}
        />
      ))}
      <SwitchRow label="Được bán truyện" value={form.canSell} onChange={(canSell) => set({ canSell })} />
      <SwitchRow label="Đang mở bán" value={form.isActive} onChange={(isActive) => set({ isActive })} disabled={isFree} error={errors.isActive} />
    </Sheet>
  );
};

export const PlansScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dialog = useDialog();
  const list = useManagementResource(() => adminService.getAdminPlans(), []);
  const { run, busy } = useMutationRunner(list.reload);
  const [editing, setEditing] = useState<AdminPlan | 'new' | null>(null);
  const plan = editing && editing !== 'new' ? editing : undefined;

  const save = async (form: PlanForm) => {
    if (busy) return;
    if (plan) {
      const body = updatePlanBody(plan, form);
      if (!Object.keys(body).length) return void dialog.notify('Chưa có gì thay đổi', 'Sửa ít nhất một thông tin của gói rồi lưu.');
      if (!(await dialog.confirm(planConfirm(plan, body)))) return;
      if (await run(`plan:${plan.id}`, () => adminService.updatePlan(plan.id, body), (p) => `Đã lưu gói ${p.name}`)) {
        setEditing(null);
        void list.reload();
      }
      return;
    }
    const body = createPlanBody(form);
    if (!(await dialog.confirm(planConfirm(undefined, body)))) return;
    if (await run('plan:new', () => adminService.createPlan(body), (p) => `Đã tạo gói ${p.name}`)) {
      setEditing(null);
      void list.reload();
    }
  };

  return (
    <ManagementPage title="Gói & định giá" subtitle="Gói cấp credit mỗi tháng (không bán credit lẻ). Thay đổi chỉ áp dụng cho giao dịch mới." onBack={onBack} onRefresh={list.reload}>
      <HeyButton title="Thêm gói" iconName="add" size="sm" onPress={() => setEditing('new')} disabled={busy} style={styles.selfStart} />
      <ResourceBody status={list.status} error={list.error} empty={!list.data?.length} emptyTitle="Chưa có gói nào." onRetry={list.reload}>
        {list.data?.map((p) => (
          <HeyCard key={p.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={[styles.title, !p.isActive && styles.muted]}>{p.name}</Text>
              {!p.isActive && <Badge label="Đã tắt" tone="neutral" />}
            </View>
            <Text style={styles.muted}>
              {p.code} • {p.durationMonths === 12 ? 'gói năm' : 'gói tháng'}
            </Text>
            <Text style={styles.body}>
              {money(p.priceVnd)} • {p.creditsPerMonth} credit/tháng • {p.maxChildren} bé / {p.maxCharacters} nhân vật
            </Text>
            <Text style={styles.muted}>
              Bán truyện: {p.canSell ? 'Có' : '—'} • Đang dùng: {p.activeSubscribers}
            </Text>
            <HeyButton title="Sửa gói" iconName="create-outline" variant="tertiary" size="sm" onPress={() => setEditing(p)} disabled={busy} accessibilityLabel={`Sửa gói ${p.name}`} style={styles.selfStart} />
          </HeyCard>
        ))}
      </ResourceBody>
      <PlanSheet visible={!!editing} plan={plan} busy={busy} onSave={(f) => void save(f)} onClose={() => setEditing(null)} />
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.xs },
  title: { ...Typography.bodyStrong, color: Colors.text, flexShrink: 1 },
  body: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  label: { ...Typography.label, color: Colors.text, flex: 1 },
  error: { ...Typography.caption, color: Colors.danger },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  selfStart: { alignSelf: 'flex-start' },
  chips: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, marginTop: Spacing.xs },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: Touch.min },
});
