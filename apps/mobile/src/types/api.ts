// apps/mobile/src/types/api.ts
// DTO response của BE (rev8) mà Mobile đang dùng. Nguồn: docs/mobile/API_MAPPING.md đối chiếu BE/api/src/modules/*.
// Chỉ liệt kê trường BE thực sự trả; không thêm trường để hợp với UI. DTO của Backend nằm ở Mobile (types/api.ts).
// Mapper BE → UI vẫn nhận `any` ở các hàm formatXxx (còn đọc trường legacy) – sẽ siết ở T4.1/T4.2.

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---- Auth ----
export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthUserDto {
  id: string;
  role: string;
  username: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  hasKidPin: boolean;
  emailVerifiedAt?: string | null;
  createdAt: string;
  /** Chỉ có ở GET /auth/me (login/register không trả ví) */
  wallet?: { creditBalance: number; earningAvailableVnd?: number };
}

/** POST /auth/login, POST /auth/register */
export interface LoginResponseDto {
  user: AuthUserDto;
  tokens: AuthTokensDto;
}

/** GET /auth/me */
export interface MeResponseDto {
  user: AuthUserDto;
}

/** POST /auth/kid-mode/enter */
export interface EnterKidModeResponseDto {
  child: { id: string; name: string; birthDate?: string | null; preferredVoice?: string | null };
  session: { kidSessionToken: string; expiresIn: string };
}

/** POST /auth/kid-mode/exit */
export interface ExitKidModeResponseDto {
  tokens: AuthTokensDto;
}

// ---- Characters / Children ----
export interface CharacterDto {
  id: string;
  name: string;
  appearance: string;
  portraitImageKey?: string | null;
  portraitImageUrl?: string | null;
  portraitStatus?: string | null;
  portraitFailure?: string | null;
  /** Có giá trị = nhân vật đại diện của một bé (không xóa/đổi tên ở đây) */
  childId?: string | null;
}

export interface ChildDto {
  id: string;
  name: string;
  birthDate?: string | null;
  age?: number;
  preferredVoice?: string | null;
  character?: CharacterDto | null;
  booksCount?: number;
  completedSessionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** GET /children, POST/PUT /children */
export interface ChildrenListDto {
  children: ChildDto[];
}
export interface ChildResponseDto {
  child: ChildDto;
}

/** GET /characters, POST/PUT /characters */
export interface CharactersListDto {
  characters: CharacterDto[];
}
export interface CharacterResponseDto {
  character: CharacterDto;
}

// ---- Stories / Topics ----
export interface StoryPageDto {
  id: string;
  pageOrder: number;
  sceneId?: string | null;
  contentText?: string | null;
  audioUrl?: string | null;
  audioStatus?: string | null;
}

export type StoryStatusDto = 'draft' | 'generating' | 'ready';
export type StoryLengthDto = 'short' | 'medium' | 'long' | 'custom';
export type CheckpointTypeDto = 'emotion_self' | 'emotion_other' | 'perspective' | 'problem_solving' | 'reflection';

export interface StoryCharacterRefDto {
  token: string;
  characterId: string | null;
  name: string | null;
  isMain: boolean;
}

export interface StoryCheckpointOptionDto {
  id: string;
  optionOrder: number;
  text: string;
  role?: string | null;
  isCorrect?: boolean | null;
  feedback?: string | null;
}

export interface StoryCheckpointDto {
  id: string;
  afterPageId: string;
  afterPageOrder: number | null;
  type: CheckpointTypeDto;
  question: string | null;
  hint?: string | null;
  locked: boolean;
  options: StoryCheckpointOptionDto[];
}

/** GET /stories (tóm tắt) và GET /stories/:id (chi tiết: thêm pages, checkpoints, readiness, narration) */
export interface StoryDto {
  id: string;
  title: string;
  status: StoryStatusDto;
  length?: StoryLengthDto;
  entry?: string;
  situation?: string | null;
  momentSummary?: string | null;
  topic?: { id: string; title: string; competency: string | null } | null;
  characters?: StoryCharacterRefDto[];
  cover?: { imageUrl?: string | null; competency?: string | null } | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  pageCount?: number;
  checkpointCount?: number;
  readiness?: { ready: boolean; reason?: string | null };
  pages?: StoryPageDto[];
  scenes?: { id: string; imageUrl?: string | null }[];
  checkpoints?: StoryCheckpointDto[];
}

/** GET /stories/:id, POST /stories, POST /stories/:id/review ... */
export interface StoryResponseDto {
  story: StoryDto;
}

/** POST /stories/analyze */
export interface AnalyzeStoryResultDto {
  momentSummary: string;
  seedEvent: string;
  subSkills: { id: string; nameVi: string }[];
  analysisToken: string;
  expiresAt: string;
}

/** GET /stories/:id/generation → data.generation (null = chưa từng sinh) */
export interface GenerationDto {
  status: 'queued' | 'processing' | 'succeeded' | 'failed' | 'blocked';
  errorCode?: string | null;
  errorMessage?: string | null;
}

/** GET /stories/ai-pricing */
export interface AiPricingDto {
  lengths: { length: 'short' | 'medium' | 'long'; pages: number; checkpoints: number; credits: number }[];
}

/** GET /topics (phía phụ huynh) */
export interface TopicDto {
  id: string;
  title: string;
  guidance?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  skill?: { nameVi?: string | null } | null;
}

// ---- EQ (GET /children/:id/eq-report) ----
export interface EqSubSkillDto {
  id: string;
  nameVi: string;
  level: 'emerging' | 'developing' | 'secure' | null;
}

export interface EqCompetencyDto {
  caselCode: string;
  nameVi: string;
  /** null = chưa đủ dữ liệu (hiển thị "Chưa có dữ liệu", không bịa điểm) */
  level: 'emerging' | 'developing' | 'secure' | null;
  subSkills: EqSubSkillDto[];
}

/** Gợi ý chuyện mẫu nên đọc tiếp (BE children/lib/recommend.js) */
export interface EqRecommendationDto {
  id: string;
  title: string;
  skill: { caselCode: string; nameVi: string };
  subSkills: { id: string; nameVi: string }[];
}

export interface EqReportDto {
  childId: string;
  childName: string;
  competencies: EqCompetencyDto[];
  recommendations: EqRecommendationDto[];
}

// ---- Children: overview / usage ----
export interface ChildUsageDto {
  childId: string;
  date: string;
  usedMinutes: number;
  usedSeconds: number;
  sessionsCount: number;
  completedCount: number;
}

/** GET /children/:id/overview */
export interface ChildOverviewDto {
  profile: ChildDto;
  todayUsage: ChildUsageDto;
  readingStats: {
    booksInBookshelf: number;
    completedStories: number;
    lastReadStory: { id: string; title: string; cover?: { imageUrl?: string | null } | null } | null;
    lastReadAt: string | null;
  };
  eqReport: EqReportDto;
}

// ---- Bookshelf / Kid ----
export interface ReadingProgressDto {
  isCompleted: boolean;
  currentPageOrder: number;
  progressPercentage: number;
  lastActivityAt: string;
}

/** GET /kid/bookshelf → items[] (không có pages) */
export interface KidShelfItemDto {
  storyId: string;
  title: string;
  cover?: { imageUrl?: string | null; competency?: string | null };
  coverImageUrl?: string | null;
  totalPages: number;
  addedAt?: string;
  readingProgress?: ReadingProgressDto | null;
}

export interface KidSessionDto {
  id: string;
  storyId: string;
  isFirstPlay: boolean;
  status: 'in_progress' | 'completed' | string;
  currentPageId: string | null;
  startedAt: string;
  completedAt: string | null;
}

export type KidEmotion = 'happy' | 'sad' | 'angry' | 'scared' | 'neutral';

export interface KidAnswerResultDto {
  checkpointId: string;
  attempts: number;
  skipped: boolean;
  done: boolean;
  correct: boolean | null;
  hint?: string | null;
  hintAudioUrl?: string | null;
  answer?: { emotion?: KidEmotion; optionId?: string };
  feedback?: string | null;
  feedbackAudioUrl?: string | null;
}

export interface KidCheckpointDto {
  id: string;
  afterPageId: string;
  afterPageOrder: number | null;
  type: CheckpointTypeDto;
  question: string | null;
  questionAudioUrl?: string | null;
  options: { id: string; text: string | null; textAudioUrl?: string | null }[];
  result: KidAnswerResultDto | null;
}

/** POST /kid/sessions → { session, story } */
export interface KidPlayDto {
  session: KidSessionDto;
  story: {
    id: string;
    title: string;
    useTts: boolean;
    topic: { title: string; competency: string | null } | null;
    pages: { id: string; pageOrder: number; text: string | null; audioUrl?: string | null; imageUrl?: string | null }[];
    checkpoints: KidCheckpointDto[];
  };
}

// ---- Plans / Subscription / Credit ----
export interface PlanDto {
  code: string;
  name: string;
  durationMonths?: number | null;
  priceVnd: string | number; // BE serialize BigInt thành chuỗi
  creditsPerMonth: number;
  maxChildren: number;
  maxCharacters: number;
  canSell?: boolean;
}

export interface SubscriptionMeDto {
  isFallback: boolean;
  plan: PlanDto;
  status: string;
  periodStart: string | null;
  periodEnd: string | null;
  nextCreditGrantAt: string | null;
  usage: { childrenCount: number; charactersCount: number };
}

export interface CreditEntryDto {
  id: string;
  createdAt: string;
  entryType: string;
  amount: number;
  balanceAfter: number;
  context:
    | { kind: 'ai'; requestType: string; storyTitle: string | null; characterName: string | null }
    | { kind: 'plan'; planName: string }
    | null;
}
