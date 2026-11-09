// apps/mobile/src/screens/specialist/StrikesScreen.tsx
// GĐ E1 – Cảnh cáo tác giả (Web StrikesPage): lọc "Còn hiệu lực" (mặc định) / "Tất cả", ngưỡng strikeLimit, trạng thái, kháng nghị.
// "Ra cảnh cáo" như Web (StrikeModal, nguồn report): chọn người bán đã duyệt + lý do ≥ 10 ký tự trong bottom sheet.
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { Sheet } from '../../components/ui/Sheet';
import { StateView } from '../../components/ui/StateView';
import { FilterChips, ManagementPage, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { APPEAL_STATUS, STRIKE_SOURCES } from '../../constants/management';
import { moderationService } from '../../services/moderationService';
import { formatDate } from '../../utils/format';
import { STRIKE_REASON_MIN, strikeResultMessage, strikeState } from '../../utils/monitoring';
import { useAsyncResource } from '../../utils/useAsyncResource';

type Filter = 'active' | 'all';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'active', label: 'Còn hiệu lực' },
  { value: 'all', label: 'Tất cả' },
];

/** Sheet ra cảnh cáo: chọn người bán (hồ sơ đã duyệt) + lý do */
const IssueStrikeSheet: React.FC<{ visible: boolean; busy: boolean; onSubmit: (sellerId: string, reason: string) => void; onClose: () => void }> = ({
  visible,
  busy,
  onSubmit,
  onClose,
}) => {
  const sellers = useAsyncResource(() => (visible ? moderationService.getSellerApplications('approved') : Promise.resolve([])), [visible]);
  const [sellerId, setSellerId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!visible) return;
    setSellerId('');
    setReason('');
    setError('');
  }, [visible]);

  const submit = () => {
    if (!sellerId) return setError('Chọn người bán');
    if (reason.trim().length < STRIKE_REASON_MIN) return setError(`Lý do cảnh cáo tối thiểu ${STRIKE_REASON_MIN} ký tự`);
    onSubmit(sellerId, reason.trim());
  };

  return (
    <Sheet
      visible={visible}
      title="Cảnh cáo tác giả"
      description="Nguồn: báo cáo vi phạm. Cảnh cáo hiệu lực 90 ngày, người bán thấy lý do và được kháng nghị một lần."
      onClose={onClose}
      footer={
        <View style={styles.sheetFooter}>
          {!!error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          )}
          <HeyButton title="Cảnh cáo" variant="danger" loading={busy} onPress={submit} />
        </View>
      }
    >
      <Text style={styles.label}>Người bán</Text>
      {sellers.status === 'loading' ? (
        <StateView variant="loading" title="Đang tải người bán..." />
      ) : sellers.status === 'error' ? (
        <StateView variant="error" title="Không tải được người bán" description={sellers.error ?? ''} actionLabel="Thử lại" onAction={() => void sellers.reload()} />
      ) : !sellers.data?.length ? (
        <StateView variant="empty" title="Chưa có người bán nào được duyệt" />
      ) : (
        <View accessibilityRole="radiogroup" style={styles.list}>
          {sellers.data.map((s) => {
            const on = sellerId === s.userId;
            return (
              <Pressable
                key={s.userId}
                onPress={() => {
                  setSellerId(s.userId);
                  setError('');
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                aria-checked={on}
                accessibilityLabel={s.displayName}
                style={(st) => [styles.radio, on && styles.radioOn, st.pressed && styles.pressed, focusRing(st)]}
              >
                <Icon name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? Colors.brandStrong : Colors.textMuted} />
                <Text style={styles.body}>{s.displayName}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      <HeyInput
        label="Lý do (người bán sẽ đọc)"
        placeholder="Mô tả vi phạm: trang nào, nội dung gì…"
        value={reason}
        onChangeText={(t) => {
          setReason(t);
          setError('');
        }}
        multiline
        numberOfLines={4}
        hint={`Tối thiểu ${STRIKE_REASON_MIN} ký tự.`}
      />
    </Sheet>
  );
};

export const StrikesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [filter, setFilter] = useState<Filter>('active');
  const list = useManagementResource(() => moderationService.getStrikes({ active: filter === 'active' }), [filter]);
  const { run, busy } = useMutationRunner(list.reload);
  const [issuing, setIssuing] = useState(false);
  const strikes = list.data?.strikes ?? [];

  const issue = async (sellerId: string, reason: string) => {
    const ok = await run('strike', () => moderationService.issueStrike({ sellerId, source: 'report', reason }), strikeResultMessage);
    if (ok) {
      setIssuing(false);
      void list.reload();
    }
  };

  return (
    <ManagementPage
      title="Cảnh cáo tác giả"
      subtitle={`Cảnh cáo hiệu lực 90 ngày. Đủ ${list.data?.strikeLimit ?? 3} cảnh cáo còn hiệu lực thì tài khoản bán bị khoá. Người bán được kháng nghị, Admin xét.`}
      onBack={onBack}
      onRefresh={list.reload}
    >
      <HeyButton title="Ra cảnh cáo" iconName="add" size="sm" onPress={() => setIssuing(true)} disabled={busy} style={styles.selfStart} />
      <FilterChips label="Lọc cảnh cáo" options={FILTERS} value={filter} onChange={setFilter} />
      <ResourceBody status={list.status} error={list.error} empty={!strikes.length} emptyTitle="Không có cảnh cáo nào." onRetry={list.reload}>
        {strikes.map((s) => {
          const st = strikeState(s);
          const ap = s.appeal ? APPEAL_STATUS[s.appeal.status] : undefined;
          return (
            <HeyCard key={s.id} style={styles.card}>
              <Text style={styles.title}>{s.seller?.displayName ?? '—'}</Text>
              <View style={styles.badges}>
                {s.seller?.status === 'suspended' && <Badge label="Tài khoản bán đang khoá" tone="danger" />}
                <Badge label={st.label} tone={st.tone} />
                {!!ap && <Badge label={`Kháng nghị: ${ap.label}`} tone={ap.tone} />}
              </View>
              <Text style={styles.body}>{s.reason}</Text>
              <Text style={styles.muted}>
                {STRIKE_SOURCES[s.source] ?? s.source} • {formatDate(s.issuedAt)} • bởi {s.issuer?.name ?? '—'}
              </Text>
              {!!s.appeal && (
                <Text style={styles.muted}>
                  Lý do kháng nghị: “{s.appeal.reason}”{s.appeal.decisionNote ? ` — Admin: ${s.appeal.decisionNote}` : ''}
                </Text>
              )}
            </HeyCard>
          );
        })}
      </ResourceBody>
      <IssueStrikeSheet visible={issuing} busy={busy} onSubmit={(id, reason) => void issue(id, reason)} onClose={() => setIssuing(false)} />
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  title: { ...Typography.bodyStrong, color: Colors.text },
  body: { ...Typography.label, color: Colors.text, flex: 1 },
  muted: { ...Typography.caption, color: Colors.textMuted },
  label: { ...Typography.label, color: Colors.text, marginBottom: Spacing.xs },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  selfStart: { alignSelf: 'flex-start' },
  list: { gap: Spacing.sm, marginBottom: Spacing.md },
  radio: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: Touch.min, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.outline },
  radioOn: { borderColor: Colors.brandStrong, backgroundColor: Colors.brandTint },
  pressed: { opacity: 0.8 },
  sheetFooter: { gap: Spacing.sm, paddingTop: Spacing.sm },
  error: { ...Typography.label, color: Colors.danger },
});
