// apps/mobile/src/components/management/ManagementUi.tsx
// Khối dựng dùng chung cho màn Admin / Chuyên gia sư phạm, ghép từ UI kit R2 (HeyChip, HeyCard, Sheet, StateView…):
// bộ lọc dạng chip cuộn ngang, thẻ KPI, dòng thông tin chép được, sheet nhập lý do, khung danh sách có kéo-để-làm-mới.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeyChip } from '../ui/HeyChip';
import { HeyCard } from '../ui/HeyCard';
import { HeyButton } from '../ui/HeyButton';
import { HeyInput } from '../ui/HeyInput';
import { Icon, IconName } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { StateView } from '../ui/StateView';
import { ScreenHeader } from '../ui/ScreenHeader';
import { useToast } from '../ui/Toast';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { useAuth } from '../../stores/SessionProvider';
import { SESSION_EXPIRED_NOTICE } from '../../stores/useAuthSession';
import { ApiError } from '../../services/apiClient';
import { ResourceStatus, useAsyncResource } from '../../utils/useAsyncResource';

/** Chip lọc cuộn ngang (giữ đúng giá trị lọc của BE) */
export const FilterChips = <T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  // Không suy luận T từ onChange (setState nhận cả hàm) — chỉ từ options/value
  onChange: (v: [T][T extends unknown ? 0 : never]) => void;
  label: string;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.chips}
    accessibilityRole="radiogroup"
    accessibilityLabel={label}
  >
    {options.map((o) => (
      <HeyChip key={o.value} label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} />
    ))}
  </ScrollView>
);

/** Thẻ KPI: số tiền không cắt bớt (xuống dòng khi dài) để không hiển thị sai số */
export const KpiCard: React.FC<{ icon: IconName; label: string; value: string; hint?: string; emphasis?: boolean }> = ({
  icon,
  label,
  value,
  hint,
  emphasis,
}) => (
  <HeyCard variant={emphasis ? 'brand' : 'surface'} style={styles.kpi}>
    <View style={styles.kpiHead}>
      <View style={[styles.kpiIcon, emphasis && styles.kpiIconEmphasis]}>
        <Icon name={icon} size={20} color={emphasis ? Colors.brandStrong : Colors.tealStrong} />
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
    <Text style={styles.kpiValue} accessibilityLabel={`${label}: ${value}`}>
      {value}
    </Text>
    {!!hint && <Text style={styles.kpiHint}>{hint}</Text>}
  </HeyCard>
);

/** Một dòng "nhãn: giá trị"; selectable để Admin chép số tài khoản/mã giao dịch (không cần thư viện clipboard) */
export const InfoRow: React.FC<{ label: string; value: string; selectable?: boolean }> = ({ label, value, selectable }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} selectable={selectable}>
      {value}
    </Text>
  </View>
);

/** Khung nội dung theo trạng thái tải: skeleton / lỗi + thử lại / rỗng / dữ liệu */
export const ResourceBody: React.FC<{
  status: ResourceStatus;
  error: string | null;
  empty: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  onRetry: () => void;
  children: React.ReactNode;
}> = ({ status, error, empty, emptyTitle, emptyDescription, onRetry, children }) => {
  if (status === 'loading') return <StateView variant="skeleton" />;
  if (status === 'error') return <StateView variant="error" title="Không tải được dữ liệu" description={error ?? undefined} actionLabel="Thử lại" onAction={onRetry} />;
  if (empty) return <StateView variant="empty" title={emptyTitle} description={emptyDescription} />;
  return <>{children}</>;
};

/** Trang danh sách: tiêu đề + kéo để làm mới; nội dung cuộn dọc, có chỗ cho thanh tab */
export const ManagementPage: React.FC<{
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onRefresh?: () => Promise<unknown> | void;
  children: React.ReactNode;
}> = ({ title, subtitle, onBack, onRefresh, children }) => {
  const [refreshing, setRefreshing] = useState(false);
  const refresh = onRefresh
    ? async () => {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    : undefined;
  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      refreshControl={refresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[Colors.brandStrong]} tintColor={Colors.brandStrong} /> : undefined}
    >
      <ScreenHeader title={title} subtitle={subtitle} onBack={onBack} />
      {children}
    </ScrollView>
  );
};

/** Lỗi 401 giữa phiên (refresh token bị từ chối) → kết thúc phiên như luồng Parent; lỗi khác giữ nguyên message BE */
const useSessionGuard = () => {
  const auth = useAuth();
  return useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) auth.endSession(SESSION_EXPIRED_NOTICE);
    },
    [auth]
  );
};

/** useAsyncResource + xử lý hết phiên */
export const useManagementResource = <T,>(loader: () => Promise<T>, deps: unknown[]) => {
  const guard = useSessionGuard();
  return useAsyncResource(async () => {
    try {
      return await loader();
    } catch (e) {
      guard(e);
      throw e;
    }
  }, deps);
};

/**
 * Chạy thao tác thay đổi dữ liệu: chặn bấm đúp (một thao tác mỗi lúc), báo kết quả bằng Toast, lỗi BE hiện nguyên văn.
 * Trả true khi BE xác nhận thành công. `onStale`: BE trả 404/409 (đã có người xử lý, hết hạn giữ bài) → nạp lại dữ liệu
 * để màn không giữ trạng thái cũ; 422 (nhập thiếu) thì giữ nguyên để người dùng sửa.
 */
export const useMutationRunner = (onStale?: () => unknown) => {
  const toast = useToast();
  const guard = useSessionGuard();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const lock = useRef(false);
  const run = useCallback(
    async (key: string, fn: () => Promise<unknown>, successMessage: string): Promise<boolean> => {
      if (lock.current) return false;
      lock.current = true;
      setBusyKey(key);
      try {
        await fn();
        toast.show(successMessage, 'success');
        return true;
      } catch (e: any) {
        guard(e);
        toast.show(e?.message || 'Không thực hiện được, vui lòng thử lại.', 'danger');
        if (e instanceof ApiError && (e.status === 404 || e.status === 409)) void onStale?.();
        return false;
      } finally {
        lock.current = false;
        setBusyKey(null);
      }
    },
    [toast, guard, onStale]
  );
  return { run, busyKey, busy: busyKey !== null };
};

/** Sheet nhập lý do/ghi chú cho thao tác nhạy cảm; kiểm tra độ dài tối thiểu như BE trước khi gửi */
export const ReasonSheet: React.FC<{
  visible: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  minLength?: number;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onSubmit: (text: string) => void;
  onClose: () => void;
}> = ({ visible, title, description, label, placeholder, minLength = 0, confirmLabel, destructive, busy, onSubmit, onClose }) => {
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const trimmed = text.trim();
  const invalid = trimmed.length < minLength;
  // Mỗi lần mở là một yêu cầu mới: không mang lý do của lần trước (sheet đóng sau khi gửi thành công không qua close())
  useEffect(() => {
    if (visible) {
      setText('');
      setTouched(false);
    }
  }, [visible]);
  const close = () => onClose();
  return (
    <Sheet
      visible={visible}
      title={title}
      description={description}
      onClose={close}
      footer={
        <View style={styles.sheetActions}>
          <View style={styles.flex}>
            <HeyButton title="Huỷ" variant="outline" onPress={close} disabled={busy} />
          </View>
          <View style={styles.flex}>
            <HeyButton
              title={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              loading={busy}
              onPress={() => {
                setTouched(true);
                if (!invalid) onSubmit(trimmed);
              }} />
          </View>
        </View>
      }
    >
      <HeyInput
        label={label}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        multiline
        numberOfLines={3}
        error={touched && invalid ? `Nhập tối thiểu ${minLength} ký tự.` : undefined}
        hint={minLength > 0 ? `Tối thiểu ${minLength} ký tự.` : undefined}
      />
    </Sheet>
  );
};

export const SectionTitle: React.FC<{ children: string }> = ({ children }) => (
  <Text style={styles.sectionTitle} accessibilityRole="header">
    {children}
  </Text>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  chips: { gap: Spacing.sm, paddingVertical: Spacing.xs, paddingRight: Spacing.page },
  kpi: { gap: Spacing.sm },
  kpiHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  kpiIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.tealTint, alignItems: 'center', justifyContent: 'center' },
  kpiIconEmphasis: { backgroundColor: Colors.surface },
  kpiLabel: { ...Typography.label, color: Colors.textMuted, flex: 1 },
  kpiValue: { fontFamily: FontFamily.displayBold, fontSize: 24, lineHeight: 32, color: Colors.text },
  kpiHint: { ...Typography.caption, color: Colors.textMuted },
  infoRow: { gap: 2, paddingVertical: Spacing.xs },
  infoLabel: { ...Typography.caption, color: Colors.textMuted },
  infoValue: { ...Typography.bodyStrong, color: Colors.text },
  sheetActions: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.md },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.sm },
});
