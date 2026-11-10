// apps/mobile/src/screens/specialist/CheckpointReviewScreen.tsx
// GĐ E2b – Soát câu hỏi AI (Web CheckpointReviewPage): hàng đợi câu hỏi chấm điểm do AI viết (mới nhất trước, "Xem thêm" theo
// cursor của BE) lọc trạng thái / năng lực / kỹ năng con / mẫu; thống kê theo mẫu. "Ổn" / "Gắn cờ" (lý do 5–500 ký tự) / "Gỡ cờ"
// LUÔN qua Dialog, chống bấm đúp. Tên nhân vật BE đã che thành "Bạn A/B…".
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { StateView } from '../../components/ui/StateView';
import { useDialog } from '../../components/ui/Dialog';
import { FilterChips, InfoRow, ManagementPage, ReasonSheet, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { CHECKPOINT_TYPES } from '../../constants/story';
import { EMOTIONS, OPTION_ROLES } from '../../constants/management';
import { eqSkillService } from '../../services/eqSkillService';
import { pedagogyService } from '../../services/pedagogyService';
import { formatDate } from '../../utils/format';
import {
  FAMILY_SOURCE_LABELS,
  FLAG_REASON_MAX,
  FLAG_REASON_MIN,
  REVIEW_STATUS_BADGE,
  REVIEW_STATUS_OPTIONS,
  flagConfirm,
  flagRate,
  okConfirm,
  reviewActions,
  unflagConfirm,
} from '../../utils/pedagogy';
import type { CheckpointReviewItem } from '../../types/pedagogy';

const TABS = [
  { value: 'queue', label: 'Hàng đợi' },
  { value: 'stats', label: 'Thống kê theo mẫu' },
];

const StatsTab: React.FC = () => {
  const res = useManagementResource(() => pedagogyService.getCheckpointReviewStats(), []);
  return (
    <ResourceBody
      status={res.status}
      error={res.error}
      empty={!res.data?.length}
      emptyTitle="Chưa soát câu hỏi nào"
      emptyDescription="Đánh dấu “Ổn” hoặc “Gắn cờ” ở hàng đợi, số liệu theo từng mẫu sẽ hiện ở đây."
      onRetry={res.reload}
    >
      {res.data?.map((s) => (
        <HeyCard key={s.templateId} style={styles.card}>
          <Text style={styles.strong}>{s.title}</Text>
          <InfoRow label="Đã soát" value={String(s.reviewed)} />
          <InfoRow label="Bị gắn cờ" value={String(s.flagged)} />
          <InfoRow label="Tỉ lệ cờ" value={flagRate(s)} />
        </HeyCard>
      ))}
      <Text style={styles.muted}>Gộp mọi phiên bản của mẫu. Mẫu bị gắn cờ nhiều nên soạn phiên bản mới ở trang Mẫu câu hỏi.</Text>
    </ResourceBody>
  );
};

const ReviewCard: React.FC<{ item: CheckpointReviewItem; busy: boolean; busyKey: string | null; onOk: () => void; onFlag: () => void; onUnflag: () => void }> = ({
  item,
  busy,
  busyKey,
  onOk,
  onFlag,
  onUnflag,
}) => {
  const badge = REVIEW_STATUS_BADGE[item.status] ?? REVIEW_STATUS_BADGE.pending;
  const can = reviewActions(item.status);
  const family = item.family;
  return (
    <HeyCard style={styles.card}>
      <View style={styles.tags}>
        <Badge label={badge.label} tone={badge.tone} />
        {!!item.skill && <Badge label={item.skill.nameVi} tone="info" />}
      </View>
      <Text style={styles.muted}>
        {item.subSkill?.nameVi ?? '—'} · {CHECKPOINT_TYPES[item.type] ?? item.type}
        {item.template ? ` · Mẫu “${item.template.title}” v${item.template.version}` : ''} · {formatDate(item.createdAt)}
      </Text>
      {!!family && (
        <View style={styles.family}>
          <Text style={styles.label}>Kể chuyện nhà mình</Text>
          {!!family.situation && <InfoRow label="Lời kể" value={family.situation} />}
          {!!family.momentSummary && <InfoRow label="Khoảnh khắc" value={family.momentSummary} />}
          {!!family.seedEvent && <InfoRow label="Tình tiết thêm" value={family.seedEvent} />}
          {!!family.source && <InfoRow label="Nguồn kỹ năng" value={FAMILY_SOURCE_LABELS[family.source] ?? family.source} />}
        </View>
      )}
      <Text style={styles.label}>Trang ngay trước</Text>
      <Text style={styles.page}>{item.pageBefore || '—'}</Text>
      <Text style={styles.label}>Câu hỏi</Text>
      <Text style={styles.strong}>{item.question}</Text>
      {!!item.answerEmotion && <Text style={styles.body}>Đáp án cảm xúc: {EMOTIONS[item.answerEmotion] ?? item.answerEmotion}</Text>}
      {item.options.map((o, i) => (
        <View key={i} style={styles.option}>
          <Text style={[styles.body, styles.flex1]}>{o.text}</Text>
          {!!o.role && <Badge label={OPTION_ROLES[o.role] ?? o.role} tone="neutral" />}
          {o.isCorrect === true && <Badge label="Đáp án" tone="success" />}
        </View>
      ))}
      {item.status === 'flagged' && !!item.excludedReason && <Text style={styles.error}>Lý do gắn cờ: {item.excludedReason}</Text>}
      <View style={styles.actions}>
        {can.unflag && <HeyButton title="Gỡ cờ" iconName="flag-outline" variant="tertiary" size="sm" onPress={onUnflag} loading={busyKey === `unflag:${item.checkpointId}`} disabled={busy} />}
        {can.flag && <HeyButton title="Gắn cờ" iconName="flag" variant="danger" size="sm" onPress={onFlag} disabled={busy} />}
        {can.ok && <HeyButton title="Ổn" iconName="checkmark" size="sm" onPress={onOk} loading={busyKey === `ok:${item.checkpointId}`} disabled={busy} />}
      </View>
    </HeyCard>
  );
};

export const CheckpointReviewScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dialog = useDialog();
  const [tab, setTab] = useState('queue');
  const [status, setStatus] = useState('pending');
  const [skillId, setSkillId] = useState('all');
  const [subSkillId, setSubSkillId] = useState('all');
  const [templateId, setTemplateId] = useState('all');
  const [flagging, setFlagging] = useState<CheckpointReviewItem | null>(null);
  const skills = useManagementResource(() => eqSkillService.getSkills(), []);
  const subSkills = useManagementResource(() => pedagogyService.getSubSkills({ skillId }), [skillId]);
  const templates = useManagementResource(() => pedagogyService.getTemplates(subSkillId !== 'all' ? { subSkillId } : { skillId }), [skillId, subSkillId]);

  // Hàng đợi có "Xem thêm" theo cursor; đổi bộ lọc → tải lại từ đầu
  const [items, setItems] = useState<CheckpointReviewItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [qStatus, setQStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [qError, setQError] = useState('');
  const req = useRef(0);
  const load = async (after: string | null) => {
    const id = ++req.current;
    setQStatus('loading');
    try {
      const res = await pedagogyService.getCheckpointQueue({ status, skillId, subSkillId, templateId, ...(after ? { cursor: after } : {}) });
      if (id !== req.current) return;
      setItems((prev) => (after ? [...prev, ...res.items] : res.items));
      setCursor(res.nextCursor);
      setQStatus('ready');
    } catch (e: any) {
      if (id !== req.current) return;
      setQError(e?.message || 'Không tải được hàng đợi.');
      setQStatus('error');
    }
  };
  const reload = () => {
    setItems([]);
    return load(null);
  };
  useEffect(() => {
    void reload();
    return () => {
      req.current++;
    };
  }, [status, skillId, subSkillId, templateId]);
  const { run, busy, busyKey } = useMutationRunner(reload);

  const mark = async (item: CheckpointReviewItem) => {
    if (busy) return;
    if (!(await dialog.confirm(okConfirm(item.status)))) return;
    if (await run(`ok:${item.checkpointId}`, () => pedagogyService.markCheckpointOk(item.checkpointId), item.status === 'flagged' ? 'Đã gỡ cờ và đánh dấu ổn' : 'Đã đánh dấu ổn')) void reload();
  };
  const unflag = async (item: CheckpointReviewItem) => {
    if (busy) return;
    if (!(await dialog.confirm(unflagConfirm))) return;
    if (await run(`unflag:${item.checkpointId}`, () => pedagogyService.unflagCheckpoint(item.checkpointId), 'Đã gỡ cờ, câu hỏi quay lại hàng chờ soát')) void reload();
  };
  const flag = async (reason: string) => {
    if (!flagging || busy) return;
    if (!(await dialog.confirm(flagConfirm))) return;
    if (await run(`flag:${flagging.checkpointId}`, () => pedagogyService.flagCheckpoint(flagging.checkpointId, reason), 'Đã gắn cờ: câu hỏi không còn tính vào báo cáo EQ')) {
      setFlagging(null);
      void reload();
    }
  };

  const skillOptions = [{ value: 'all', label: 'Mọi năng lực' }, ...(skills.data ?? []).map((s) => ({ value: s.id, label: s.nameVi }))];
  const subOptions = [{ value: 'all', label: 'Mọi kỹ năng con' }, ...(skillId === 'all' ? [] : (subSkills.data ?? []).map((s) => ({ value: s.id, label: s.nameVi })))];
  const templateOptions = [{ value: 'all', label: 'Mọi mẫu' }, ...(templates.data ?? []).map((t) => ({ value: t.id, label: t.title }))];
  return (
    <ManagementPage
      title="Soát câu hỏi AI"
      subtitle="Câu hỏi chấm điểm do AI viết theo mẫu, mới nhất trước. “Gắn cờ” loại câu khỏi điểm và báo cáo EQ (bé vẫn đọc bình thường); “Ổn” xác nhận câu đạt, đồng thời gỡ cờ nếu có."
      onBack={onBack}
      onRefresh={tab === 'queue' ? reload : undefined}
    >
      <FilterChips label="Chế độ xem" options={TABS} value={tab} onChange={setTab} />
      {tab === 'stats' ? (
        <StatsTab />
      ) : (
        <>
          <FilterChips label="Trạng thái" options={REVIEW_STATUS_OPTIONS} value={status} onChange={setStatus} />
          <FilterChips
            label="Năng lực"
            options={skillOptions}
            value={skillId}
            onChange={(v) => {
              setSkillId(v);
              setSubSkillId('all');
              setTemplateId('all');
            }}
          />
          {skillId !== 'all' && (
            <FilterChips
              label="Kỹ năng con"
              options={subOptions}
              value={subSkillId}
              onChange={(v) => {
                setSubSkillId(v);
                setTemplateId('all');
              }}
            />
          )}
          <FilterChips label="Mẫu câu hỏi" options={templateOptions} value={templateId} onChange={setTemplateId} />
          <Text style={styles.count}>
            Câu hỏi: {items.length}
            {cursor ? '+' : ''}
          </Text>
          {items.map((item) => (
            <ReviewCard
              key={item.checkpointId}
              item={item}
              busy={busy}
              busyKey={busyKey}
              onOk={() => void mark(item)}
              onFlag={() => setFlagging(item)}
              onUnflag={() => void unflag(item)}
            />
          ))}
          {qStatus === 'loading' && <StateView variant="skeleton" title="Đang tải hàng đợi..." />}
          {qStatus === 'error' && <StateView variant="error" title="Không tải được hàng đợi" description={qError} actionLabel="Thử lại" onAction={() => void load(items.length ? cursor : null)} />}
          {qStatus === 'ready' && !items.length && (
            <StateView variant="empty" title={status === 'pending' ? 'Không còn câu nào chờ soát' : 'Không có câu hỏi phù hợp'} />
          )}
          {qStatus === 'ready' && !!cursor && <HeyButton title="Xem thêm" variant="tertiary" onPress={() => void load(cursor)} />}
        </>
      )}
      <ReasonSheet
        visible={!!flagging}
        title="Gắn cờ câu hỏi"
        description={flagging?.question}
        label="Lý do"
        placeholder="Mô tả vấn đề của điểm dừng này…"
        minLength={FLAG_REASON_MIN}
        maxLength={FLAG_REASON_MAX}
        confirmLabel="Gắn cờ"
        destructive
        busy={busy}
        onSubmit={(r) => void flag(r)}
        onClose={() => setFlagging(null)}
      />
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: Spacing.xs, marginTop: Spacing.xs },
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.outline, borderRadius: Radius.md, padding: Spacing.sm },
  family: { gap: 2, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, padding: Spacing.sm },
  page: { ...Typography.label, color: Colors.text, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, padding: Spacing.sm },
  flex1: { flex: 1 },
  count: { ...Typography.bodyStrong, color: Colors.text, marginTop: Spacing.xs },
  strong: { ...Typography.bodyStrong, color: Colors.text },
  label: { ...Typography.caption, color: Colors.textMuted, fontWeight: '700' },
  body: { ...Typography.label, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  error: { ...Typography.caption, color: Colors.danger },
});
