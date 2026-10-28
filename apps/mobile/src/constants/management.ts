// apps/mobile/src/constants/management.ts
// Nhãn tiếng Việt cho Admin / Chuyên gia sư phạm, chép đúng từ Web (Web/src/constants/moderation.js,
// Web/src/pages/admin/*) để hai nền tảng dùng cùng thuật ngữ. Khớp enum của BE.
import type { BadgeTone } from '../components/ui/Badge';
import type { AccountRole, FinanceRange, ReviewDecision, ReviewType, StrikeSource } from '../types/management';

type Labeled = { label: string; tone: BadgeTone };

/** Mục có trên Web nhưng Mobile chưa làm: báo rõ, không mở màn giả */
export const WEB_ONLY_NOTICE = 'Tính năng này hiện chỉ dùng trên bản Web quản trị (máy tính). Ứng dụng điện thoại chưa hỗ trợ.';

export const FINANCE_RANGES: { value: FinanceRange; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: 'year', label: '12 tháng' },
];

export const ROLE_LABELS: Record<AccountRole, string> = {
  parent: 'Phụ huynh',
  specialist: 'Chuyên gia sư phạm',
  admin: 'Admin',
};

export const REVIEW_TYPES: Record<ReviewType, Labeled> = {
  submission: { label: 'Nộp bán', tone: 'info' },
  report_followup: { label: 'Hậu kiểm báo cáo', tone: 'danger' },
  random_audit: { label: 'Kiểm tra ngẫu nhiên', tone: 'warning' },
};

export const DECISION_LABELS: Record<ReviewDecision, string> = {
  approved: 'Đã duyệt / giữ',
  changes_requested: 'Yêu cầu sửa',
  rejected: 'Từ chối',
  taken_down: 'Gỡ hẳn',
};

/** Nút quyết định theo loại lượt duyệt (Web ReviewWorkspacePage DECISIONS) */
export const DECISION_ACTIONS: Record<'submission' | 'followup', { value: ReviewDecision; label: string }[]> = {
  submission: [
    { value: 'approved', label: 'Duyệt & xuất bản' },
    { value: 'changes_requested', label: 'Yêu cầu sửa' },
    { value: 'rejected', label: 'Từ chối' },
  ],
  followup: [
    { value: 'approved', label: 'Giữ truyện (bán tiếp)' },
    { value: 'taken_down', label: 'Gỡ hẳn & cảnh cáo tác giả' },
  ],
};

export const LISTING_STATUS: Record<string, Labeled> = {
  submitted: { label: 'Chờ duyệt', tone: 'info' },
  in_review: { label: 'Đang duyệt', tone: 'warning' },
  changes_requested: { label: 'Cần sửa', tone: 'danger' },
  rejected: { label: 'Bị từ chối', tone: 'danger' },
  published: { label: 'Đang bán', tone: 'success' },
  suspended: { label: 'Tạm gỡ', tone: 'danger' },
  archived: { label: 'Đã gỡ hẳn', tone: 'neutral' },
};

export const REPORT_CATEGORIES: Record<string, string> = {
  scary: 'Gây sợ hãi',
  violent: 'Bạo lực',
  inappropriate_lesson: 'Bài học không phù hợp',
  personal_info: 'Lộ thông tin cá nhân',
  technical_error: 'Lỗi kỹ thuật',
  other: 'Khác',
};

export const REPORT_STATUS: Record<string, Labeled> = {
  open: { label: 'Đang mở', tone: 'danger' },
  resolved: { label: 'Vi phạm — đã xử lý', tone: 'success' },
  dismissed: { label: 'Đã bác', tone: 'neutral' },
};

export const STRIKE_SOURCES: Record<StrikeSource, string> = {
  report: 'Báo cáo vi phạm',
  rejection: 'Bị từ chối khi duyệt',
  takedown: 'Truyện bị gỡ',
};

export const APPEAL_STATUS: Record<string, Labeled> = {
  pending: { label: 'Đang chờ xét', tone: 'warning' },
  approved: { label: 'Được chấp thuận — đã gỡ cảnh cáo', tone: 'success' },
  rejected: { label: 'Bị từ chối', tone: 'danger' },
  cancelled: { label: 'Đã huỷ', tone: 'neutral' },
};

export const CONTENT_ORIGIN: Record<string, Labeled> = {
  ai: { label: 'AI viết, chưa chỉnh sửa', tone: 'warning' },
  ai_edited: { label: 'AI viết, đã chỉnh sửa', tone: 'success' },
  human: { label: 'Người viết', tone: 'neutral' },
};

export const EMOTIONS: Record<string, string> = {
  happy: 'Vui',
  sad: 'Buồn',
  angry: 'Giận',
  scared: 'Sợ',
  neutral: 'Bình thường',
};

export const OPTION_ROLES: Record<string, string> = { constructive: 'Xây dựng', avoidant: 'Né tránh', impulsive: 'Bốc đồng' };

/** Checklist 7 nguyên tắc (Web/src/constants/reviewChecklist.js): chỉ chặn nút Duyệt phía client, KHÔNG gửi lên API (BE strict). */
export const REVIEW_CHECKLIST = [
  { code: 'no_answer_label', description: 'Lời kể không dán nhãn đáp án đúng ("đã chọn cách đúng đắn").' },
  { code: 'natural_consequence', description: 'Hệ quả tự nhiên, không trừng phạt (không "bị phạt đứng góc").' },
  { code: 'repair_path', description: 'Luôn có đường sửa sai; truyện không kết bằng việc hỏng không sửa được.' },
  { code: 'named_emotions', description: 'Cảm xúc được gọi tên rõ ràng (trừ trang ngay trước câu hỏi cảm xúc).' },
  { code: 'no_preaching', description: 'Tuyệt đối không giảng đạo lý ("Bài học hôm nay là…", "Con phải nhớ rằng…").' },
  { code: 'no_comparison', description: 'Không so sánh, không thi đua giữa các bé ("ngoan hơn").' },
  { code: 'age_appropriate', description: 'Hệ quả vừa tầm tuổi 5–8 (không chết chóc, mất mát vĩnh viễn, bố mẹ thất vọng làm hình phạt).' },
];

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'account.lock': 'Khoá tài khoản',
  'account.unlock': 'Mở khoá tài khoản',
  'account.create_moderator': 'Tạo Chuyên gia sư phạm',
  'plan.create': 'Tạo gói',
  'plan.update': 'Sửa gói',
  'price_tier.create': 'Thêm bậc giá',
  'price_tier.update': 'Sửa bậc giá',
  'setting.update': 'Sửa cấu hình',
  'refund.approved': 'Duyệt hoàn tiền',
  'refund.rejected': 'Từ chối hoàn tiền',
  'appeal.approved': 'Chấp thuận kháng nghị',
  'appeal.rejected': 'Từ chối kháng nghị',
  'strike.issue': 'Cảnh cáo tác giả',
  'listing.suspend': 'Tạm gỡ truyện',
  'report.dismiss': 'Bác báo cáo',
  'audit.schedule': 'Chọn đợt kiểm tra ngẫu nhiên',
  'reconcile.fix_counters': 'Tính lại bộ đếm truyện',
};

export const AUDIT_PREFIX_LABELS: Record<string, string> = {
  all: 'Tất cả',
  account: 'Tài khoản',
  plan: 'Gói',
  price_tier: 'Bậc giá',
  setting: 'Cấu hình',
  refund: 'Hoàn tiền',
  withdrawal: 'Rút tiền',
  appeal: 'Kháng nghị',
  strike: 'Cảnh cáo',
  listing: 'Truyện',
  report: 'Báo cáo',
  audit: 'Kiểm tra',
  reconcile: 'Đối soát',
};
