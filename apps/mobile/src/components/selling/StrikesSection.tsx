// apps/mobile/src/components/selling/StrikesSection.tsx
// GĐ D3 – Cảnh cáo của người bán (Web StrikesPanel): số cảnh cáo còn hiệu lực / ngưỡng khoá, lý do, hạn, kháng nghị
// (mỗi cảnh cáo một lần, lý do 20–2000 ký tự, Sheet + Dialog). Không có cảnh cáo → không hiện khối (như Web).
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../ui/HeyCard';
import { HeyButton } from '../ui/HeyButton';
import { Badge } from '../ui/Badge';
import { StateView } from '../ui/StateView';
import { useDialog } from '../ui/Dialog';
import { ReasonSheet, useMutationRunner } from '../management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { APPEAL_STATUS, STRIKE_SOURCES } from '../../constants/management';
import { sellingService } from '../../services/sellingService';
import { useAsyncResource } from '../../utils/useAsyncResource';
import { formatDate } from '../../utils/format';
import { APPEAL_REASON_MAX, APPEAL_REASON_MIN, appealConfirm } from '../../utils/selling';
import type { MyStrikeDto } from '../../types/selling';

export const StrikesSection: React.FC = () => {
  const dialog = useDialog();
  const res = useAsyncResource(() => sellingService.getMyStrikes(), []);
  const { run, busy } = useMutationRunner(res.reload);
  const [appealing, setAppealing] = useState<MyStrikeDto | null>(null);
  const d = res.data;

  const appeal = async (reason: string) => {
    if (!appealing || busy) return;
    if (!(await dialog.confirm(appealConfirm))) return;
    if (await run(`appeal:${appealing.id}`, () => sellingService.appealStrike(appealing.id, reason), 'Đã gửi kháng nghị, Admin sẽ xem xét')) {
      setAppealing(null);
      void res.reload();
    }
  };

  if (res.status === 'error')
    return <StateView variant="error" title="Chưa tải được cảnh cáo" description={res.error ?? ''} actionLabel="Thử lại" onAction={() => void res.reload()} />;
  if (!d?.strikes.length) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Cảnh cáo ({d.activeStrikes}/{d.strikeLimit} còn hiệu lực)
      </Text>
      <Text style={styles.muted}>
        Mỗi cảnh cáo có hiệu lực 90 ngày. Đủ {d.strikeLimit} cảnh cáo còn hiệu lực thì tài khoản bán bị khoá. Ba mẹ được kháng nghị mỗi cảnh cáo một lần.
      </Text>
      {d.strikes.map((s) => {
        const ap = s.appeal ? APPEAL_STATUS[s.appeal.status] : undefined;
        return (
          <HeyCard key={s.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.strong, styles.flex1]}>{STRIKE_SOURCES[s.source] ?? s.source}</Text>
              <Text style={styles.muted}>{formatDate(s.issuedAt)}</Text>
            </View>
            <View style={styles.tags}>
              <Badge label={s.revokedAt ? 'Đã gỡ' : s.active ? `Hiệu lực đến ${formatDate(s.expiresAt)}` : 'Hết hạn'} tone={s.active ? 'danger' : 'neutral'} />
              {!!ap && <Badge label={`Kháng nghị: ${ap.label}`} tone={ap.tone} />}
            </View>
            <Text style={styles.body}>{s.reason}</Text>
            {!!s.appeal?.decisionNote && <Text style={styles.muted}>Admin: {s.appeal.decisionNote}</Text>}
            {s.active && !s.appeal && (
              <HeyButton title="Kháng nghị cảnh cáo này" iconName="send-outline" variant="tertiary" size="sm" onPress={() => setAppealing(s)} disabled={busy} style={styles.selfStart} />
            )}
          </HeyCard>
        );
      })}
      <ReasonSheet
        visible={!!appealing}
        title="Kháng nghị cảnh cáo"
        description={appealing ? `${STRIKE_SOURCES[appealing.source] ?? appealing.source}: ${appealing.reason}` : undefined}
        label="Lý do kháng nghị"
        placeholder="Vì sao ba mẹ cho rằng cảnh cáo này chưa đúng?"
        minLength={APPEAL_REASON_MIN}
        maxLength={APPEAL_REASON_MAX}
        confirmLabel="Gửi kháng nghị"
        busy={busy}
        onSubmit={(t) => void appeal(t)}
        onClose={() => setAppealing(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  sectionTitle: { ...Typography.heading, color: Colors.text, marginTop: Spacing.md },
  card: { gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  flex1: { flex: 1 },
  strong: { ...Typography.bodyStrong, color: Colors.text },
  body: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  selfStart: { alignSelf: 'flex-start' },
});
