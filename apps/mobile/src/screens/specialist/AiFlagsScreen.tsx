// apps/mobile/src/screens/specialist/AiFlagsScreen.tsx
// GĐ E1 – Cảnh báo AI (Web AiFlagsPage): phụ huynh có nhiều lượt AI bị chặn trong 7 / 14 / 30 ngày, tối thiểu n lượt.
// Tạm khoá quyền dùng AI (1–30 ngày, lý do tuỳ chọn ≤ 2000) và mở khoá (days 0) LUÔN qua Dialog xác nhận.
// Khoá chỉ chặn AI — phụ huynh vẫn đọc và tự viết truyện.
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyChip } from '../../components/ui/HeyChip';
import { HeyInput } from '../../components/ui/HeyInput';
import { Badge } from '../../components/ui/Badge';
import { Sheet } from '../../components/ui/Sheet';
import { useDialog } from '../../components/ui/Dialog';
import { FilterChips, ManagementPage, NumberStepper, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { moderationService } from '../../services/moderationService';
import { formatDateTime } from '../../utils/format';
import {
  AI_BLOCK_DAYS,
  AI_BLOCK_DEFAULT_DAYS,
  AI_BLOCK_REASON_MAX,
  AI_FLAG_MIN_MAX,
  AI_FLAG_WINDOWS,
  aiBlockBody,
  aiBlockConfirm,
  aiUnblockConfirm,
} from '../../utils/monitoring';
import type { AiFlag } from '../../types/management';

const WINDOW_OPTIONS = AI_FLAG_WINDOWS.map((d) => ({ value: String(d), label: `${d} ngày` }));
const nameOf = (f: AiFlag) => f.fullName || f.email;

export const AiFlagsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dialog = useDialog();
  const [days, setDays] = useState('7');
  const [min, setMin] = useState(2);
  const list = useManagementResource(() => moderationService.getAiFlags({ days: Number(days), min }), [days, min]);
  const { run, busy } = useMutationRunner(list.reload);
  const [blocking, setBlocking] = useState<AiFlag | null>(null);
  const [blockDays, setBlockDays] = useState(AI_BLOCK_DEFAULT_DAYS);
  const [reason, setReason] = useState('');
  const flags = list.data?.flags ?? [];

  useEffect(() => {
    if (!blocking) return;
    setBlockDays(AI_BLOCK_DEFAULT_DAYS);
    setReason('');
  }, [blocking?.userId]);

  const block = async () => {
    if (!blocking || busy) return;
    const f = blocking;
    if (!(await dialog.confirm({ ...aiBlockConfirm(nameOf(f), blockDays), destructive: true }))) return;
    const ok = await run(`block:${f.userId}`, () => moderationService.setAiBlock(f.userId, aiBlockBody(blockDays, reason)), `Đã tạm khoá quyền dùng AI ${blockDays} ngày`);
    if (ok) {
      setBlocking(null);
      void list.reload();
    }
  };

  const unblock = async (f: AiFlag) => {
    if (busy) return;
    if (!(await dialog.confirm(aiUnblockConfirm(nameOf(f))))) return;
    if (await run(`unblock:${f.userId}`, () => moderationService.setAiBlock(f.userId, { days: 0 }), 'Đã mở khoá quyền dùng AI')) void list.reload();
  };

  return (
    <ManagementPage
      title="Cảnh báo AI"
      subtitle="Phụ huynh có nhiều lần yêu cầu AI viết nội dung bị chặn (từ khoá cấm, nội dung không phù hợp cho trẻ). Tạm khoá chỉ chặn AI viết truyện — phụ huynh vẫn đọc và tự viết được."
      onBack={onBack}
      onRefresh={list.reload}
    >
      <FilterChips label="Khoảng thời gian" options={WINDOW_OPTIONS} value={days} onChange={setDays} />
      <NumberStepper label="Có từ" value={min} min={1} max={AI_FLAG_MIN_MAX} onChange={setMin} suffix="lượt bị chặn" />
      <ResourceBody status={list.status} error={list.error} empty={!flags.length} emptyTitle="Không có phụ huynh nào bị gắn cờ" onRetry={list.reload}>
        {flags.map((f) => (
          <HeyCard key={f.userId} style={styles.card}>
            <Text style={styles.title}>{nameOf(f)}</Text>
            <Text style={styles.muted}>{f.email}</Text>
            {!!f.aiBlockedUntil && <Badge label={`Khoá AI đến ${formatDateTime(f.aiBlockedUntil)}`} tone="danger" />}
            <Text style={styles.body}>
              <Text style={styles.danger}>{f.blocked} lượt bị chặn</Text> / {f.total} lượt gọi AI ({f.blockedRate}%) • {f.failed} lượt lỗi
            </Text>
            {!!f.lastBlocked && (
              <View style={styles.last}>
                <Text style={styles.body}>
                  Gần nhất {formatDateTime(f.lastBlocked.at)}
                  {f.lastBlocked.storyTitle ? ` — truyện “${f.lastBlocked.storyTitle}”` : ''}: <Text style={styles.muted}>{f.lastBlocked.reason ?? ''}</Text>
                </Text>
              </View>
            )}
            {f.aiBlockedUntil ? (
              <HeyButton title="Mở khoá" iconName="lock-open-outline" variant="outline" size="sm" onPress={() => void unblock(f)} disabled={busy} style={styles.selfStart} />
            ) : (
              <HeyButton title="Tạm khoá quyền dùng AI" iconName="lock-closed-outline" variant="outline" size="sm" onPress={() => setBlocking(f)} disabled={busy} style={styles.selfStart} />
            )}
          </HeyCard>
        ))}
      </ResourceBody>

      <Sheet
        visible={!!blocking}
        title="Tạm khoá quyền dùng AI"
        description={blocking ? `${nameOf(blocking)} — phụ huynh vẫn đọc và tự viết truyện được.` : undefined}
        onClose={() => setBlocking(null)}
        footer={<HeyButton title={`Khoá ${blockDays} ngày`} variant="danger" iconName="lock-closed-outline" loading={busy} onPress={() => void block()} />}
      >
        <Text style={styles.label}>Số ngày khoá</Text>
        <View accessibilityRole="radiogroup" style={styles.chips}>
          {AI_BLOCK_DAYS.map((d) => (
            <HeyChip key={d} label={`${d} ngày`} selected={blockDays === d} onPress={() => setBlockDays(d)} />
          ))}
        </View>
        <HeyInput
          label="Lý do (ghi nhật ký, không bắt buộc)"
          value={reason}
          onChangeText={(t) => setReason(t.slice(0, AI_BLOCK_REASON_MAX))}
          multiline
          numberOfLines={3}
          hint={`${reason.trim().length}/${AI_BLOCK_REASON_MAX}`}
        />
      </Sheet>
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  title: { ...Typography.bodyStrong, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  body: { ...Typography.label, color: Colors.text },
  danger: { color: Colors.danger },
  last: { backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, padding: Spacing.sm },
  selfStart: { alignSelf: 'flex-start' },
  label: { ...Typography.label, color: Colors.text, marginBottom: Spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
});
