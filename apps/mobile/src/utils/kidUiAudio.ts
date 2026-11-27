// apps/mobile/src/utils/kidUiAudio.ts
// Âm thanh Kid Mode: câu đọc dùng chung (GET /kid/ui-audio → { assets: { [key]: { text, audioUrl } } }) và giọng đọc từng trang
// (page.audioUrl trong lượt đọc). File âm thanh do BE tạo sẵn, Mobile chỉ PHÁT. Không phát được file (Expo Go SDK 52 thiếu
// expo-audio, truyện tắt giọng đọc, BE không có file) → đọc chữ bằng giọng máy của thiết bị (quyết định chủ dự án 2026-11-27).
// Hàm thuần (không import expo-audio) để test offline được.

export type UiAudioAssets = Record<string, { text: string; audioUrl: string | null }>;

/** Khóa BE seed (BE/api/scripts/seed-ui-audio.js PHRASES) mà Kid Mode dùng */
export const UI_AUDIO_KEYS = {
  chooseEmotion: 'prompt.choose_emotion',
  tryAgain: 'prompt.try_again',
  correct: 'prompt.correct',
  answerIs: 'prompt.answer_is',
  reflection: 'prompt.reflection',
  storyEnd: 'prompt.story_end',
} as const;

const isHttpUrl = (url: unknown): url is string => typeof url === 'string' && /^https?:\/\//i.test(url);

/** Chỉ phát URL http(s) BE trả; thiếu khóa / audioUrl null / sai dạng → null (UI vẫn giữ chữ). */
export const playableUrl = (assets: UiAudioAssets | null | undefined, key: string): string | null => {
  const url = assets?.[key]?.audioUrl;
  return isHttpUrl(url) ? url : null;
};

export type PlaySource = { kind: 'audio'; url: string } | { kind: 'tts'; text: string } | null;

/** Chọn cách phát: file BE (khi có trình phát) → giọng máy đọc chữ (khi thiết bị có) → không phát được */
export const pickSource = (
  url: string | null | undefined,
  text: string | null | undefined,
  hasPlayer: boolean,
  hasTts: boolean
): PlaySource => {
  if (hasPlayer && isHttpUrl(url)) return { kind: 'audio', url };
  const t = text?.trim();
  return hasTts && t ? { kind: 'tts', text: t } : null;
};

/** Điều khiển phát truyền xuống component hiển thị (KidReader → KidCheckpointCard) */
export interface KidUiAudioControls {
  canPlay: (key: string) => boolean;
  play: (key: string) => void;
  /** Đọc một đoạn có sẵn url/chữ (trang truyện). `key` để biết đoạn nào đang phát */
  speak: (key: string, url: string | null | undefined, text: string | null | undefined) => void;
  canSpeak: (url: string | null | undefined, text: string | null | undefined) => boolean;
  stop: () => void;
  /** Khóa đang phát (để đổi nhãn nút); null = im lặng */
  playingKey: string | null;
  /** Khóa vừa phát lỗi (để hiện chữ báo); null = không lỗi */
  failedKey: string | null;
}
