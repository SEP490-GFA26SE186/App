// apps/mobile/src/utils/child.ts
// (nguồn: Web/src/utils/child.js) BE chưa lưu emoji đại diện cho bé → chọn cố định theo id.
const EMOJIS = ['🧒', '👧', '👦', '🐻', '🐰', '🦊', '🐼', '🦁'];

export const childEmoji = (child?: { id?: string } | null): string => {
  if (!child?.id) return EMOJIS[0];
  const hash = [...child.id].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
  return EMOJIS[hash % EMOJIS.length];
};

/** "2019-06-15" → "15/06/2019" */
export const formatBirthDate = (value?: string | null): string =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN') : '';

/** Nhãn tuổi: chưa có ngày sinh thì nói rõ, không đoán */
export const ageLabel = (child?: { birthDate?: string | null; age?: number } | null): string =>
  child?.birthDate && typeof child.age === 'number' ? `${child.age} tuổi` : 'Chưa có ngày sinh';
