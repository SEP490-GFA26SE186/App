// apps/mobile/src/types/pedagogy.ts
// GĐ E2a – nội dung sư phạm của Chuyên gia. Khớp BE topics.service.js (formatManaged), sub-skills.service.js (formatManaged),
// question-templates.service.js (formatTemplate / formatVersion).

export interface SkillRef {
  id: string;
  caselCode: string;
  nameVi: string;
}

export interface ManagedTopic {
  id: string;
  title: string;
  guidance: string;
  ageMin: number;
  ageMax: number;
  displayOrder: number;
  isActive: boolean;
  skillId: string;
  skill: SkillRef | null;
  creator: { id: string; fullName: string | null; username: string | null } | null;
  subSkills: { id: string; nameVi: string; caselTextEn: string | null }[];
  storiesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicBody {
  title: string;
  skillId: string;
  guidance: string;
  subSkillIds: string[];
  ageMin: number;
  ageMax: number;
  displayOrder: number;
  isActive: boolean;
}

export interface TopicDeleteResult {
  deleted: boolean;
  deactivated: boolean;
  message: string;
}

export interface ManagedSubSkill {
  id: string;
  skillId: string;
  skill: SkillRef | null;
  code: string;
  nameVi: string;
  descriptionVi: string;
  caselTextEn: string | null;
  ageMin: number;
  ageMax: number;
  isActive: boolean;
  displayOrder: number;
  templatesCount: number;
  publishedTemplatesCount: number;
  topicsCount: number;
  checkpointsCount: number;
}

export interface SubSkillBody {
  nameVi?: string;
  descriptionVi?: string;
  ageMin?: number;
  ageMax?: number;
  isActive?: boolean;
}

export type AnswerFormat = 'emotion_pick' | 'single_correct' | 'role_choice';
export type Emotion = 'happy' | 'sad' | 'angry' | 'scared' | 'neutral';

/** Nội dung một phiên bản (mọi trường nháp đều tuỳ chọn) */
export interface TemplateContent {
  questionFrame?: string;
  pageSetup?: string | null;
  needsTarget?: boolean;
  allowedEmotions?: Emotion[];
  correctDesc?: string | null;
  distractorDesc?: string | null;
  constructiveDesc?: string | null;
  avoidantDesc?: string | null;
  impulsiveDesc?: string | null;
  constructiveScore?: number | null;
  avoidantScore?: number | null;
  impulsiveScore?: number | null;
  hintGuidance?: string | null;
  parentPrompts?: string[];
  rationale?: string | null;
  referenceUrl?: string | null;
}

export interface TemplateVersion extends TemplateContent {
  id: string;
  version: number;
  status: 'draft' | 'published';
  publishedAt?: string | null;
}

export interface QuestionTemplate {
  id: string;
  title: string;
  answerFormat: AnswerFormat;
  isActive: boolean;
  subSkillId: string;
  subSkill: { id: string; nameVi: string; skillId: string } | null;
  latestPublished: TemplateVersion | null;
  draft: TemplateVersion | null;
}

// ---- GĐ E2b: soát câu hỏi AI (checkpoint-review.service.js format), tham số báo cáo, từ khoá chặn ----

export type CheckpointReviewStatus = 'pending' | 'ok' | 'flagged';

export interface CheckpointReviewItem {
  checkpointId: string;
  createdAt: string;
  type: string;
  skill: { id: string; caselCode: string; nameVi: string } | null;
  subSkill: { id: string; nameVi: string } | null;
  template: { id: string; title: string; version: number } | null;
  pageBefore: string | null;
  question: string;
  options: { text: string; role?: string; isCorrect?: boolean }[];
  answerEmotion?: string;
  status: CheckpointReviewStatus;
  excludedReason?: string;
  family: { situation: string | null; momentSummary: string | null; seedEvent: string | null; source: string | null } | null;
}

export interface CheckpointReviewStat {
  templateId: string;
  title: string;
  reviewed: number;
  flagged: number;
}

export interface ReportSettings {
  window: number;
  minItems: number;
  developingFrom: number;
  secureFrom: number;
}

export type KeywordSeverity = 'block' | 'warn';
export interface BlockedKeyword {
  id: string;
  keyword: string;
  severity: KeywordSeverity;
  isActive: boolean;
  createdAt: string;
  creator: string | null;
}
