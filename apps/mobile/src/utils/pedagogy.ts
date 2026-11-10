// apps/mobile/src/utils/pedagogy.ts
// GĐ E2a – logic thuần cho Chuyện mẫu, Kỹ năng con, Mẫu câu hỏi (không React Native, test được bằng Node).
// Luật khớp BE: topics.validation.js, sub-skills.validation.js, question-templates.validation.js + lib/templateRules.js.
// Chữ / luật form chép từ Web: TopicsPage.jsx, SubSkillsPage.jsx, TemplatesPage.jsx, TemplateVersionForm.jsx, constants/story.js.
import type { AnswerFormat, Emotion, ManagedSubSkill, ManagedTopic, QuestionTemplate, SubSkillBody, TemplateContent, TemplateVersion, TopicBody } from '../types/pedagogy';

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Mọi trạng thái' },
  { value: 'true', label: 'Đang dùng' },
  { value: 'false', label: 'Đã tắt' },
];

const toInt = (raw: string): number | null => (/^\d+$/.test(raw.trim()) ? Number(raw.trim()) : null);

const ageError = (min: number | null, max: number | null): string | null => {
  if (min === null || max === null) return 'Độ tuổi phải là số nguyên';
  if (min < 1 || max > 18 || max < 1 || min > 18) return 'Độ tuổi trong khoảng 1–18';
  if (min > max) return 'Tuổi tối thiểu phải nhỏ hơn hoặc bằng tuổi tối đa';
  return null;
};

// ---- Chuyện mẫu ----

export interface TopicForm {
  title: string;
  skillId: string;
  subSkillIds: string[];
  guidance: string;
  ageMin: string;
  ageMax: string;
  displayOrder: string;
  isActive: boolean;
}

export const topicForm = (t?: ManagedTopic): TopicForm => ({
  title: t?.title ?? '',
  skillId: t?.skillId ?? '',
  subSkillIds: t?.subSkills.map((x) => x.id) ?? [],
  guidance: t?.guidance ?? '',
  ageMin: String(t?.ageMin ?? 5),
  ageMax: String(t?.ageMax ?? 8),
  displayOrder: String(t?.displayOrder ?? 0),
  isActive: t?.isActive ?? true,
});

/** Web validateTopic + BE topics.validation (null = hợp lệ) */
export const topicFormError = (f: TopicForm): string | null => {
  const n = f.title.trim().length;
  if (n < 3 || n > 200) return 'Tên chuyện mẫu dài 3–200 ký tự';
  if (!f.skillId) return 'Chọn năng lực CASEL cho chuyện mẫu';
  if (f.subSkillIds.length < 1 || f.subSkillIds.length > 3) return 'Chọn từ 1 đến 3 kỹ năng con';
  if (new Set(f.subSkillIds).size !== f.subSkillIds.length) return 'Kỹ năng con bị trùng';
  const g = f.guidance.trim().length;
  if (g < 10) return 'Cốt truyện gợi ý có ít nhất 10 ký tự';
  if (g > 4000) return 'Cốt truyện gợi ý tối đa 4000 ký tự';
  const age = ageError(toInt(f.ageMin), toInt(f.ageMax));
  if (age) return age;
  const order = toInt(f.displayOrder);
  if (order === null || order > 10000) return 'Thứ tự là số nguyên 0–10000';
  return null;
};

export const topicBody = (f: TopicForm): TopicBody => ({
  title: f.title.trim(),
  skillId: f.skillId,
  guidance: f.guidance.trim(),
  subSkillIds: f.subSkillIds,
  ageMin: Number(f.ageMin),
  ageMax: Number(f.ageMax),
  displayOrder: Number(f.displayOrder),
  isActive: f.isActive,
});

/** Sửa: chỉ gửi trường đổi. Đã có truyện → không gửi năng lực (BE khoá); kỹ năng con chỉ gửi khi đổi (BE kiểm lại 422) */
export const topicUpdateBody = (t: ManagedTopic, f: TopicForm): Partial<TopicBody> => {
  const next = topicBody(f);
  const out: Partial<TopicBody> = {};
  if (next.title !== t.title) out.title = next.title;
  if (next.skillId !== t.skillId && t.storiesCount === 0) out.skillId = next.skillId;
  if (next.guidance !== t.guidance) out.guidance = next.guidance;
  const before = t.subSkills.map((x) => x.id);
  if (before.length !== next.subSkillIds.length || !before.every((x) => next.subSkillIds.includes(x))) out.subSkillIds = next.subSkillIds;
  for (const k of ['ageMin', 'ageMax', 'displayOrder', 'isActive'] as const) if (next[k] !== t[k]) (out as Record<string, unknown>)[k] = next[k];
  return out;
};

/** Kỹ năng con chọn được cho chuyện mẫu: đã chọn, hoặc (có mẫu đã ban hành và còn chỗ, tối đa 3) */
export const subSkillSelectable = (s: Pick<ManagedSubSkill, 'id' | 'publishedTemplatesCount'>, selected: string[]) =>
  selected.includes(s.id) || (s.publishedTemplatesCount > 0 && selected.length < 3);

export const topicSaveConfirm = (t: ManagedTopic | undefined, f: TopicForm) => ({
  title: t ? `Lưu chuyện mẫu “${f.title.trim()}”?` : `Tạo chuyện mẫu “${f.title.trim()}”?`,
  message: `${f.subSkillIds.length} kỹ năng con • ${f.ageMin}–${f.ageMax} tuổi • ${f.isActive ? 'cho phụ huynh chọn' : 'ngưng dùng'}. Phụ huynh chọn chuyện mẫu khi tạo truyện; điểm EQ của bé tính theo năng lực gắn với chuyện mẫu.`,
  confirmLabel: t ? 'Lưu thay đổi' : 'Tạo chuyện mẫu',
});

/** Web ConfirmDialog xoá: đã có truyện → chỉ ngưng dùng */
export const topicDeleteConfirm = (t: ManagedTopic) =>
  t.storiesCount
    ? {
        title: `Ngưng dùng chuyện mẫu “${t.title}”?`,
        message: `Chuyện mẫu đã có ${t.storiesCount} truyện dùng nên sẽ chỉ chuyển sang ngưng dùng, truyện cũ không bị ảnh hưởng.`,
        confirmLabel: 'Ngưng dùng',
        destructive: true,
      }
    : { title: `Xoá chuyện mẫu “${t.title}”?`, message: 'Chuyện mẫu chưa có truyện nào dùng, sẽ bị xoá hẳn.', confirmLabel: 'Xoá', destructive: true };

export const toggleConfirm = (kind: string, name: string, nextActive: boolean) => ({
  title: `${nextActive ? 'Bật lại' : 'Tắt'} ${kind} “${name}”?`,
  message: nextActive ? `Bật lại để dùng ${kind} này cho truyện mới.` : `Truyện mới sẽ không dùng ${kind} này nữa; truyện cũ không bị ảnh hưởng.`,
  confirmLabel: nextActive ? 'Bật lại' : 'Tắt',
  destructive: !nextActive,
});

// ---- Kỹ năng con ----

export interface SubSkillForm {
  nameVi: string;
  descriptionVi: string;
  ageMin: string;
  ageMax: string;
}
export const subSkillForm = (s: ManagedSubSkill): SubSkillForm => ({ nameVi: s.nameVi, descriptionVi: s.descriptionVi, ageMin: String(s.ageMin), ageMax: String(s.ageMax) });

export const subSkillFormError = (f: SubSkillForm): string | null => {
  const n = f.nameVi.trim().length;
  if (n < 3 || n > 200) return 'Tên kỹ năng con dài 3–200 ký tự';
  const d = f.descriptionVi.trim().length;
  if (d < 10) return 'Mô tả có ít nhất 10 ký tự';
  if (d > 4000) return 'Mô tả tối đa 4000 ký tự';
  return ageError(toInt(f.ageMin), toInt(f.ageMax));
};

/** Chỉ 4 trường BE cho sửa (validation `.strict()`), chỉ trường đổi */
export const subSkillUpdateBody = (s: ManagedSubSkill, f: SubSkillForm): SubSkillBody => {
  const next = { nameVi: f.nameVi.trim(), descriptionVi: f.descriptionVi.trim(), ageMin: Number(f.ageMin), ageMax: Number(f.ageMax) };
  return Object.fromEntries(Object.entries(next).filter(([k, v]) => s[k as keyof typeof next] !== v)) as SubSkillBody;
};

// ---- Mẫu câu hỏi ----

export const ANSWER_FORMATS: Record<AnswerFormat, string> = {
  emotion_pick: 'Chọn cảm xúc',
  single_correct: 'Chọn 1 đáp án đúng',
  role_choice: 'Chọn cách xử lý (3 vai)',
};
export const EMOTION_LABELS: Record<Emotion, string> = { happy: 'Vui', sad: 'Buồn', angry: 'Giận', scared: 'Sợ', neutral: 'Bình thường' };
export const ALL_EMOTIONS = Object.keys(EMOTION_LABELS) as Emotion[];
export const ROLES = [
  { key: 'constructive', label: 'Tích cực' },
  { key: 'avoidant', label: 'Né tránh' },
  { key: 'impulsive', label: 'Bốc đồng' },
] as const;
export type RoleKey = (typeof ROLES)[number]['key'];
export const CASEL_URL = 'https://casel.org/fundamentals-of-sel/what-is-the-casel-framework/';
export const PROMPTS_MAX = 3;

/** Dạng trả lời gợi ý theo năng lực CASEL (Web SUGGESTED_FORMATS, e704a49) — chỉ gợi ý */
export const SUGGESTED_FORMATS: Record<string, { formats: AnswerFormat[]; why: string }> = {
  self_awareness: { formats: ['emotion_pick', 'single_correct'], why: 'bé nhận ra và gọi tên cảm xúc, suy nghĩ của chính mình' },
  social_awareness: { formats: ['emotion_pick', 'single_correct'], why: 'bé nhận ra cảm xúc và hiểu vì sao người khác cảm thấy như vậy' },
  self_management: { formats: ['role_choice'], why: 'bé chọn cách tự điều chỉnh hành động khi gặp tình huống' },
  relationship_skills: { formats: ['role_choice', 'single_correct'], why: 'bé chọn cách cư xử với người khác (nhờ giúp, chia sẻ, làm lành…)' },
  responsible_decision_making: { formats: ['role_choice', 'single_correct'], why: 'bé cân nhắc và chọn việc nên làm' },
};

export const templateStatus = (t: QuestionTemplate) => ({
  published: t.latestPublished ? `Đã ban hành v${t.latestPublished.version}` : 'Chưa ban hành',
  hasDraft: !!t.draft,
});

export interface TemplateForm {
  questionFrame: string;
  pageSetup: string;
  needsTarget: boolean;
  allowedEmotions: Emotion[];
  correctDesc: string;
  distractorDesc: string;
  constructiveDesc: string;
  avoidantDesc: string;
  impulsiveDesc: string;
  constructiveScore: string;
  avoidantScore: string;
  impulsiveScore: string;
  hintGuidance: string;
  parentPrompts: string[];
  rationale: string;
  referenceUrl: string;
}

const scoreText = (v: number | null | undefined, fallback: number) => (v == null ? String(fallback) : String(Number(v)));

/** Form từ bản nháp (ưu tiên) / bản đã ban hành / rỗng (Web toForm) */
export const templateForm = (v?: TemplateVersion | null): TemplateForm => ({
  questionFrame: v?.questionFrame ?? '',
  pageSetup: v?.pageSetup ?? '',
  needsTarget: v?.needsTarget ?? false,
  allowedEmotions: v?.allowedEmotions?.length ? v.allowedEmotions : [...ALL_EMOTIONS],
  correctDesc: v?.correctDesc ?? '',
  distractorDesc: v?.distractorDesc ?? '',
  constructiveDesc: v?.constructiveDesc ?? '',
  avoidantDesc: v?.avoidantDesc ?? '',
  impulsiveDesc: v?.impulsiveDesc ?? '',
  constructiveScore: scoreText(v?.constructiveScore, 1),
  avoidantScore: scoreText(v?.avoidantScore, 0.5),
  impulsiveScore: scoreText(v?.impulsiveScore, 0),
  hintGuidance: v?.hintGuidance ?? '',
  parentPrompts: v?.parentPrompts?.length ? v.parentPrompts : [''],
  rationale: v?.rationale ?? '',
  referenceUrl: v?.referenceUrl || CASEL_URL,
});

const nullable = (s: string) => (s.trim() === '' ? null : s.trim());
const score = (s: string): number | null => (s.trim() === '' ? null : Number(s.trim().replace(',', '.')));

/** Body PUT /:id/draft (Web toPayload): trường tuỳ chọn để trống → null; chỉ gửi trường của dạng trả lời */
export const templatePayload = (f: TemplateForm, format: AnswerFormat): TemplateContent => {
  const p: TemplateContent = {
    questionFrame: f.questionFrame.trim(),
    pageSetup: nullable(f.pageSetup),
    needsTarget: f.needsTarget,
    rationale: nullable(f.rationale),
    referenceUrl: nullable(f.referenceUrl),
    parentPrompts: f.parentPrompts.map((x) => x.trim()).filter(Boolean),
  };
  if (format === 'emotion_pick') {
    p.allowedEmotions = f.allowedEmotions;
    p.hintGuidance = nullable(f.hintGuidance);
  } else if (format === 'single_correct') {
    p.correctDesc = nullable(f.correctDesc);
    p.distractorDesc = nullable(f.distractorDesc);
    p.hintGuidance = nullable(f.hintGuidance);
  } else {
    for (const r of ROLES) {
      p[`${r.key}Desc`] = nullable(f[`${r.key}Desc`]);
      p[`${r.key}Score`] = score(f[`${r.key}Score`]);
    }
  }
  return p;
};

/** Lỗi khi LƯU NHÁP (validation zod của BE): độ dài, điểm 0–1, đường dẫn, câu gợi ý ≤ 500 */
export const draftErrors = (f: TemplateForm): string[] => {
  const e: string[] = [];
  const texts: [string, string][] = [
    ['① Bé được hỏi về điều gì', f.questionFrame],
    ['Bối cảnh trang truyện', f.pageSetup],
    ['④ Căn cứ sư phạm', f.rationale],
    ['Hướng dẫn gợi ý', f.hintGuidance],
    ['Mô tả đáp án đúng', f.correctDesc],
    ['Mô tả đáp án nhiễu', f.distractorDesc],
    ...ROLES.map((r) => [`Mô tả cách ${r.label}`, f[`${r.key}Desc`]] as [string, string]),
  ];
  for (const [label, v] of texts) if (v.trim().length > 4000) e.push(`${label}: tối đa 4000 ký tự`);
  if (f.parentPrompts.some((x) => x.trim().length > 500)) e.push('③ Gợi ý cho phụ huynh: mỗi câu tối đa 500 ký tự');
  if (f.parentPrompts.filter((x) => x.trim()).length > PROMPTS_MAX) e.push('③ Gợi ý cho phụ huynh: tối đa 3 câu');
  for (const r of ROLES) {
    const s = score(f[`${r.key}Score`]);
    if (s !== null && (Number.isNaN(s) || s < 0 || s > 1)) e.push(`Điểm ${r.label}: từ 0 đến 1`);
  }
  if (f.referenceUrl.trim() && !/^https?:\/\/\S+\.\S+/.test(f.referenceUrl.trim())) e.push('Đường dẫn tham khảo không hợp lệ');
  return e;
};

/** Thiếu để BAN HÀNH (BE assertVersionComplete / Web publishMissing) */
export const publishMissing = (f: TemplateForm, format: AnswerFormat): string[] => {
  const m: string[] = [];
  if (!f.questionFrame.trim()) m.push('① Bé được hỏi về điều gì');
  const prompts = f.parentPrompts.map((x) => x.trim()).filter(Boolean);
  if (prompts.length < 1 || prompts.length > PROMPTS_MAX) m.push('③ Gợi ý cho phụ huynh (1–3 câu)');
  if (!f.rationale.trim()) m.push('④ Căn cứ sư phạm');
  if (format === 'single_correct') {
    if (!f.correctDesc.trim()) m.push('Mô tả đáp án đúng');
    if (!f.distractorDesc.trim()) m.push('Mô tả đáp án nhiễu');
  }
  if (format === 'role_choice') {
    for (const r of ROLES) {
      if (!f[`${r.key}Desc`].trim()) m.push(`Mô tả cách ${r.label}`);
      const s = score(f[`${r.key}Score`]);
      if (s === null || Number.isNaN(s) || s < 0 || s > 1) m.push(`Điểm ${r.label} (0–1)`);
    }
    const [c, a, i] = ROLES.map((r) => score(f[`${r.key}Score`]));
    if (c !== null && a !== null && i !== null && !(c > a && c > i)) m.push('Điểm Tích cực phải lớn hơn hai cách còn lại');
  }
  return m;
};

/** Tên mẫu tự sinh từ ý ① (~60 ký tự, cắt theo từ) */
export const autoTitle = (frame: string) => {
  const text = frame.trim().replace(/\s+/g, ' ');
  if (text.length <= 60) return text;
  const cut = text.slice(0, 60);
  const space = cut.lastIndexOf(' ');
  return `${(space > 30 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, '')}…`;
};

export const templateSaveConfirm = (title: string, isNew: boolean, publish: boolean) =>
  publish
    ? {
        title: `Ban hành mẫu “${title}”?`,
        message: 'Bản nháp được lưu rồi ban hành thành phiên bản mới. Bản đã ban hành không sửa được; muốn đổi thì soạn bản nháp mới.',
        confirmLabel: 'Ban hành',
      }
    : { title: isNew ? `Tạo mẫu “${title}”?` : 'Lưu bản nháp?', message: 'Bản nháp chưa dùng cho truyện cho tới khi được ban hành.', confirmLabel: 'Lưu bản nháp' };

export const templateDeleteConfirm = (t: QuestionTemplate) => ({
  title: `Xoá mẫu “${t.title}”?`,
  message: 'Chỉ xoá hẳn được khi chưa có điểm dừng nào dùng mẫu. Nếu đã dùng, hãy tắt mẫu.',
  confirmLabel: 'Xoá mẫu',
  destructive: true,
});

export const duplicateConfirm = (t: QuestionTemplate) => ({
  title: `Nhân bản mẫu “${t.title}”?`,
  message: 'Tạo mẫu mới cùng kỹ năng con và dạng trả lời, bản nháp v1 chép nội dung bản ban hành mới nhất (hoặc bản nháp).',
  confirmLabel: 'Nhân bản',
});

/** Năng lực CASEL có trong danh sách kỹ năng con (Web TemplatesPage) */
export const skillsOf = (subSkills: Pick<ManagedSubSkill, 'skill'>[]) => [...new Map(subSkills.filter((s) => s.skill).map((s) => [s.skill!.id, s.skill!])).values()];
