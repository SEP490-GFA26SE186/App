// apps/mobile/src/screens/parent/StoryEditorScreen.tsx
// GĐ B1 – Sửa truyện (Web: pages/parent/studio/StoryEditorPage.jsx + components/parent/studio/{PageEditor,CheckpointEditor,CoverPicker,SaveBar}).
// Chỉ API không phải AI: sửa/thêm/xoá trang, sửa/thêm/xoá điểm dừng, chọn ảnh bìa (cảnh đã có ảnh), xoá truyện, hoàn tất (review).
// GĐ B2: StoryMediaPanel (giọng đọc + tranh AI). Không cho AI viết ở đây (Chi tiết truyện). Mọi lệnh trả chi tiết truyện mới nhất → thay state.
// Điện thoại: danh sách dọc; điểm dừng sửa trong bottom sheet; thanh "Hoàn tất" cố định ở đáy; một thao tác ghi tại một thời điểm.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyInput } from '../../components/ui/HeyInput';
import { HeyChip } from '../../components/ui/HeyChip';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { Sheet } from '../../components/ui/Sheet';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useToast } from '../../components/ui/Toast';
import { useDialog } from '../../components/ui/Dialog';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { spaceActivates } from '../../utils/keyboard';
import { CHECKPOINT_TYPES, EMOTIONS, OPTION_ROLES, STORY_STATUS_LABELS } from '../../constants/story';
import { storyService } from '../../services';
import { StoryMediaPanel } from '../../components/parent/StoryMediaPanel';
import type { CheckpointTypeDto, StoryCheckpointDto, StoryDto, StoryPageDto } from '../../types/api';
import type { StoryView } from '../../types/viewModels';
import {
  CheckpointForm,
  canAddCheckpointAfter,
  checkpointBody,
  checkpointFormError,
  checkpointPath,
  checkpointTypesAfter,
  coverScenes,
  fillNames,
  firstGapPath,
  gapsByPath,
  initialCheckpointForm,
  isCheckpointLocked,
  isCustomStory,
  isUnwrittenAiStory,
  nameOfToken,
  needsTarget,
  pagePath,
  reviewFailureSummary,
  warningsByPath,
  wordCount,
} from '../../utils/storyEditor';

interface StoryEditorScreenProps {
  storyId: string;
  onBack: () => void;
  /** BE vừa trả bản truyện mới (cập nhật Tủ truyện) */
  onStoryChanged: (story: StoryView) => void;
  /** Đã xoá truyện: về Tủ truyện và làm mới danh sách */
  onDeleted: () => void;
  /** GĐ B2: số dư credit (null = chưa biết) và tải lại số dư sau khi vẽ tranh */
  creditBalance: number | null;
  onCreditsChanged: () => void;
}

const ORIGIN_LABELS: Record<string, string> = { ai: 'AI viết', ai_edited: 'AI viết, ba mẹ sửa' };

/** Một lựa chọn chọn-một dạng hàng (≥ 44pt, có icon radio, không chỉ dựa vào màu) */
const RadioRow: React.FC<{ selected: boolean; label: string; onPress: () => void; disabled?: boolean; children?: React.ReactNode }> = ({
  selected,
  label,
  onPress,
  disabled,
  children,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    {...spaceActivates(onPress)}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected, disabled }}
    aria-checked={selected}
    accessibilityLabel={label}
    style={(s) => [styles.radioRow, selected && styles.radioRowOn, s.pressed && styles.pressed, focusRing(s)]}
  >
    <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? Colors.brandStrong : Colors.textMuted} />
    <View style={styles.flex1}>{children ?? <Text style={styles.body}>{label}</Text>}</View>
  </Pressable>
);

/** Nút icon tròn ≥ 44pt (xoá trang / điểm dừng) */
const IconAction: React.FC<{ icon: 'trash-outline'; label: string; onPress: () => void; disabled?: boolean }> = ({ icon, label, onPress, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
    style={(s) => [styles.iconBtn, disabled && styles.disabled, s.pressed && styles.pressed, focusRing(s)]}
  >
    <Icon name={icon} size={20} color={Colors.danger} />
  </Pressable>
);

// ---------------------------------------------------------------------------
// Sheet sửa điểm dừng (Web EditableCheckpoint)
// ---------------------------------------------------------------------------

const CheckpointSheet: React.FC<{
  checkpoint: StoryCheckpointDto | null;
  story: StoryDto;
  saving: boolean;
  onClose: () => void;
  onSave: (cp: StoryCheckpointDto, form: CheckpointForm) => Promise<string | null>;
}> = ({ checkpoint, story, saving, onClose, onSave }) => {
  const characters = story.characters ?? [];
  const [form, setForm] = useState<CheckpointForm | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(checkpoint ? initialCheckpointForm(checkpoint, characters) : null);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkpoint?.id]);

  if (!checkpoint || !form) return null;
  const type = checkpoint.type;
  const isEmotion = type === 'emotion_self' || type === 'emotion_other';
  const set = (patch: Partial<CheckpointForm>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
    setError('');
  };
  const setOption = (i: number, patch: Partial<CheckpointForm['options'][number]>) =>
    set({ options: form.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) });

  const save = async () => {
    const clientError = checkpointFormError(type, form);
    if (clientError) return setError(clientError);
    const beError = await onSave(checkpoint, form);
    if (beError) setError(beError);
  };

  return (
    <Sheet
      visible
      title={`Điểm dừng sau trang ${checkpoint.afterPageOrder ?? '?'}`}
      description={CHECKPOINT_TYPES[type] ?? type}
      onClose={onClose}
      footer={
        <View style={styles.sheetFooter}>
          {!!error && (
            <Text style={styles.errorText} accessibilityRole="alert">
              {error}
            </Text>
          )}
          <HeyButton title="Lưu điểm dừng" iconName="checkmark" onPress={() => void save()} loading={saving} disabled={saving} />
        </View>
      }
    >
      <View style={styles.form}>
        {!!checkpoint.targetToken && <Badge label={`Hỏi về: ${nameOfToken(checkpoint.targetToken, characters)}`} tone="info" />}
        <HeyInput label="Câu hỏi cho bé" value={form.question} onChangeText={(t) => set({ question: t })} multiline numberOfLines={2} />

        {isEmotion && (
          <>
            <Text style={styles.fieldLabel}>Cảm xúc đúng{form.question.trim() ? ' *' : ''}</Text>
            <View accessibilityRole="radiogroup" style={styles.chips}>
              {Object.entries(EMOTIONS).map(([value, label]) => (
                <HeyChip key={value} label={label} selected={form.answerEmotion === value} onPress={() => set({ answerEmotion: value })} />
              ))}
            </View>
          </>
        )}

        {type === 'perspective' && (
          <>
            <Text style={styles.fieldLabel}>Ba phương án (chạm vòng tròn để đánh dấu phương án đúng)</Text>
            {form.options.map((o, i) => (
              <View key={i} style={styles.optionRow}>
                <Pressable
                  onPress={() => set({ options: form.options.map((x, j) => ({ ...x, isCorrect: j === i })) })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: !!o.isCorrect }}
                  aria-checked={!!o.isCorrect}
                  accessibilityLabel={`Phương án ${i + 1} là đúng`}
                  style={(s) => [styles.iconBtn, s.pressed && styles.pressed, focusRing(s)]}
                >
                  <Icon name={o.isCorrect ? 'radio-button-on' : 'radio-button-off'} size={24} color={o.isCorrect ? Colors.brandStrong : Colors.textMuted} />
                </Pressable>
                <View style={styles.flex1}>
                  <HeyInput placeholder={`Phương án ${i + 1}`} value={o.text} onChangeText={(t) => setOption(i, { text: t })} />
                </View>
              </View>
            ))}
          </>
        )}

        {type === 'problem_solving' && (
          <>
            <Text style={styles.fieldLabel}>Ba cách bé có thể làm (vai do khung quy định)</Text>
            {form.options.map((o, i) => {
              const role = OPTION_ROLES.find((r) => r.value === o.role);
              return (
                <HeyCard key={o.role ?? i} variant="muted" style={styles.optionCard}>
                  {!!role && <Badge label={role.label} tone={role.tone} />}
                  <HeyInput placeholder="Bé sẽ làm gì?" value={o.text} onChangeText={(t) => setOption(i, { text: t })} />
                  <HeyInput placeholder="Chuyện gì xảy ra sau đó?" value={o.feedback ?? ''} onChangeText={(t) => setOption(i, { feedback: t })} multiline numberOfLines={2} />
                </HeyCard>
              );
            })}
          </>
        )}

        {(isEmotion || type === 'perspective') && (
          <HeyInput label="Gợi ý khi bé chọn sai" value={form.hint} onChangeText={(t) => set({ hint: t })} multiline numberOfLines={2} />
        )}
      </View>
    </Sheet>
  );
};

// ---------------------------------------------------------------------------
// Sheet thêm điểm dừng (Web AddCheckpointForm)
// ---------------------------------------------------------------------------

const AddCheckpointSheet: React.FC<{
  page: StoryPageDto | null;
  story: StoryDto;
  adding: boolean;
  onClose: () => void;
  onAdd: (body: { type: CheckpointTypeDto; afterPageId: string; targetToken?: string }) => Promise<string | null>;
}> = ({ page, story, adding, onClose, onAdd }) => {
  const characters = story.characters ?? [];
  const others = characters.filter((c) => !c.isMain);
  const lastOrder = Math.max(0, ...(story.pages ?? []).map((p) => p.pageOrder));
  const types = page ? checkpointTypesAfter(page.pageOrder, lastOrder, characters) : [];
  const [type, setType] = useState<CheckpointTypeDto>('emotion_self');
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setType(types[0] ?? 'emotion_self');
    setTarget(others[0]?.token ?? '');
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id]);

  if (!page) return null;
  const withTarget = needsTarget(type);
  const add = async () => {
    if (withTarget && !target) return setError('Chọn nhân vật được hỏi');
    const beError = await onAdd({ type, afterPageId: page.id, ...(withTarget && { targetToken: target }) });
    if (beError) setError(beError);
  };

  return (
    <Sheet
      visible
      title={`Thêm điểm dừng sau trang ${page.pageOrder}`}
      description="Bé dừng đọc sau trang này để trả lời câu hỏi."
      onClose={onClose}
      footer={
        <View style={styles.sheetFooter}>
          {!!error && (
            <Text style={styles.errorText} accessibilityRole="alert">
              {error}
            </Text>
          )}
          <HeyButton title="Thêm điểm dừng" iconName="add" onPress={() => void add()} loading={adding} disabled={adding} />
        </View>
      }
    >
      <View style={styles.form}>
        <Text style={styles.fieldLabel}>Kiểu điểm dừng</Text>
        <View accessibilityRole="radiogroup" style={styles.list}>
          {types.map((t) => (
            <RadioRow key={t} selected={type === t} label={CHECKPOINT_TYPES[t] ?? t} onPress={() => { setType(t); setError(''); }} />
          ))}
        </View>
        {withTarget && (
          <>
            <Text style={styles.fieldLabel}>Hỏi về nhân vật</Text>
            <View accessibilityRole="radiogroup" style={styles.chips}>
              {others.map((c) => (
                <HeyChip key={c.token} label={c.name ?? c.token} selected={target === c.token} onPress={() => { setTarget(c.token); setError(''); }} />
              ))}
            </View>
          </>
        )}
      </View>
    </Sheet>
  );
};

// ---------------------------------------------------------------------------
// Màn chính
// ---------------------------------------------------------------------------

export const StoryEditorScreen: React.FC<StoryEditorScreenProps> = ({ storyId, onBack, onStoryChanged, onDeleted, creditBalance, onCreditsChanged }) => {
  const toast = useToast();
  const dialog = useDialog();
  const [story, setStory] = useState<StoryDto | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({}); // pageId → chữ đang sửa (chưa lưu)
  const [gaps, setGaps] = useState<Record<string, string>>({}); // "pages.<id>" | "checkpoints.<id>" → lỗi
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef(false);
  const reqRef = useRef(0);
  const [editingCp, setEditingCp] = useState<StoryCheckpointDto | null>(null);
  const [addAfter, setAddAfter] = useState<StoryPageDto | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});

  const load = useCallback(async () => {
    const req = ++reqRef.current;
    setStatus('loading');
    setLoadError('');
    try {
      const detail = await storyService.getStoryDetail(storyId);
      if (req !== reqRef.current) return;
      setStory(detail);
      setStatus('ready');
    } catch (e: any) {
      if (req !== reqRef.current) return;
      setLoadError(e?.message || 'Không tải được truyện.');
      setStatus('error');
    }
  }, [storyId]);

  useEffect(() => {
    void load();
    return () => {
      reqRef.current += 1;
    };
  }, [load]);

  const apply = (dto: StoryDto) => {
    setStory(dto);
    onStoryChanged(storyService.formatStory(dto));
  };

  /** Một thao tác ghi tại một thời điểm (chống bấm đúp). Trả lỗi (đã dịch) hoặc null. */
  const mutate = async (key: string, task: () => Promise<StoryDto | void>, opts: { success?: string; path?: string; notify?: boolean } = {}) => {
    if (busyRef.current) return 'Đang xử lý thao tác trước, ba mẹ chờ chút nhé';
    busyRef.current = true;
    setBusy(key);
    try {
      const dto = await task();
      if (dto) apply(dto);
      if (opts.path) setGaps(({ [opts.path as string]: _, ...rest }) => rest);
      if (opts.success) toast.show(opts.success);
      return null;
    } catch (e: any) {
      const message: string = e?.message || 'Có lỗi xảy ra, ba mẹ thử lại sau nhé';
      if (opts.path) setGaps((g) => ({ ...g, [opts.path as string]: message }));
      if (opts.notify) void dialog.notify('Chưa thực hiện được', message);
      return message;
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const scrollTo = (path?: string) => {
    const y = path ? positions.current[path] : undefined;
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - Spacing.lg), animated: true });
  };
  const trackY = (path: string) => (e: { nativeEvent: { layout: { y: number } } }) => {
    positions.current[path] = e.nativeEvent.layout.y;
  };

  // ---- Thao tác ----
  const savePage = (page: StoryPageDto) =>
    mutate(`page:${page.id}`, async () => {
      const dto = await storyService.updatePage(storyId, page.id, drafts[page.id] ?? '');
      setDrafts(({ [page.id]: _, ...rest }) => rest);
      return dto;
    }, { success: `Đã lưu trang ${page.pageOrder}`, path: pagePath(page.id) });

  const deletePage = async (page: StoryPageDto) => {
    if (busyRef.current) return;
    const ok = await dialog.confirm({
      title: `Xoá trang ${page.pageOrder}?`,
      message: 'Chữ của trang này sẽ bị xoá.',
      confirmLabel: 'Xoá trang',
      destructive: true,
    });
    if (!ok) return;
    await mutate(`delpage:${page.id}`, async () => {
      const dto = await storyService.deletePage(storyId, page.id);
      setDrafts(({ [page.id]: _, ...rest }) => rest);
      return dto;
    }, { success: 'Đã xoá trang', notify: true });
  };

  const addPage = () => void mutate('addpage', () => storyService.createPage(storyId), { success: 'Đã thêm trang', notify: true });

  const saveCheckpoint = async (cp: StoryCheckpointDto, form: CheckpointForm) => {
    const error = await mutate(`cp:${cp.id}`, () => storyService.updateCheckpoint(storyId, cp.id, checkpointBody(cp.type, form)), {
      success: 'Đã lưu điểm dừng',
      path: checkpointPath(cp.id),
    });
    if (!error) setEditingCp(null);
    return error;
  };

  const deleteCheckpoint = async (cp: StoryCheckpointDto) => {
    if (busyRef.current) return;
    const ok = await dialog.confirm({
      title: `Xoá điểm dừng sau trang ${cp.afterPageOrder ?? '?'}?`,
      message: 'Câu hỏi và các phương án của điểm dừng này sẽ bị xoá.',
      confirmLabel: 'Xoá điểm dừng',
      destructive: true,
    });
    if (!ok) return;
    await mutate(`delcp:${cp.id}`, () => storyService.deleteCheckpoint(storyId, cp.id), { success: 'Đã xoá điểm dừng', notify: true });
  };

  const addCheckpoint = async (body: { type: CheckpointTypeDto; afterPageId: string; targetToken?: string }) => {
    const error = await mutate('addcp', () => storyService.createCheckpoint(storyId, body), { success: 'Đã thêm điểm dừng' });
    if (!error) setAddAfter(null);
    return error;
  };

  const chooseCover = (sceneId: string | null) =>
    void mutate(`cover:${sceneId ?? 'default'}`, () => storyService.setCover(storyId, sceneId), {
      success: sceneId ? 'Đã đổi ảnh bìa' : 'Đã dùng ảnh bìa mặc định',
      notify: true,
    });

  const finish = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy('review');
    setBanner('');
    try {
      apply(await storyService.reviewStoryDetail(storyId));
      setGaps({});
      toast.show('Đã hoàn tất truyện');
    } catch (e: any) {
      const errors = Array.isArray(e?.errors) ? e.errors : [];
      if (e?.status === 422 && errors.length) {
        setGaps(gapsByPath(errors));
        setBanner(reviewFailureSummary(errors, e?.message));
        scrollTo(firstGapPath(errors));
      } else {
        void dialog.notify('Chưa hoàn tất được', e?.message || 'Vui lòng thử lại.');
      }
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const removeStory = async () => {
    if (busyRef.current) return;
    const ok = await dialog.confirm({
      title: 'Xoá truyện này?',
      message: 'Truyện, các trang và điểm dừng sẽ bị xoá và không khôi phục được.',
      confirmLabel: 'Xoá truyện',
      cancelLabel: 'Giữ lại',
      destructive: true,
    });
    if (!ok) return;
    const error = await mutate('delete', async () => {
      await storyService.deleteStory(storyId);
    }, { notify: true });
    if (!error) {
      toast.show('Đã xoá truyện');
      onDeleted();
    }
  };

  // ---- Hiển thị ----
  if (!story) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Sửa truyện" onBack={onBack} />
        {status === 'error' ? (
          <StateView variant="error" title="Không tải được truyện" description={loadError} actionLabel="Thử lại" onAction={() => void load()} />
        ) : (
          <StateView variant="loading" title="Đang tải truyện..." />
        )}
      </ScrollView>
    );
  }

  const characters = story.characters ?? [];
  const isCustom = isCustomStory(story);
  const pages = [...(story.pages ?? [])].sort((a, b) => a.pageOrder - b.pageOrder);
  const cpAfter = new Map((story.checkpoints ?? []).map((c) => [c.afterPageId, c]));
  const warnings = warningsByPath(story.keywordWarnings);
  const generating = story.status === 'generating';
  const unwritten = isUnwrittenAiStory(story);
  const scenes = story.kind !== 'published' ? coverScenes(story.scenes) : [];
  const anyBusy = busy !== null;

  const header = (
    <>
      <ScreenHeader title="Sửa truyện" subtitle={story.title} onBack={onBack} />
      <View style={styles.badges}>
        <Badge label={isCustom ? 'Tự viết' : story.entry === 'family' ? 'Kể chuyện nhà mình' : 'AI viết giúp'} tone="info" />
        <Badge label={story.reviewedAt ? 'Đã hoàn tất' : STORY_STATUS_LABELS[story.status.toUpperCase()] ?? story.status} tone={story.reviewedAt ? 'success' : 'neutral'} />
      </View>
      {characters.length > 0 && (
        <Text style={styles.muted}>Nhân vật: {characters.map((c) => `${c.name ?? c.token}${c.isMain ? ' (chính)' : ''}`).join(', ')}</Text>
      )}
    </>
  );

  if (generating || unwritten) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        {header}
        {generating ? (
          <StateView variant="loading" title="AI đang viết truyện" description="Chờ AI viết xong rồi mới sửa được. Ba mẹ có thể rời màn này." actionLabel="Tải lại" onAction={() => void load()} />
        ) : (
          <StateView variant="empty" title="Truyện chưa có chữ" description="Mở Chi tiết truyện và bấm “Cho AI viết” trước, rồi quay lại sửa." />
        )}
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} style={styles.flex1} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {header}

        {!!banner && (
          <View style={styles.banner} accessibilityRole="alert">
            <Icon name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.bannerText}>{banner}</Text>
          </View>
        )}

        {/* GĐ B2: giọng đọc + tranh từng cảnh (vẽ / vẽ tiếp / vẽ lại) */}
        <StoryMediaPanel storyId={storyId} story={story} creditBalance={creditBalance} disabled={anyBusy} onUpdated={apply} onCreditsChanged={onCreditsChanged} />

        {scenes.length > 0 && (
          <HeyCard style={styles.card}>
            <Text style={styles.heading} accessibilityRole="header">
              Ảnh bìa
            </Text>
            <Text style={styles.muted}>Chọn tranh một cảnh làm bìa (mặc định là cảnh 1).</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coverRow}>
              {scenes.map((sc) => {
                const selected = story.coverSceneId === sc.id;
                return (
                  <Pressable
                    key={sc.id}
                    onPress={() => !selected && chooseCover(sc.id)}
                    disabled={anyBusy}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected, disabled: anyBusy }}
                    aria-checked={selected}
                    accessibilityLabel={`Dùng tranh cảnh ${sc.sceneOrder ?? ''} làm bìa`}
                    style={(s) => [styles.coverItem, selected && styles.coverItemOn, s.pressed && styles.pressed, focusRing(s)]}
                  >
                    <Image source={{ uri: sc.imageUrl as string }} style={styles.coverImg} accessibilityIgnoresInvertColors />
                    <Text style={styles.coverLabel}>Cảnh {sc.sceneOrder ?? '?'}</Text>
                    {selected && (
                      <View style={styles.coverCheck}>
                        <Icon name="checkmark" size={14} color={Colors.onStrong} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
            <HeyButton
              title={story.coverSceneId == null ? 'Đang dùng ảnh mặc định' : 'Dùng ảnh mặc định'}
              iconName={story.coverSceneId == null ? 'checkmark' : 'refresh'}
              variant="tertiary"
              size="sm"
              onPress={() => chooseCover(null)}
              loading={busy === 'cover:default'}
              disabled={anyBusy || story.coverSceneId == null}
              style={styles.selfStart}
            />
          </HeyCard>
        )}

        {pages.map((page) => {
          const original = fillNames(page.contentText, characters);
          const text = drafts[page.id] ?? original;
          const dirty = text !== original;
          const cp = cpAfter.get(page.id);
          const pPath = pagePath(page.id);
          const gap = gaps[pPath];
          return (
            <React.Fragment key={page.id}>
              <View onLayout={trackY(pPath)}>
                <HeyCard style={gap ? [styles.card, styles.cardError] : styles.card}>
                  <View style={styles.rowBetween}>
                    <View style={styles.rowWrap}>
                      <Text style={styles.heading}>Trang {page.pageOrder}</Text>
                      {dirty && <Badge label="Chưa lưu" tone="warning" />}
                      {!!page.origin && !!ORIGIN_LABELS[page.origin] && <Badge label={ORIGIN_LABELS[page.origin]} tone="neutral" />}
                    </View>
                    {isCustom && <IconAction icon="trash-outline" label={`Xoá trang ${page.pageOrder}`} onPress={() => void deletePage(page)} disabled={anyBusy} />}
                  </View>
                  <HeyInput
                    value={text}
                    onChangeText={(t) => setDrafts((d) => ({ ...d, [page.id]: t }))}
                    placeholder="Viết lời kể cho trang này…"
                    multiline
                    numberOfLines={5}
                    hint={`${wordCount(text)} tiếng`}
                  />
                  {!!gap && (
                    <Text style={styles.errorText} accessibilityRole="alert">
                      {gap}
                    </Text>
                  )}
                  {!gap && !!warnings[pPath] && <Text style={styles.warnText}>{warnings[pPath]}</Text>}
                  {dirty ? (
                    <View style={styles.saveRow}>
                      <HeyButton
                        title="Hoàn tác"
                        variant="ghost"
                        size="sm"
                        onPress={() => setDrafts(({ [page.id]: _, ...rest }) => rest)}
                        disabled={busy === `page:${page.id}`}
                      />
                      <HeyButton title="Lưu trang" size="sm" onPress={() => void savePage(page)} loading={busy === `page:${page.id}`} disabled={anyBusy} />
                    </View>
                  ) : (
                    <View style={styles.savedRow}>
                      <Icon name="checkmark" size={14} color={Colors.textMuted} />
                      <Text style={styles.muted}>Đã lưu</Text>
                    </View>
                  )}
                </HeyCard>
              </View>

              {cp && (
                <View onLayout={trackY(checkpointPath(cp.id))}>
                  <CheckpointCard
                    cp={cp}
                    story={story}
                    gap={gaps[checkpointPath(cp.id)]}
                    warning={warnings[checkpointPath(cp.id)]}
                    disabled={anyBusy}
                    onEdit={() => setEditingCp(cp)}
                    onDelete={isCustom ? () => void deleteCheckpoint(cp) : undefined}
                  />
                </View>
              )}

              {canAddCheckpointAfter(page, story, !!cp) && (
                <HeyButton
                  title={`Thêm điểm dừng sau trang ${page.pageOrder}`}
                  iconName="add"
                  variant="tertiary"
                  size="sm"
                  onPress={() => setAddAfter(page)}
                  disabled={anyBusy}
                  style={styles.indent}
                />
              )}
            </React.Fragment>
          );
        })}

        {isCustom && (
          <HeyButton title="Thêm trang" iconName="add" variant="outline" onPress={addPage} loading={busy === 'addpage'} disabled={anyBusy} />
        )}

        <HeyButton title="Xoá truyện" iconName="trash-outline" variant="ghost" onPress={() => void removeStory()} loading={busy === 'delete'} disabled={anyBusy} style={styles.deleteBtn} textStyle={styles.dangerText} />
      </ScrollView>

      {/* Thanh hoàn tất cố định ở đáy (Web: thanh sticky "Hoàn tất") */}
      <View style={styles.footer}>
        <Text style={styles.footerText} numberOfLines={2}>
          {story.reviewedAt ? 'Truyện đã hoàn tất. Sửa thêm thì bấm hoàn tất lại.' : 'Xem lại hết các trang và điểm dừng rồi bấm hoàn tất.'}
        </Text>
        <HeyButton title="Hoàn tất truyện" iconName="checkmark-circle-outline" size="lg" onPress={() => void finish()} loading={busy === 'review'} disabled={anyBusy} />
      </View>

      <CheckpointSheet checkpoint={editingCp} story={story} saving={!!editingCp && busy === `cp:${editingCp.id}`} onClose={() => setEditingCp(null)} onSave={saveCheckpoint} />
      <AddCheckpointSheet page={addAfter} story={story} adding={busy === 'addcp'} onClose={() => setAddAfter(null)} onAdd={addCheckpoint} />
    </KeyboardAvoidingView>
  );
};

/** Điểm dừng trong danh sách: khoá → chỉ xem (Web LockedCheckpoint); sửa được → tóm tắt + nút Sửa / Xoá */
const CheckpointCard: React.FC<{
  cp: StoryCheckpointDto;
  story: StoryDto;
  gap?: string;
  warning?: string;
  disabled: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}> = ({ cp, story, gap, warning, disabled, onEdit, onDelete }) => {
  const characters = story.characters ?? [];
  const locked = isCheckpointLocked(cp, story);
  const form = initialCheckpointForm(cp, characters);
  const isEmotion = cp.type === 'emotion_self' || cp.type === 'emotion_other';
  return (
    <HeyCard variant="accent" style={gap ? [styles.card, styles.indent, styles.cardError] : [styles.card, styles.indent]}>
      <View style={styles.rowBetween}>
        <View style={styles.rowWrap}>
          <Icon name="help-circle-outline" size={18} color={Colors.text} />
          <Text style={[styles.heading, styles.flexShrink]}>Điểm dừng sau trang {cp.afterPageOrder ?? '?'}</Text>
        </View>
        {onDelete && !locked && <IconAction icon="trash-outline" label={`Xoá điểm dừng sau trang ${cp.afterPageOrder ?? '?'}`} onPress={onDelete} disabled={disabled} />}
      </View>
      <View style={styles.rowWrap}>
        <Badge label={CHECKPOINT_TYPES[cp.type] ?? cp.type} tone="info" />
        {!!cp.targetToken && <Badge label={`Hỏi về: ${nameOfToken(cp.targetToken, characters)}`} tone="neutral" />}
      </View>
      <Text style={styles.body}>{form.question || '(chưa có câu hỏi)'}</Text>
      {locked && (
        <>
          {isEmotion && !!cp.answerEmotion && <Text style={styles.muted}>Cảm xúc đúng: {EMOTIONS[cp.answerEmotion] ?? cp.answerEmotion}</Text>}
          {!!form.hint && <Text style={styles.muted}>Gợi ý: {form.hint}</Text>}
          {form.options.map((o, i) => (
            <Text key={i} style={styles.muted}>
              • {o.role ? `${OPTION_ROLES.find((r) => r.value === o.role)?.label}: ` : ''}
              {o.text || '—'}
              {o.isCorrect ? ' (đúng)' : ''}
            </Text>
          ))}
          <View style={styles.rowWrap}>
            <Icon name="lock-closed-outline" size={14} color={Colors.textMuted} />
            <Text style={[styles.muted, styles.flexShrink]}>Câu hỏi do khung của chuyên gia sư phạm quyết định, chỉ xem.</Text>
          </View>
        </>
      )}
      {!!gap && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {gap}
        </Text>
      )}
      {!gap && !!warning && <Text style={styles.warnText}>{warning}</Text>}
      {!locked && <HeyButton title="Sửa điểm dừng" iconName="create-outline" variant="tertiary" size="sm" onPress={onEdit} disabled={disabled} style={styles.selfStart} />}
    </HeyCard>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  content: { padding: Spacing.page, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  card: { gap: Spacing.sm },
  cardError: { borderColor: Colors.danger, borderWidth: 2 },
  indent: { marginLeft: Spacing.lg },
  heading: { ...Typography.bodyStrong, color: Colors.text },
  body: { ...Typography.body, color: Colors.text },
  muted: { ...Typography.caption, color: Colors.textMuted },
  fieldLabel: { ...Typography.label, color: Colors.text },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  rowWrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm, flexShrink: 1 },
  iconBtn: { width: Touch.min, height: Touch.min, borderRadius: Touch.min / 2, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...Typography.label, color: Colors.danger },
  warnText: { ...Typography.label, color: Colors.warning },
  saveRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  savedRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.xs, minHeight: Touch.min },
  selfStart: { alignSelf: 'flex-start' },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.dangerTint, padding: Spacing.md, borderRadius: Radius.md },
  bannerText: { ...Typography.label, color: Colors.danger, flex: 1 },
  coverRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  coverItem: { width: 96, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.outline, overflow: 'hidden', backgroundColor: Colors.surface },
  coverItemOn: { borderColor: Colors.brandStrong },
  coverImg: { width: '100%', aspectRatio: 1, backgroundColor: Colors.brandTint },
  coverLabel: { ...Typography.caption, color: Colors.text, textAlign: 'center', paddingVertical: 2 },
  coverCheck: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.brandStrong, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { alignSelf: 'center', marginTop: Spacing.lg },
  dangerText: { color: Colors.danger },
  footer: { padding: Spacing.page, paddingTop: Spacing.sm, gap: Spacing.xs, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.outline },
  footerText: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  // Sheet
  form: { gap: Spacing.md, paddingBottom: Spacing.md },
  list: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  optionCard: { gap: Spacing.sm },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: Touch.min, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.outline, backgroundColor: Colors.surface },
  radioRowOn: { borderColor: Colors.brandStrong, backgroundColor: Colors.brandTint },
  sheetFooter: { gap: Spacing.sm, paddingTop: Spacing.sm },
});
