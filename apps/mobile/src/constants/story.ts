// apps/mobile/src/constants/story.ts
// Nhãn tiếng Việt cho enum truyện (nguồn: Web/src/constants/story.js, BE schema rev8).

/** Trạng thái truyện (BE: draft | generating | ready) – khóa viết hoa vì storyService.formatStory dùng toUpperCase() */
export const STORY_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  GENERATING: 'AI đang viết',
  READY: 'Đã viết xong',
};

/** Bộ lọc thư viện theo trạng thái truyện */
export const STORY_FILTERS: { value: 'ALL' | 'DRAFT' | 'GENERATING' | 'READY'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'GENERATING', label: 'AI đang viết' },
  { value: 'READY', label: 'Đã viết xong' },
];

/** Ba lối vào tạo truyện (Web CreateStoryPage; BE entry: family | topic | handwritten) */
export const STORY_ENTRIES = [
  {
    value: 'family',
    icon: '🏠',
    title: 'Kể chuyện nhà mình',
    text: 'Ba mẹ kể chuyện bé vừa gặp, AI tìm khoảnh khắc khó và viết truyện để bé tập lại đúng lúc đó.',
    note: 'Có báo cáo EQ',
  },
  {
    value: 'topic',
    icon: '📖',
    title: 'Chuyện mẫu',
    text: 'Chọn chuyện chuyên gia soạn sẵn, mỗi chuyện giúp bé tập một năng lực cảm xúc (CASEL).',
    note: 'Có báo cáo EQ',
  },
  {
    value: 'handwritten',
    icon: '✍️',
    title: 'Tự viết',
    text: 'Ba mẹ tự viết từng trang và điểm dừng (4–20 trang).',
    note: 'Không tính vào báo cáo EQ',
  },
] as const;
export type StoryEntry = (typeof STORY_ENTRIES)[number]['value'];

/** Độ dài truyện AI viết (Web AI_LENGTHS): short/medium/long = 6/8/10 trang */
export const AI_LENGTHS = [
  { value: 'short', label: 'Ngắn', pages: 6 },
  { value: 'medium', label: 'Vừa', pages: 8 },
  { value: 'long', label: 'Dài', pages: 10 },
] as const;
export type StoryLength = (typeof AI_LENGTHS)[number]['value'];

/** Giới hạn lời kể (Web + BE: situation 20–2000 ký tự) */
export const SITUATION_MIN = 20;
export const SITUATION_MAX = 2000;

/** Kiểu điểm dừng (checkpoint_type) */
export const CHECKPOINT_TYPES: Record<string, string> = {
  emotion_self: 'Nhận diện cảm xúc của nhân vật chính',
  emotion_other: 'Nhận diện cảm xúc của nhân vật khác',
  perspective: 'Đặt mình vào vị trí người khác',
  problem_solving: 'Giải quyết tình huống',
  reflection: 'Liên hệ bản thân (không chấm điểm)',
};

/** Trạng thái tạo truyện BE (GET /stories/:id/generation) → nhãn UI */
export const GENERATION_STATES = {
  queued: { label: 'Đang xếp hàng', tone: 'info' },
  processing: { label: 'AI đang viết', tone: 'info' },
  succeeded: { label: 'Đã viết xong', tone: 'success' },
  failed: { label: 'Chưa viết được', tone: 'danger' },
  blocked: { label: 'Bị chặn bởi bộ lọc an toàn', tone: 'warning' },
} as const;
export type GenerationStatus = keyof typeof GENERATION_STATES;
