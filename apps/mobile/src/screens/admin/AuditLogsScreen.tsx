// apps/mobile/src/screens/admin/AuditLogsScreen.tsx
// Nhật ký kiểm toán (Web AuditLogsPage, chỉ đọc): thao tác thay đổi tiền, quyền, nội dung của Admin / Chuyên gia sư phạm.
// Bảng desktop → thẻ; lọc theo nhóm thao tác (prefix BE trả về), phân trang của BE.
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { FilterChips, ManagementPage, ResourceBody, useManagementResource } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { AUDIT_ACTION_LABELS, AUDIT_PREFIX_LABELS, ROLE_LABELS } from '../../constants/management';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/format';
import { briefState } from '../../utils/managementRules';

export const AuditLogsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [action, setAction] = useState('all');
  const [page, setPage] = useState(1);
  const list = useManagementResource(() => adminService.getAuditLogs({ action, page }), [action, page]);
  // Giữ danh sách nhóm của lần tải gần nhất để chip không biến mất khi đang tải trang khác
  const [prefixes, setPrefixes] = useState<string[]>([]);
  useEffect(() => {
    if (list.data) setPrefixes(list.data.prefixes);
  }, [list.data]);
  const totalPages = list.data?.pagination.totalPages ?? 1;
  const logs = list.data?.logs ?? [];

  return (
    <ManagementPage title="Nhật ký kiểm toán" subtitle="Mọi thao tác thay đổi tiền, quyền và nội dung của Admin / Chuyên gia sư phạm." onBack={onBack} onRefresh={list.reload}>
      <FilterChips
        label="Loại thao tác"
        options={['all', ...prefixes].map((p) => ({ value: p, label: AUDIT_PREFIX_LABELS[p] ?? p }))}
        value={action}
        onChange={(v) => {
          setAction(v);
          setPage(1);
        }}
      />
      <ResourceBody status={list.status} error={list.error} empty={!logs.length} emptyTitle="Chưa có thao tác nào." onRetry={list.reload}>
        {logs.map((l) => (
          <HeyCard key={l.id} style={styles.card}>
            <Text style={styles.title}>{AUDIT_ACTION_LABELS[l.action] ?? l.action}</Text>
            <Text style={styles.muted}>
              {formatDateTime(l.createdAt)} • {l.actor.name} ({ROLE_LABELS[l.actor.role] ?? l.actor.role})
            </Text>
            {l.beforeState != null && <Text style={styles.detail}>Trước: {briefState(l.beforeState)}</Text>}
            {l.afterState != null && <Text style={styles.detail}>Sau: {briefState(l.afterState)}</Text>}
          </HeyCard>
        ))}
        {totalPages > 1 && (
          <View style={styles.pager}>
            <HeyButton title="Trang trước" variant="outline" size="sm" iconName="chevron-back" disabled={page <= 1} onPress={() => setPage((p) => p - 1)} />
            <Text style={styles.detail}>
              {page}/{totalPages}
            </Text>
            <HeyButton title="Trang sau" variant="outline" size="sm" disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)} />
          </View>
        )}
      </ResourceBody>
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.xs },
  title: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  detail: { ...Typography.caption, color: Colors.text },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
});
