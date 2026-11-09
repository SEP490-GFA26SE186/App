// apps/mobile/src/utils/storyEditor.ts
// Logic thuần của màn Sửa truyện (không React Native, test được bằng Node).
// Nguồn: Web components/parent/studio/{CheckpointEditor,PageEditor}.jsx, pages/.../StoryEditorPage.jsx,
// utils/storyNames.js; luật BE: stories/lib/editorRules.js (checkCheckpointEdit), lib/storyFormat.js (locked).
import type { CheckpointTypeDto, KeywordWarningDto, StoryCharacterRefDto, StoryCheckpointDto, StoryDto, StoryPageDto, StorySceneDto } from '../types/api';
import type { CheckpointOptionInput, UpdateCheckpointBody } from '../services/storyService';
import { translateErrorMessage } from '../services/errorMessages';
import { NEEDS_TARGET, OPTION_ROLES, OptionRole } from '../constants/story';

// ---- Tên nhân vật ↔ token {NVn} ----
// BE lưu chữ dạng token; hiển thị/sửa thì đổi sang tên, lưu thì gửi chữ có tên (BE tự đổi lại thành token).

/** characters: [{ token: "{NV1}", name }] → chữ có tên. Token không có tên giữ nguyên. */
export const fillNames = (text: string | null | undefined, characters: StoryCharacterRefDto[] = []): string => {
  if (text == null) return '';
  const byToken = new Map(characters.filter((c) => c.name).map((c) => [c.token, c.name as string]));
  return text.replace(/\{NV\d+\}/g, (token) => byToken.get(token) ?? token);
};

/** Tên nhân vật ứng với token (nhãn "Hỏi về …") */
export const nameOfToken = (token: string, characters: StoryCharacterRefDto[] = []): string =>
  characters.find((c) => c.token === token)?.name ?? token;

// ---- Quyền sửa ----

export const isCustomStory = (story: Pick<StoryDto, 'length'>): boolean => story.length === 'custom';

/** Điểm dừng chỉ xem: BE khoá (`locked`, truyện AI) hoặc truyện "Kể chuyện nhà mình" (Web CheckpointEditor) */
export const isCheckpointLocked = (cp: Pick<StoryCheckpointDto, 'locked'>, story: Pick<StoryDto, 'entry'>): boolean =>
  cp.locked === true || story.entry === 'family';

/** Truyện AI chưa có chữ (chưa viết / viết lỗi): chưa hiện editor, việc cho AI viết nằm ở màn Chi tiết truyện */
export const isUnwrittenAiStory = (story: Pick<StoryDto, 'length' | 'pages'>): boolean =>
  !isCustomStory(story) && (story.pages ?? []).every((p) => !p.contentText?.trim());

/** Thêm điểm dừng sau trang: chỉ truyện tự viết, trang chưa có điểm dừng, không sau trang 1 (BE customRules) */
export const canAddCheckpointAfter = (page: Pick<StoryPageDto, 'pageOrder'>, story: Pick<StoryDto, 'length'>, hasCheckpoint: boolean): boolean =>
  isCustomStory(story) && !hasCheckpoint && page.pageOrder > 1;

/** Kiểu điểm dừng chọn được sau một trang: `reflection` chỉ sau trang cuối; kiểu hỏi nhân vật khác cần có nhân vật phụ */
export const checkpointTypesAfter = (pageOrder: number, lastPageOrder: number, characters: StoryCharacterRefDto[] = []): CheckpointTypeDto[] => {
  const hasOthers = characters.some((c) => !c.isMain);
  const all: CheckpointTypeDto[] = ['emotion_self', 'emotion_other', 'perspective', 'problem_solving', 'reflection'];
  return all.filter((t) => (t !== 'reflection' || pageOrder === lastPageOrder) && (!(NEEDS_TARGET as readonly string[]).includes(t) || hasOthers));
};

export const needsTarget = (type: CheckpointTypeDto): boolean => (NEEDS_TARGET as readonly string[]).includes(type);

// ---- Form điểm dừng ----

export interface CheckpointOptionForm {
  text: string;
  isCorrect?: boolean;
  role?: OptionRole;
  feedback?: string;
}
export interface CheckpointForm {
  question: string;
  hint: string;
  answerEmotion: string; // '' = chưa chọn
  options: CheckpointOptionForm[];
}

const OPTION_COUNT = 3;
const isEmotionType = (type: CheckpointTypeDto) => type === 'emotion_self' || type === 'emotion_other';

/** Trạng thái form từ điểm dừng của BE (token → tên). Hai kiểu có phương án luôn đủ 3 phương án. */
export const initialCheckpointForm = (cp: StoryCheckpointDto, characters: StoryCharacterRefDto[] = []): CheckpointForm => {
  const name = (t?: string | null) => fillNames(t, characters);
  const sorted = [...(cp.options ?? [])].sort((a, b) => a.optionOrder - b.optionOrder);
  let options: CheckpointOptionForm[] = [];
  if (cp.type === 'perspective') {
    options = Array.from({ length: OPTION_COUNT }, (_, i) => ({ text: name(sorted[i]?.text), isCorrect: sorted[i]?.isCorrect === true }));
  } else if (cp.type === 'problem_solving') {
    // Vai do khung quy định: giữ vai có sẵn, thiếu thì lấp theo thứ tự xây dựng / né tránh / bốc đồng
    const byRole = new Map(sorted.map((o) => [o.role, o]));
    options = OPTION_ROLES.map(({ value }) => ({ role: value, text: name(byRole.get(value)?.text), feedback: name(byRole.get(value)?.feedback) }));
  }
  // answerEmotion 'neutral' là giá trị tạm BE đặt khi tạo; câu hỏi còn trống thì coi như chưa chọn
  const emotion = isEmotionType(cp.type) && cp.question?.trim() ? (cp.answerEmotion ?? '') : '';
  return { question: name(cp.question), hint: name(cp.hint), answerEmotion: emotion, options };
};

/** Lỗi phía client theo đúng luật BE `checkCheckpointEdit` (vẫn cho lưu nháp: chữ trống được). '' = hợp lệ. */
export const checkpointFormError = (type: CheckpointTypeDto, form: CheckpointForm): string => {
  if (isEmotionType(type) && form.question.trim() && !form.answerEmotion) return 'Cần chọn cảm xúc đúng khi viết câu hỏi cảm xúc';
  if (type === 'perspective') {
    if (form.options.length !== OPTION_COUNT) return `Cần đúng ${OPTION_COUNT} phương án`;
    if (form.options.filter((o) => o.isCorrect === true).length !== 1) return 'Cần đánh dấu đúng một phương án đúng';
  }
  if (type === 'problem_solving') {
    if (form.options.length !== OPTION_COUNT) return `Cần đúng ${OPTION_COUNT} phương án`;
    if (new Set(form.options.map((o) => o.role)).size !== OPTION_COUNT || form.options.some((o) => !o.role)) {
      return 'Ba phương án phải có đủ ba vai xây dựng, né tránh, bốc đồng';
    }
  }
  return '';
};

/** Body PUT điểm dừng theo kiểu (Web toBody): chỉ gửi trường kiểu đó dùng; chữ có tên, BE đổi lại thành token */
export const checkpointBody = (type: CheckpointTypeDto, form: CheckpointForm): UpdateCheckpointBody => {
  const body: UpdateCheckpointBody = { question: form.question };
  if (isEmotionType(type)) {
    return { ...body, hint: form.hint, ...(form.answerEmotion && { answerEmotion: form.answerEmotion as UpdateCheckpointBody['answerEmotion'] }) };
  }
  if (type === 'perspective') {
    return { ...body, hint: form.hint, options: form.options.map((o): CheckpointOptionInput => ({ text: o.text, isCorrect: o.isCorrect === true })) };
  }
  if (type === 'problem_solving') {
    return { ...body, options: form.options.map((o): CheckpointOptionInput => ({ text: o.text, role: o.role, feedback: o.feedback ?? '' })) };
  }
  return body; // reflection: chỉ có câu hỏi
};

// ---- Lỗi theo vị trí (422 review / lưu) ----

export interface PathError {
  path?: string;
  message?: string;
}

/** errors[{path,message}] của BE → { "pages.<id>" | "checkpoints.<id>": câu báo đã dịch } */
export const gapsByPath = (errors: PathError[] = []): Record<string, string> =>
  Object.fromEntries(errors.filter((e) => e.path && e.message).map((e) => [e.path as string, translateErrorMessage(e.message as string)]));

/** Lỗi từ khoá chặn (BE keywords.blockedErrors): "Có từ không phù hợp cho bé: …" */
export const isKeywordBlock = (e: PathError): boolean => !!e.message?.startsWith('Có từ không phù hợp');

/** Câu tóm tắt khi hoàn tất bị 422 (Web finish onError): từ khoá chặn báo riêng */
export const reviewFailureSummary = (errors: PathError[] = [], fallback = ''): string => {
  const blocked = errors.filter(isKeywordBlock).length;
  if (blocked) return `Còn ${blocked} chỗ có từ không phù hợp cho bé, ba mẹ sửa giúp nhé`;
  if (errors.length) return `Còn ${errors.length} chỗ chưa viết xong`;
  return fallback;
};

/** Đường dẫn lỗi đầu tiên trỏ tới một trang/điểm dừng (để cuộn tới) */
export const firstGapPath = (errors: PathError[] = []): string | undefined =>
  errors.find((e) => e.path?.startsWith('pages.') || e.path?.startsWith('checkpoints.'))?.path;

/** Từ `warn` chuyên gia đặt: vẫn lưu được, nhắc ba mẹ cân nhắc (Web warningsByPath) */
export const warningsByPath = (warnings: KeywordWarningDto[] = []): Record<string, string> => {
  const byPath: Record<string, string[]> = {};
  for (const w of warnings) (byPath[w.path] ??= []).push(`“${w.keyword}”`);
  return Object.fromEntries(
    Object.entries(byPath).map(([path, kws]) => [path, `Có từ nên cân nhắc với bé: ${kws.join(', ')}. Ba mẹ xem diễn đạt nhẹ nhàng hơn nhé.`]),
  );
};

export const pagePath = (id: string) => `pages.${id}`;
export const checkpointPath = (id: string) => `checkpoints.${id}`;

// ---- Ảnh bìa ----

/** Cảnh chọn làm bìa được: đã vẽ xong ảnh (BE hasReadyImage: imageStatus 'ready'), theo thứ tự cảnh */
export const coverScenes = (scenes: StorySceneDto[] = []): StorySceneDto[] =>
  scenes.filter((s) => !!s.imageUrl && s.imageStatus === 'ready').sort((a, b) => (a.sceneOrder ?? 0) - (b.sceneOrder ?? 0));

/** Số chữ (Web PageEditor "n tiếng") */
export const wordCount = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;
