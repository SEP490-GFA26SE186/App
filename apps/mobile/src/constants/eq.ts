// apps/mobile/src/constants/eq.ts
// 5 năng lực CASEL và mức độ EQ (nguồn: Web/src/constants/casel.js, eqLevels.js).
// Chỉ hiện MỨC (không điểm/%) theo spec sư phạm; không có dữ liệu → "Chưa có dữ liệu".
import { Colors } from '../theme/colors';

export const CASEL: Record<string, { label: string; icon: string }> = {
  self_awareness: { label: 'Tự nhận thức', icon: '🧠' },
  self_management: { label: 'Tự quản lý', icon: '🌬️' },
  social_awareness: { label: 'Nhận thức xã hội', icon: '👥' },
  relationship_skills: { label: 'Kỹ năng quan hệ', icon: '🤝' },
  responsible_decision_making: { label: 'Ra quyết định có trách nhiệm', icon: '⚖️' },
};
export const CASEL_ORDER = Object.keys(CASEL);

export type EqLevel = 'emerging' | 'developing' | 'secure';

export const EQ_LEVELS: Record<EqLevel, { value: number; label: string; color: string }> = {
  emerging: { value: 1, label: 'Đang làm quen', color: Colors.tealBright },
  developing: { value: 2, label: 'Đang phát triển', color: Colors.tealStrong },
  secure: { value: 3, label: 'Vững', color: Colors.tealDeep },
};

export const NO_DATA_LABEL = 'Chưa có dữ liệu';

export const levelLabel = (level?: string | null): string =>
  (level && EQ_LEVELS[level as EqLevel]?.label) || NO_DATA_LABEL;

export const EQ_REPORT_NOTE =
  'Báo cáo phản ánh mức hiểu của con qua tình huống trong truyện, không phải đánh giá hành vi ngoài đời.';
