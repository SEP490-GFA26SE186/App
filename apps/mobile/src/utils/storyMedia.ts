// apps/mobile/src/utils/storyMedia.ts
// GĐ B2 – logic thuần cho tranh AI và giọng đọc (không React Native, test được bằng Node).
// Nguồn: Web pages/parent/studio/CreateStoryPage.jsx (imagesMax / imagePlan), StoryEditorPage.jsx (missingScenes),
// components/parent/studio/{narrationState.js, ScenePicture.jsx}, hooks/useStudio.js (polling, refreshCreditWhenDrawn);
// BE stories/lib/narration.js (narrationProgress), stories.images.service.js.
import type { AiPricingDto, NarrationDto, StoryDto, StorySceneDto } from '../types/api';

// ---- Giọng đọc (Web narrationState.js) ----

export type NarrationPhase = 'ready' | 'working' | 'failed' | 'stale';
export interface NarrationState {
  phase: NarrationPhase;
  percent: number;
  n: NarrationDto;
}

/** null = không cần hiện (chưa hoàn tất / tắt giọng đọc / BE chưa trả tiến độ) */
export const narrationState = (story: { reviewedAt?: string | null; narration?: NarrationDto | null } | null | undefined): NarrationState | null => {
  const n = story?.narration;
  if (!story?.reviewedAt || !n?.enabled) return null;
  const percent = n.total ? Math.round((n.ready / n.total) * 100) : 100;
  if (n.complete) return { phase: 'ready', percent: 100, n };
  if (n.pending > 0) return { phase: 'working', percent, n };
  // Hết đoạn đang chờ mà vẫn thiếu: lỗi (thử lại được) hoặc chữ đã sửa sau lần hoàn tất (bấm hoàn tất lại)
  return { phase: n.failed > 0 ? 'failed' : 'stale', percent, n };
};

// ---- Tranh từng cảnh ----

const DRAWING = new Set(['queued', 'generating']);

export type SceneState = 'ready' | 'drawing' | 'waiting' | 'failed' | 'none';

/** queued = đang chờ vẽ chân dung nhân vật trước; generating = AI đang vẽ (Web ScenePicture) */
export const sceneState = (scene: StorySceneDto): SceneState => {
  if (scene.imageStatus === 'generating') return 'drawing';
  if (scene.imageStatus === 'queued') return 'waiting';
  if (scene.imageStatus === 'failed') return 'failed';
  if (scene.imageUrl && scene.imageStatus === 'ready') return 'ready';
  return 'none';
};

export const countDrawingScenes = (story?: Pick<StoryDto, 'scenes'> | null): number =>
  (story?.scenes ?? []).filter((s) => DRAWING.has(s.imageStatus ?? '')).length;

/** Cảnh vẽ được (BE chỉ vẽ cảnh có mô tả; truyện tự viết chưa có mô tả cảnh) */
export const canDrawScene = (scene: StorySceneDto): boolean => !!scene.description?.trim();

/** Truyện bật tranh, không còn cảnh đang vẽ, còn cảnh chưa có tranh (thường do hết credit giữa chừng) → khung "Vẽ tiếp" */
export const missingScenes = (story: Pick<StoryDto, 'useAiImage' | 'scenes'>): StorySceneDto[] =>
  story.useAiImage && countDrawingScenes(story) === 0 ? (story.scenes ?? []).filter((s) => canDrawScene(s) && s.imageStatus === 'none') : [];

/** Truyện AI chưa bật tranh nhưng có mô tả cảnh → khung "Thêm tranh minh hoạ AI" (Web StoryEditorPage) */
export const canOfferAiImages = (story: Pick<StoryDto, 'length' | 'useAiImage' | 'scenes' | 'kind'>): boolean =>
  story.length !== 'custom' && !story.useAiImage && story.kind !== 'published' && (story.scenes ?? []).some(canDrawScene);

/** Cần hỏi lại BE: còn đoạn giọng đọc đang chờ hoặc cảnh đang vẽ (Web useStory refetchInterval) */
export const shouldPollStory = (story?: Pick<StoryDto, 'narration' | 'scenes'> | null): boolean =>
  (story?.narration?.pending ?? 0) > 0 || countDrawingScenes(story) > 0;

// ---- Chi phí tranh khi tạo truyện (Web CreateStoryPage imagesMax / imagePlan) ----

/** Chân dung còn thiếu = nhân vật đã chọn, chưa có ảnh và chưa từng vẽ (portraitStatus 'none') */
export const missingPortraitCount = (
  characters: { id: string; photoReferenceUrl?: string; portraitStatus?: string | null }[],
  selectedIds: string[],
): number => characters.filter((c) => selectedIds.includes(c.id) && !c.photoReferenceUrl && c.portraitStatus === 'none').length;

export interface ImagePlan {
  /** Tối đa credit tranh: maxScenes × scene + chân dung còn thiếu × characterPortrait */
  imagesMax: number;
  /** Số dư sau khi AI viết chữ (null = chưa biết) */
  afterCost: number | null;
  /** null = chưa đủ dữ liệu để báo (chưa biết số dư / giá) hoặc không đủ tiền viết chữ */
  plan: { scenes: number; full: boolean; none: boolean } | null;
}

export const imagePlan = (args: {
  isAi: boolean;
  useAiImage: boolean;
  images?: AiPricingDto['images'];
  missingPortraits: number;
  creditBalance: number | null;
  /** Giá AI viết chữ của độ dài đang chọn */
  textCost: number | undefined;
}): ImagePlan => {
  const { isAi, useAiImage, images, missingPortraits, creditBalance, textCost } = args;
  const afterCost = creditBalance != null && textCost != null ? creditBalance - textCost : null;
  const imagesMax = isAi && useAiImage && images ? images.maxScenes * images.scene + missingPortraits * images.characterPortrait : 0;
  if (!imagesMax || !images || afterCost == null || afterCost < 0) return { imagesMax, afterCost, plan: null };
  const portraitCost = missingPortraits * images.characterPortrait;
  const scenes = afterCost < portraitCost ? 0 : images.scene > 0 ? Math.min(images.maxScenes, Math.floor((afterCost - portraitCost) / images.scene)) : images.maxScenes;
  return { imagesMax, afterCost, plan: { scenes, full: afterCost >= imagesMax, none: scenes === 0 } };
};

/** Tiêu đề khung cảnh báo (Web imageNotice) */
export const imagePlanTitle = (plan: NonNullable<ImagePlan['plan']>, maxScenes: number): string =>
  plan.full ? `Đủ credit vẽ cả ${maxScenes} cảnh` : plan.none ? 'Truyện sẽ không có tranh' : `Chỉ đủ credit vẽ ${plan.scenes}/${maxScenes} cảnh`;

// ---- Hỏi lại BE khi đang vẽ / đang tạo giọng đọc ----

export interface StoryPoller {
  start: (initial: Pick<StoryDto, 'narration' | 'scenes'>) => void;
  stop: () => void;
}
export type PollStop = 'done' | 'limit' | 'error' | 'cancelled';

/**
 * Hỏi lại GET /stories/:id mỗi `intervalMs` khi còn việc chạy nền. Dừng khi: hết việc ('done'), quá `maxPolls` lần
 * ('limit', không polling vô hạn), `maxFailures` lần lỗi liên tiếp ('error'), hoặc `stop()` (rời màn: 'cancelled').
 * Số cảnh đang vẽ giảm (xong hoặc lỗi – BE hoàn credit) → `onDrawn()` để tải lại số credit (Web f0fa6b3).
 */
export const createStoryPoller = (opts: {
  load: () => Promise<StoryDto>;
  onData: (story: StoryDto) => void;
  onDrawn: () => void;
  onStop?: (reason: PollStop) => void;
  intervalMs?: number;
  maxPolls?: number;
  maxFailures?: number;
  schedule?: (fn: () => void, ms: number) => unknown;
  cancel?: (handle: unknown) => void;
}): StoryPoller => {
  const intervalMs = opts.intervalMs ?? 5000;
  const maxPolls = opts.maxPolls ?? 120; // 120 × 5 s = 10 phút (giọng đọc 8 trang ~5–6 phút)
  const maxFailures = opts.maxFailures ?? 4;
  const schedule = opts.schedule ?? ((fn, ms) => setTimeout(fn, ms));
  const cancel = opts.cancel ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  let handle: unknown;
  let stopped = false;
  let polls = 0;
  let failures = 0;
  let drawing = 0;

  const finish = (reason: PollStop) => {
    if (stopped) return;
    stopped = true;
    if (handle !== undefined) cancel(handle);
    handle = undefined;
    opts.onStop?.(reason);
  };

  const tick = async () => {
    handle = undefined;
    if (stopped) return;
    polls += 1;
    try {
      const story = await opts.load();
      if (stopped) return;
      failures = 0;
      const now = countDrawingScenes(story);
      if (now < drawing) opts.onDrawn();
      drawing = now;
      opts.onData(story);
      if (!shouldPollStory(story)) return finish('done');
    } catch {
      if (stopped) return;
      failures += 1;
      if (failures >= maxFailures) return finish('error');
    }
    if (polls >= maxPolls) return finish('limit');
    handle = schedule(() => void tick(), intervalMs);
  };

  return {
    start: (initial) => {
      if (stopped || handle !== undefined) return;
      drawing = countDrawingScenes(initial);
      if (!shouldPollStory(initial)) return finish('done');
      handle = schedule(() => void tick(), intervalMs);
    },
    stop: () => finish('cancelled'),
  };
};

/** Vẽ tranh / vẽ lại cảnh: gọi BE → tải lại credit (đã giữ) → tải lại truyện (Web useStoryImages). Lỗi BE ném ra, không refresh giả. */
export const drawAndRefresh = async <T>(task: () => Promise<T>, deps: { onCreditsChanged: () => void; reload: () => Promise<unknown> }): Promise<T> => {
  const result = await task();
  deps.onCreditsChanged();
  await deps.reload();
  return result;
};
