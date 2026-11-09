// apps/mobile/src/utils/monitoring.ts
// GĐ E1 – câu chữ / trạng thái thuần cho các màn giám sát của Chuyên gia (không React Native, test được bằng Node).
// Nguồn: Web pages/specialist/{StrikesPage,AuditsPage,AiFlagsPage}.jsx, components/specialist/StrikeModal.jsx.
import type { BadgeTone } from '../components/ui/Badge';
import type { IssueStrikeResult, Strike } from '../types/management';
import { formatDate } from './format';

/** Trạng thái một cảnh cáo (Web StrikesPage strikeState) */
export const strikeState = (s: Pick<Strike, 'revokedAt' | 'active' | 'expiresAt'>): { label: string; tone: BadgeTone } =>
  s.revokedAt
    ? { label: 'Đã gỡ (kháng nghị)', tone: 'success' }
    : s.active
      ? { label: `Hiệu lực đến ${formatDate(s.expiresAt)}`, tone: 'danger' }
      : { label: 'Hết hạn', tone: 'neutral' };

/** Báo kết quả cảnh cáo (Web StrikeModal) */
export const strikeResultMessage = (r: IssueStrikeResult): string =>
  r.sellerSuspended
    ? `Đã cảnh cáo — đủ ${r.strikeLimit} cảnh cáo, tài khoản bán đã bị khoá`
    : `Đã cảnh cáo (${r.activeStrikes}/${r.strikeLimit} cảnh cáo còn hiệu lực)`;

export const STRIKE_REASON_MIN = 10; // BE monitoring.routes: reason(10, 'Lý do cảnh cáo')

// ---- Kiểm tra ngẫu nhiên ----
export const AUDIT_COUNT_MIN = 1;
export const AUDIT_COUNT_MAX = 20; // BE: count 1..20
export const AUDIT_COUNT_DEFAULT = 3; // Web AuditsPage

export const clampAuditCount = (n: number): number => Math.min(AUDIT_COUNT_MAX, Math.max(AUDIT_COUNT_MIN, Math.round(n) || AUDIT_COUNT_MIN));

export const runAuditsConfirm = (count: number) => ({
  title: `Chọn ${count} truyện để kiểm tra?`,
  message: `Hệ thống bốc ngẫu nhiên tối đa ${count} truyện đang bán (ưu tiên truyện lâu chưa được xem) và tạo lượt kiểm tra cho từng truyện. Truyện vẫn bán bình thường trong lúc kiểm.`,
  confirmLabel: `Chọn ${count} truyện`,
});

/** Web AuditsPage: created = 0 → không còn truyện để chọn */
export const runAuditsMessage = (created: number): string =>
  created ? `Đã chọn ${created} truyện để kiểm tra` : 'Không còn truyện đang bán nào để chọn';

// ---- Cảnh báo AI ----
export const AI_FLAG_WINDOWS = [7, 14, 30]; // Web AiFlagsPage WINDOWS
export const AI_BLOCK_DAYS = [1, 3, 7, 14, 30]; // Web BlockForm
export const AI_BLOCK_DEFAULT_DAYS = 3;
export const AI_FLAG_MIN_MAX = 100; // BE: min 1..100
export const AI_BLOCK_REASON_MAX = 2000; // BE: reason ≤ 2000, không bắt buộc

export const clampFlagMin = (n: number): number => Math.min(AI_FLAG_MIN_MAX, Math.max(1, Math.round(n) || 1));

/** Body POST /ai-flags/:userId/block: lý do trống → không gửi (BE optional) */
export const aiBlockBody = (days: number, reason: string): { days: number; reason?: string } => {
  const r = reason.trim();
  return r ? { days, reason: r } : { days };
};

export const aiBlockConfirm = (name: string, days: number) => ({
  title: `Tạm khoá quyền dùng AI của ${name}?`,
  message: `Trong ${days} ngày, phụ huynh này không nhờ AI viết truyện, vẽ tranh được. Phụ huynh vẫn đọc và tự viết truyện bình thường.`,
  confirmLabel: `Khoá ${days} ngày`,
});

export const aiUnblockConfirm = (name: string) => ({
  title: `Mở khoá quyền dùng AI của ${name}?`,
  message: 'Phụ huynh dùng lại được AI viết truyện, vẽ tranh ngay.',
  confirmLabel: 'Mở khoá',
});
