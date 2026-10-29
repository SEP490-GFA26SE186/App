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

/** 'YYYY-MM-DD' theo giờ VN (UTC+7, không đổi giờ) lùi `daysAgo` ngày — khớp ngày BE dùng cho /children/:id/usage */
export const vnDateDaysAgo = (daysAgo: number, now: number = Date.now()): string =>
  new Date(now + 7 * 3_600_000 - daysAgo * 86_400_000).toISOString().slice(0, 10);

/** Thời gian đọc từ usedSeconds của BE: 0 → "0 phút", dưới 1 phút nói rõ thay vì làm tròn về 0 */
export const readingTimeLabel = (usedSeconds: number): string =>
  usedSeconds <= 0 ? '0 phút' : usedSeconds < 60 ? 'Dưới 1 phút' : `${Math.round(usedSeconds / 60)} phút`;
