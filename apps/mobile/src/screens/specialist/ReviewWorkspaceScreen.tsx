// apps/mobile/src/screens/specialist/ReviewWorkspaceScreen.tsx
// Lượt duyệt một truyện đăng bán (Web ReviewWorkspacePage): nhận bài (giữ có thời hạn; người khác giữ → 409) → đọc từng trang,
// đánh dấu đã xem (+ nhận xét) → checklist 7 nguyên tắc (chỉ ở client, không gửi API) → quyết định có xác nhận.
// Nút Duyệt chỉ bật khi đã xem 100% trang và tick đủ checklist; quyết định khác bắt buộc nhận xét (BE kiểm lại tất cả).
// Giọng đọc từng trang chỉ nghe được trên Web (Mobile chưa có trình phát âm thanh cho file audio).
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { useDialog } from '../../components/ui/Dialog';
import { ManagementPage, ResourceBody, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { CASEL } from '../../constants/eq';
import { CHECKPOINT_TYPES } from '../../constants/story';
import { CONTENT_ORIGIN, DECISION_ACTIONS, DECISION_LABELS, EMOTIONS, LISTING_STATUS, OPTION_ROLES, REVIEW_CHECKLIST, REVIEW_TYPES } from '../../constants/management';
import { moderationService } from '../../services/moderationService';
import { listingPrice, withNames } from '../../utils/format';
import { decisionError, reviewGate } from '../../utils/managementRules';
import type { ReviewCheckpoint, ReviewDecision, ReviewDetail } from '../../types/management';

const OriginBadge: React.FC<{ origin?: string }> = ({ origin }) => {
  const tag = origin ? CONTENT_ORIGIN[origin] : undefined;
  return tag ? <Badge label={tag.label} tone={tag.tone} /> : null;
};

const CheckpointBlock: React.FC<{ cp: ReviewCheckpoint; characters: { token: string; name: string }[] }> = ({ cp, characters }) => {
  const n = (s?: string | null) => withNames(s, characters);
  return (
    <View style={styles.checkpoint}>
      <View style={styles.rowWrap}>
        <Text style={styles.checkpointTitle}>Điểm dừng: {CHECKPOINT_TYPES[cp.type] ?? cp.type}</Text>
        <OriginBadge origin={cp.origin} />
      </View>
      <Text style={styles.body}>
        <Text style={styles.bold}>Câu hỏi:</Text> {n(cp.question)}
      </Text>
      {!!cp.answerEmotion && (
        <Text style={styles.body}>
          <Text style={styles.bold}>Đáp án:</Text> {EMOTIONS[cp.answerEmotion] ?? cp.answerEmotion}
        </Text>
      )}
      {!!cp.hint && (
        <Text style={styles.body}>
          <Text style={styles.bold}>Gợi ý:</Text> {n(cp.hint)}
        </Text>
      )}
      {cp.options?.map((o) => (
        <Text key={o.id} style={styles.body}>
          • {n(o.text)}
          {o.isCorrect ? <Text style={styles.correct}> ✓ đúng</Text> : null}
          {o.role ? <Text style={styles.muted}> ({OPTION_ROLES[o.role] ?? o.role})</Text> : null}
          {o.feedback ? <Text style={styles.muted}> → {n(o.feedback)}</Text> : null}
        </Text>
      ))}
    </View>
  );
};

export const ReviewWorkspaceScreen: React.FC<{ reviewId: string; onBack: () => void; onChanged: () => void }> = ({ reviewId, onBack, onChanged }) => {
  const dialog = useDialog();
  const res = useManagementResource(() => moderationService.getReview(reviewId), [reviewId]);
  // Mọi thao tác BE trả lại chi tiết mới → dùng bản đó (không cập nhật lạc quan)
  const [latest, setLatest] = useState<ReviewDetail | null>(null);
  const data = latest ?? res.data;
  const { run, busyKey, busy } = useMutationRunner(() => reload());
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [comment, setComment] = useState('');
  const [strike, setStrike] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reload = async () => {
    setLatest(null);
    await res.reload();
  };

  const mutate = (key: string, fn: () => Promise<ReviewDetail>, message: string) =>
    run(
      key,
      async () => {
        setLatest(await fn());
        onChanged();
      },
      message
    );

  const body = () => {
    if (!data) return null;
    const { review, listing, seller, story, pageViews } = data;
    const passed = REVIEW_CHECKLIST.filter((i) => checks[i.code]).length;
    const gate = reviewGate(data, passed, REVIEW_CHECKLIST.length);
    const viewed = new Map(pageViews.map((v) => [v.pageId, v]));
    const cpAfter = new Map(story.checkpoints.map((c) => [c.afterPageId, c]));
    const type = REVIEW_TYPES[review.reviewType];
    const status = LISTING_STATUS[listing.status];
    const decisions = DECISION_ACTIONS[gate.isFollowup ? 'followup' : 'submission'];
    const aiPages = story.pages.filter((p) => p.origin === 'ai').length;
    const aiCps = story.checkpoints.filter((c) => c.origin === 'ai').length;
    const competency = story.topic?.competency;

    const submit = async (decision: ReviewDecision) => {
      const err = decisionError(data, decision, comment);
      setFormError(err);
      if (err) return;
      const label = decisions.find((d) => d.value === decision)?.label ?? decision;
      const ok = await dialog.confirm({
        title: label,
        message: `“${listing.title}” của ${seller}.${decision === 'taken_down' ? ' Truyện bị gỡ hẳn và tác giả tự động bị cảnh cáo.' : ''}${decision === 'rejected' && strike ? ' Kèm cảnh cáo tác giả.' : ''} Quyết định không hoàn tác được.`,
        confirmLabel: label,
        destructive: decision !== 'approved',
      });
      if (!ok) return;
      const payload = { decision, comment: comment.trim() || undefined, ...(decision === 'rejected' && strike && !gate.isFollowup ? { issueStrike: true } : {}) };
      await mutate(`decide:${decision}`, () => moderationService.decide(reviewId, payload), 'Đã lưu quyết định');
    };

    return (
      <View style={styles.stack}>
        <HeyCard style={styles.stack}>
          <View style={styles.rowWrap}>
            <Badge label={type.label} tone={type.tone} />
            {gate.isFollowup && !!status && <Badge label={status.label} tone={status.tone} />}
            {!!competency && <Badge label={CASEL[competency]?.label ?? competency} tone="success" />}
            <Badge label={listingPrice(listing.priceVnd)} tone="neutral" />
            {listing.hasAiContent && <Badge label="Có AI hỗ trợ" tone="info" />}
          </View>
          {!!listing.previousListingId && <Badge label="Phiên bản mới — duyệt xong sẽ thay bản đang bán" tone="warning" />}
          <Text style={styles.title} accessibilityRole="header">
            {listing.title}
          </Text>
          <Text style={styles.muted}>
            Người bán: {seller} • Bài học: {story.topic?.title ?? 'không có'} • Nhân vật: {story.characters.map((c) => c.name).join(', ') || '—'}
          </Text>
          {!!listing.description && <Text style={styles.body}>{listing.description}</Text>}
          {gate.decided ? (
            <Badge label={`Đã quyết định: ${review.decision ? DECISION_LABELS[review.decision] : '—'}`} tone="success" />
          ) : review.claimedByMe ? (
            <Badge label={`Bạn đang giữ bài đến ${review.claimExpiresAt ? new Date(review.claimExpiresAt).toLocaleTimeString('vi-VN') : '—'}`} tone="warning" />
          ) : (
            <HeyButton
              title="Nhận bài để duyệt"
              iconName="lock-closed-outline"
              loading={busyKey === 'claim'}
              disabled={busy}
              onPress={() => void mutate('claim', () => moderationService.claimReview(reviewId), 'Đã nhận bài')}
            />
          )}
        </HeyCard>

        {aiPages + aiCps > 0 && (
          <HeyCard variant="brand">
            <Text style={styles.body} accessibilityRole="alert">
              <Text style={styles.bold}>Nội dung AI chưa chỉnh sửa:</Text> {aiPages}/{gate.pagesTotal} trang, {aiCps}/{story.checkpoints.length} điểm dừng do AI viết và người bán chưa sửa chữ nào — hãy đọc kỹ hơn những phần này.
            </Text>
          </HeyCard>
        )}

        <Text style={styles.progress} accessibilityLiveRegion="polite">
          Đã xem {gate.pagesViewed}/{gate.pagesTotal} trang • Checklist đạt {passed}/{REVIEW_CHECKLIST.length}
        </Text>

        {story.pages.map((page) => {
          const seen = viewed.get(page.id);
          const cp = cpAfter.get(page.id);
          return (
            <View key={page.id} style={styles.stack}>
              <HeyCard style={seen ? [styles.stack, styles.pageSeen] : styles.stack}>
                <View style={styles.rowBetween}>
                  <View style={styles.rowWrap}>
                    <Text style={styles.pageTitle}>Trang {page.pageOrder}</Text>
                    <OriginBadge origin={page.origin} />
                  </View>
                  {!!seen && (
                    <View style={styles.rowWrap}>
                      <Icon name="checkmark-circle" size={18} color={Colors.tealStrong} />
                      <Text style={styles.seen}>Đã xem</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.pageText}>{withNames(page.contentText, story.characters)}</Text>
                {gate.canAct ? (
                  <>
                    <HeyInput
                      label={`Nhận xét trang ${page.pageOrder} (không bắt buộc)`}
                      value={notes[page.id] ?? seen?.comment ?? ''}
                      onChangeText={(t) => setNotes((m) => ({ ...m, [page.id]: t.slice(0, 2000) }))}
                      multiline
                      numberOfLines={2}
                    />
                    <HeyButton
                      title={seen ? 'Lưu nhận xét' : 'Đánh dấu đã xem'}
                      iconName="eye-outline"
                      variant="outline"
                      size="sm"
                      loading={busyKey === `view:${page.id}`}
                      disabled={busy}
                      onPress={() =>
                        void mutate(`view:${page.id}`, () => moderationService.viewPage(reviewId, page.id, notes[page.id]), seen ? 'Đã lưu nhận xét' : `Đã xem trang ${page.pageOrder}`)
                      }
                    />
                  </>
                ) : (
                  !!seen?.comment && <Text style={styles.muted}>Nhận xét: {seen.comment}</Text>
                )}
              </HeyCard>
              {!!cp && <CheckpointBlock cp={cp} characters={story.characters} />}
            </View>
          );
        })}

        <HeyCard style={styles.stack}>
          <Text style={styles.section} accessibilityRole="header">
            Checklist 7 nguyên tắc
          </Text>
          {REVIEW_CHECKLIST.map((item) => {
            const on = !!checks[item.code];
            return (
              <Pressable
                key={item.code}
                disabled={!gate.canAct}
                onPress={() => setChecks((m) => ({ ...m, [item.code]: !on }))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on, disabled: !gate.canAct }}
                aria-checked={on}
                accessibilityLabel={item.description}
                style={(s) => [styles.check, !gate.canAct && styles.disabled, focusRing(s)]}
              >
                <Icon name={on ? 'checkbox' : 'square-outline'} size={24} color={on ? Colors.tealStrong : Colors.textMuted} />
                <Text style={styles.checkText}>{item.description}</Text>
              </Pressable>
            );
          })}
          <HeyInput
            label={gate.isFollowup ? 'Nhận xét chung (bắt buộc khi gỡ hẳn — người bán thấy đây là lý do cảnh cáo)' : 'Nhận xét chung (bắt buộc khi yêu cầu sửa / từ chối)'}
            value={comment}
            onChangeText={(t) => setComment(t.slice(0, 4000))}
            multiline
            numberOfLines={3}
            editable={gate.canAct}
          />
          {!gate.isFollowup && (
            <Pressable
              disabled={!gate.canAct}
              onPress={() => setStrike((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: strike, disabled: !gate.canAct }}
              aria-checked={strike}
              style={(s) => [styles.check, !gate.canAct && styles.disabled, focusRing(s)]}
            >
              <Icon name={strike ? 'checkbox' : 'square-outline'} size={24} color={strike ? Colors.danger : Colors.textMuted} />
              <Text style={styles.checkText}>Khi từ chối: cảnh cáo tác giả (vi phạm nghiêm trọng, cố ý)</Text>
            </Pressable>
          )}
          {!!formError && (
            <Text style={styles.error} accessibilityRole="alert">
              {formError}
            </Text>
          )}
          {decisions.map((d) => (
            <HeyButton
              key={d.value}
              title={d.label}
              variant={d.value === 'approved' ? 'primary' : 'outline'}
              loading={busyKey === `decide:${d.value}`}
              disabled={!gate.canAct || busy || (d.value === 'approved' && !gate.canApprove)}
              onPress={() => void submit(d.value)}
            />
          ))}
          {gate.canAct && !gate.canApprove && (
            <Text style={styles.muted}>
              Xem hết {gate.pagesTotal} trang (bấm “Đánh dấu đã xem”) và tick đủ {REVIEW_CHECKLIST.length} mục checklist để bật nút {decisions[0].label}.
            </Text>
          )}
          {!gate.canAct && !gate.decided && <Text style={styles.muted}>Nhận bài trước khi đánh dấu trang và quyết định.</Text>}
          {gate.decided && !!review.comment && <Text style={styles.muted}>Nhận xét đã gửi: {review.comment}</Text>}
          <Text style={styles.muted}>Giọng đọc của từng trang hiện chỉ nghe được trên bản Web.</Text>
        </HeyCard>
      </View>
    );
  };

  return (
    <ManagementPage title="Lượt duyệt" onBack={onBack} onRefresh={reload}>
      <ResourceBody status={latest ? 'ready' : res.status} error={res.error} empty={false} emptyTitle="" onRetry={() => void reload()}>
        {body()}
      </ResourceBody>
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.xs },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, flexWrap: 'wrap' },
  title: { ...Typography.title, color: Colors.text },
  section: { ...Typography.heading, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  body: { ...Typography.body, fontSize: 14, color: Colors.text },
  bold: { fontFamily: FontFamily.extraBold },
  correct: { fontFamily: FontFamily.extraBold, color: Colors.tealDeep },
  progress: { ...Typography.label, color: Colors.text },
  pageSeen: { borderColor: Colors.tealBright },
  pageTitle: { ...Typography.heading, color: Colors.text },
  pageText: { ...Typography.body, color: Colors.text },
  seen: { ...Typography.label, color: Colors.tealDeep },
  checkpoint: { marginLeft: Spacing.lg, gap: Spacing.xs, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.outlineStrong, backgroundColor: Colors.surfaceWarm },
  checkpointTitle: { ...Typography.label, fontFamily: FontFamily.extraBold, color: Colors.tealDeep },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, minHeight: Touch.min, paddingVertical: Spacing.xs, borderRadius: Radius.sm },
  checkText: { ...Typography.body, fontSize: 14, color: Colors.text, flex: 1 },
  disabled: { opacity: 0.5 },
  error: { ...Typography.label, color: Colors.danger },
});
