// apps/mobile/src/utils/kidUiAudio.ts
// Câu đọc dùng chung của Kid Mode (GET /kid/ui-audio → { assets: { [key]: { text, audioUrl } } }).
// File âm thanh do BE tạo sẵn (script seed), Mobile chỉ PHÁT: không tạo giọng đọc, không TTS.
// Hàm thuần (không import expo-audio) để test offline được.

export type UiAudioAssets = Record<string, { text: string; audioUrl: string | null }>;

/** Khóa BE seed (BE/api/scripts/seed-ui-audio.js PHRASES) mà Kid Mode dùng */
export const UI_AUDIO_KEYS = {
  chooseEmotion: 'prompt.choose_emotion',
  tryAgain: 'prompt.try_again',
  correct: 'prompt.correct',
  answerIs: 'prompt.answer_is',
  reflection: 'prompt.reflection',
} as const;

/** Chỉ phát URL http(s) BE trả; thiếu khóa / audioUrl null / sai dạng → null (UI vẫn giữ chữ). */
export const playableUrl = (assets: UiAudioAssets | null | undefined, key: string): string | null => {
  const url = assets?.[key]?.audioUrl;
  return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : null;
};

/** Điều khiển phát truyền xuống component hiển thị (KidReader → KidCheckpointCard) */
export interface KidUiAudioControls {
  canPlay: (key: string) => boolean;
  play: (key: string) => void;
  stop: () => void;
  /** Khóa đang phát (để đổi nhãn nút); null = im lặng */
  playingKey: string | null;
  /** Khóa vừa phát lỗi (để hiện chữ báo); null = không lỗi */
  failedKey: string | null;
}
