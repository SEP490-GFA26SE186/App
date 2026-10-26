// apps/mobile/src/constants/kid.ts
// Nhãn cho Kid Mode (nguồn: BE kid.validation EMOTIONS, Web kid/KidCheckpoint).
import type { KidEmotion } from '../types/api';

export const KID_EMOTIONS: { value: KidEmotion; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😊', label: 'Vui' },
  { value: 'sad', emoji: '😢', label: 'Buồn' },
  { value: 'angry', emoji: '😠', label: 'Giận' },
  { value: 'scared', emoji: '😨', label: 'Sợ' },
  { value: 'neutral', emoji: '😐', label: 'Bình thường' },
];

export const emotionLabel = (value?: string): string => {
  const e = KID_EMOTIONS.find((x) => x.value === value);
  return e ? `${e.emoji} ${e.label}` : '';
};
