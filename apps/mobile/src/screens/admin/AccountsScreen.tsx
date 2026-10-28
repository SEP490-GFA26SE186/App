// apps/mobile/src/screens/admin/AccountsScreen.tsx
// Tài khoản (Web AccountsPage): tìm kiếm, lọc vai trò/trạng thái, phân trang của BE (GET /admin/accounts),
// khoá/mở khoá (PATCH, khoá → BE thu hồi phiên ngay; không tự khoá mình, không khoá Admin), tạo Chuyên gia sư phạm.
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { Badge } from '../../components/ui/Badge';
import { Sheet } from '../../components/ui/Sheet';
import { useDialog } from '../../components/ui/Dialog';
import { FilterChips, ManagementPage, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { ROLE_LABELS } from '../../constants/management';
import { adminService } from '../../services/adminService';
import { SpecialistForm, canToggleAccount, validateSpecialistForm } from '../../utils/managementRules';
import { formatDateTime } from '../../utils/format';
import type { AccountRole, AdminAccount } from '../../types/management';

type RoleFilter = AccountRole | 'all';
type StatusFilter = 'all' | 'active' | 'locked';

const ROLES: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'parent', label: 'Phụ huynh' },
  { value: 'specialist', label: 'Chuyên gia sư phạm' },
  { value: 'admin', label: 'Admin' },
];
const STATUS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Mọi trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'locked', label: 'Đã khoá' },
];

const EMPTY_FORM: SpecialistForm = { fullName: '', email: '', username: '', password: '' };

const CreateSpecialistSheet: React.FC<{ visible: boolean; onClose: () => void; onCreated: () => void }> = ({ visible, onClose, onCreated }) => {
  const [form, setForm] = useState<SpecialistForm>(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const { run, busy } = useMutationRunner();
  const errors = touched ? validateSpecialistForm(form) : {};
  const set = (k: keyof SpecialistForm) => (t: string) => setForm((f) => ({ ...f, [k]: t }));
  const close = () => {
    setForm(EMPTY_FORM);
    setTouched(false);
    onClose();
  };
  const submit = async () => {
    setTouched(true);
    if (Object.keys(validateSpecialistForm(form)).length) return;
    const body = { fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), username: form.username.trim(), password: form.password };
    if (await run('create', () => adminService.createSpecialist(body), 'Đã tạo tài khoản Chuyên gia sư phạm')) {
      close();
      onCreated();
    }
  };
  return (
    <Sheet
      visible={visible}
      title="Tạo tài khoản Chuyên gia sư phạm"
      description="Gửi email + mật khẩu tạm cho người được giao; họ nên đổi mật khẩu sau lần đăng nhập đầu."
      onClose={close}
      footer={
        <View style={styles.sheetActions}>
          <View style={styles.flex}>
            <HeyButton title="Huỷ" variant="outline" onPress={close} disabled={busy} />
          </View>
          <View style={styles.flex}>
            <HeyButton title="Tạo tài khoản" loading={busy} onPress={() => void submit()} />
          </View>
        </View>
      }
    >
      <HeyInput label="Họ tên" value={form.fullName} onChangeText={set('fullName')} error={errors.fullName} autoCapitalize="words" />
      <HeyInput label="Email" value={form.email} onChangeText={set('email')} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <HeyInput label="Tên đăng nhập" value={form.username} onChangeText={set('username')} error={errors.username} autoCapitalize="none" autoCorrect={false} />
      <HeyInput label="Mật khẩu tạm (tối thiểu 8 ký tự)" value={form.password} onChangeText={set('password')} error={errors.password} secureTextEntry revealable autoCapitalize="none" />
    </Sheet>
  );
};

export const AccountsScreen: React.FC<{ meId: string }> = ({ meId }) => {
  const dialog = useDialog();
  const [role, setRole] = useState<RoleFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const { run, busyKey, busy } = useMutationRunner(() => list.reload());

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);
  // Đổi bộ lọc/từ khoá → về trang 1
  useEffect(() => setPage(1), [role, status, debounced]);

  const list = useManagementResource(() => adminService.getAccounts({ role, status, search: debounced, page }), [role, status, debounced, page]);
  const rows = list.data?.accounts ?? [];
  const totalPages = list.data?.pagination.totalPages ?? 1;

  const toggle = async (u: AdminAccount) => {
    const ok = await dialog.confirm({
      title: u.isActive ? 'Khoá tài khoản' : 'Mở khoá tài khoản',
      message: u.isActive ? `Khoá ${u.email}? Người này bị đăng xuất ngay và mọi yêu cầu bị chặn.` : `Mở khoá ${u.email}?`,
      confirmLabel: u.isActive ? 'Khoá' : 'Mở khoá',
      destructive: u.isActive,
    });
    if (!ok) return;
    if (await run(`toggle:${u.id}`, () => adminService.setAccountActive(u.id, !u.isActive), u.isActive ? `Đã khoá ${u.email}` : `Đã mở khoá ${u.email}`)) void list.reload();
  };

  return (
    <ManagementPage title="Tài khoản" subtitle="Phụ huynh tự đăng ký; Chuyên gia sư phạm do Admin tạo. Khoá tài khoản sẽ đăng xuất người đó ngay." onRefresh={list.reload}>
      <HeyButton title="Tạo Chuyên gia sư phạm" iconName="person-add-outline" variant="secondary" onPress={() => setCreating(true)} />
      <HeyInput label="Tìm kiếm" value={search} onChangeText={setSearch} placeholder="Email, tên đăng nhập, họ tên..." autoCapitalize="none" autoCorrect={false} />
      <FilterChips label="Vai trò" options={ROLES} value={role} onChange={setRole} />
      <FilterChips label="Trạng thái" options={STATUS} value={status} onChange={setStatus} />

      <ResourceBody status={list.status} error={list.error} empty={!rows.length} emptyTitle="Không có tài khoản phù hợp." onRetry={list.reload}>
        {rows.map((u) => (
          <HeyCard key={u.id} variant={u.isActive ? 'surface' : 'coral'} style={styles.card}>
            <Text style={styles.name}>{u.fullName || u.username}</Text>
            <Text style={styles.muted} selectable>
              {u.email} • @{u.username}
            </Text>
            <View style={styles.badges}>
              <Badge label={ROLE_LABELS[u.role] ?? u.role} tone="info" />
              <Badge label={u.isActive ? 'Đang hoạt động' : 'Đã khoá'} tone={u.isActive ? 'success' : 'danger'} />
            </View>
            {u.role === 'parent' && (
              <Text style={styles.body}>
                {u.plan?.name ?? '—'} • {u.creditBalance ?? 0} credit • {u.childrenCount} bé
              </Text>
            )}
            {!!u.seller && (
              <Text style={styles.body}>
                Người bán: {u.seller.displayName} ({u.seller.status})
              </Text>
            )}
            <Text style={styles.muted}>Đăng nhập gần nhất: {formatDateTime(u.lastLoginAt)}</Text>
            {u.id === meId ? (
              <Text style={styles.muted}>Tài khoản của bạn</Text>
            ) : u.role === 'admin' && u.isActive ? (
              <Text style={styles.muted}>Không khoá Admin ở đây</Text>
            ) : (
              <HeyButton
                title={u.isActive ? 'Khoá' : 'Mở khoá'}
                iconName={u.isActive ? 'lock-closed-outline' : 'lock-open-outline'}
                variant={u.isActive ? 'outline' : 'danger'}
                size="sm"
                loading={busyKey === `toggle:${u.id}`}
                disabled={busy || !canToggleAccount(u, meId)}
                onPress={() => void toggle(u)}
              />
            )}
          </HeyCard>
        ))}
        {totalPages > 1 && (
          <View style={styles.pager}>
            <HeyButton title="Trang trước" variant="outline" size="sm" iconName="chevron-back" disabled={page <= 1} onPress={() => setPage((p) => p - 1)} />
            <Text style={styles.body} accessibilityLiveRegion="polite">
              {page}/{totalPages}
            </Text>
            <HeyButton title="Trang sau" variant="outline" size="sm" disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)} />
          </View>
        )}
      </ResourceBody>

      <CreateSpecialistSheet visible={creating} onClose={() => setCreating(false)} onCreated={() => void list.reload()} />
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: Spacing.xs },
  name: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  body: { ...Typography.body, fontSize: 14, color: Colors.text },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginVertical: 2 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  sheetActions: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.md },
});
