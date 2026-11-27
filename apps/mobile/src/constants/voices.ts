// apps/mobile/src/constants/voices.ts
// Giọng đọc truyện của bé (child_profiles.preferred_voice ≤ 50 ký tự). Nguồn: Web/src/constants/voices.js.
export const VOICES = [
  { value: 'vi-north-female', label: 'Giọng nữ miền Bắc' },
  { value: 'vi-north-male', label: 'Giọng nam miền Bắc' },
  { value: 'vi-south-female', label: 'Giọng nữ miền Nam' },
  { value: 'vi-south-male', label: 'Giọng nam miền Nam' },
] as const;

/** Nhãn tiếng Việt; giá trị lạ (BE thêm giọng mới) thì hiện nguyên văn */
export const voiceLabel = (value?: string | null): string | null =>
  value ? VOICES.find((v) => v.value === value)?.label ?? value : null;
