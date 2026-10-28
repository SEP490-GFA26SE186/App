// apps/mobile/src/utils/managementRules.ts
// Luật thuần (không phụ thuộc React Native) của màn Admin / Chuyên gia sư phạm, khớp kiểm tra của BE để báo lỗi trước khi gửi.
// BE vẫn là nơi quyết định; các hàm này chỉ tránh gửi request chắc chắn bị từ chối. Test: tests/management.test.ts.
import { EMAIL_REGEX } from './validation';
import type { AdminAccount, ReviewDecision, ReviewDetail, Withdrawal } from '../types/management';

/** Nội dung chuyển khoản ngắn, không dấu (giống Web WithdrawalsPage) */
export const transferNote = (w: Pick<Withdrawal, 'id'>) => `StoryWeaver rut tien ${w.id.slice(0, 8)}`;

/** BE refunds.service decideRefund: duyệt cần mã giao dịch, từ chối cần ghi chú. null = hợp lệ */
export const refundDecisionError = (approve: boolean, ref: string, note: string): string | null => {
  if (approve && !ref.trim()) return 'Nhập mã giao dịch chuyển trả cho phụ huynh.';
  if (!approve && !note.trim()) return 'Hãy ghi lý do từ chối để phụ huynh biết.';
  return null;
};

export interface SpecialistForm {
  fullName: string;
  email: string;
  username: string;
  password: string;
}

/** Luật của BE (POST /admin/accounts/moderators); trả lỗi theo từng ô */
export const validateSpecialistForm = (f: SpecialistForm): Partial<Record<keyof SpecialistForm, string>> => {
  const e: Partial<Record<keyof SpecialistForm, string>> = {};
  if (f.fullName.trim().length < 2) e.fullName = 'Nhập họ tên';
  if (!EMAIL_REGEX.test(f.email.trim())) e.email = 'Email không hợp lệ';
  if (!/^[a-zA-Z0-9_.]{3,50}$/.test(f.username.trim())) e.username = 'Tên đăng nhập 3–50 ký tự, chỉ gồm chữ, số, dấu _ và .';
  if (f.password.length < 8) e.password = 'Mật khẩu tối thiểu 8 ký tự';
  return e;
};

/** Admin không khoá được chính mình và Admin đang hoạt động (BE admin.service setAccountActive từ chối) */
export const canToggleAccount = (u: Pick<AdminAccount, 'id' | 'role' | 'isActive'>, meId: string) => u.id !== meId && !(u.role === 'admin' && u.isActive);

/** Tóm tắt trạng thái trước → sau (JSON nhỏ), giống Web AuditLogsPage */
export const briefState = (v: unknown): string =>
  v == null
    ? ''
    : typeof v === 'object'
      ? Object.entries(v as Record<string, unknown>)
          .map(([k, x]) => `${k}: ${typeof x === 'object' ? JSON.stringify(x) : String(x)}`)
          .join(', ')
      : String(v);

export interface ReviewGate {
  pagesTotal: number;
  pagesViewed: number;
  decided: boolean;
  /** Đang giữ bài và chưa quyết định: được xem trang / quyết định */
  canAct: boolean;
  isFollowup: boolean;
  /** Duyệt chỉ bật khi đã xem 100% trang (BE kiểm lại) và tick đủ checklist (chỉ ở client, như Web) */
  canApprove: boolean;
}

export const reviewGate = (d: ReviewDetail, checklistPassed: number, checklistTotal: number): ReviewGate => {
  const viewed = new Set(d.pageViews.map((v) => v.pageId));
  const pagesTotal = d.story.pages.length;
  const pagesViewed = d.story.pages.filter((p) => viewed.has(p.id)).length;
  const decided = !!d.review.decidedAt;
  return {
    pagesTotal,
    pagesViewed,
    decided,
    canAct: d.review.claimedByMe && !decided,
    isFollowup: d.review.reviewType !== 'submission',
    canApprove: pagesViewed === pagesTotal && checklistPassed === checklistTotal,
  };
};

/** BE publishing.service decide: quyết định khác "approved" bắt buộc nhận xét; quyết định phải thuộc allowedDecisions */
export const decisionError = (d: ReviewDetail, decision: ReviewDecision, comment: string): string | null => {
  if (Array.isArray(d.review.allowedDecisions) && !d.review.allowedDecisions.includes(decision)) return 'Quyết định không hợp lệ với loại lượt duyệt này.';
  if (decision !== 'approved' && !comment.trim()) return 'Hãy ghi nhận xét để người bán biết cần sửa gì.';
  return null;
};
