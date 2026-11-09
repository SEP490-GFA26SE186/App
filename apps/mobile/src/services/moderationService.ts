// apps/mobile/src/services/moderationService.ts
// Chuyên gia sư phạm (BE: authorize('specialist', 'admin')). Đối chiếu BE/api/src/modules/publishing/publishing.routes.js
// (hàng chờ, nhận bài, xem trang, quyết định, hồ sơ người bán) và monitoring/monitoring.routes.js (báo cáo, tạm gỡ, cảnh cáo).
import { apiFetch, invalidResponseError } from './apiClient';
import { toQuery } from './adminService';
import type {
  AiBlockResult,
  AiFlag,
  AiFlagsResult,
  IssueStrikeResult,
  QueueItem,
  RandomAudit,
  ReportGroup,
  ReportStatus,
  RestrictedListing,
  RestrictedStatus,
  ReviewDecision,
  ReviewDetail,
  RunAuditsResult,
  SellerApplication,
  SellerStatus,
  Strike,
  StrikeSource,
  StrikesResult,
} from '../types/management';

const post = <T,>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

const detailOrThrow = (data: ReviewDetail | null | undefined): ReviewDetail => {
  if (!data?.review || !data.story || !Array.isArray(data.story.pages) || !Array.isArray(data.pageViews)) {
    throw invalidResponseError('lượt duyệt');
  }
  return data;
};

const listOf = <T,>(value: unknown, what: string): T[] => {
  if (!Array.isArray(value)) throw invalidResponseError(what);
  return value as T[];
};

export const moderationService = {
  /** GET /moderation/submissions → { queue } (cũ nhất trước) */
  getQueue: async (): Promise<QueueItem[]> =>
    listOf<QueueItem>((await apiFetch<{ queue?: unknown }>('/moderation/submissions'))?.queue, 'hàng chờ duyệt'),

  /** GET /moderation/submissions/:reviewId */
  getReview: async (reviewId: string) => detailOrThrow(await apiFetch<ReviewDetail>(`/moderation/submissions/${reviewId}`)),
  /** POST .../claim — giữ bài có thời hạn; người khác đang giữ → 409 */
  claimReview: async (reviewId: string) => detailOrThrow(await post<ReviewDetail>(`/moderation/submissions/${reviewId}/claim`)),
  /** POST .../pages/:pageId/view { comment? } — đánh dấu đã xem (+ nhận xét) */
  viewPage: async (reviewId: string, pageId: string, comment?: string) =>
    detailOrThrow(await post<ReviewDetail>(`/moderation/submissions/${reviewId}/pages/${pageId}/view`, comment === undefined ? {} : { comment })),
  /**
   * POST .../decision { decision, comment?, issueStrike? } — BE strict: không gửi checklist.
   * approved cần đã xem 100% trang; quyết định khác bắt buộc nhận xét.
   */
  decide: async (reviewId: string, body: { decision: ReviewDecision; comment?: string; issueStrike?: boolean }) =>
    detailOrThrow(await post<ReviewDetail>(`/moderation/submissions/${reviewId}/decision`, body)),

  /** GET /moderation/sellers?status → { sellers } */
  getSellerApplications: async (status: SellerStatus): Promise<SellerApplication[]> =>
    listOf<SellerApplication>((await apiFetch<{ sellers?: unknown }>(`/moderation/sellers${toQuery({ status })}`))?.sellers, 'hồ sơ người bán'),
  /** POST /moderation/sellers/:userId/decision { approve } */
  decideSeller: (userId: string, approve: boolean) => post(`/moderation/sellers/${userId}/decision`, { approve }),

  /** GET /moderation/reports?status → { groups } */
  getReportGroups: async (status: ReportStatus): Promise<ReportGroup[]> =>
    // status "all" phải gửi lên (BE mặc định "open")
    listOf<ReportGroup>((await apiFetch<{ groups?: unknown }>(`/moderation/reports?status=${status}`))?.groups, 'báo cáo vi phạm'),
  dismissReport: (reportId: string) => post(`/moderation/reports/${reportId}/dismiss`),
  /** Tạm gỡ truyện đang bán (lý do >= 5 ký tự) → BE tạo lượt hậu kiểm */
  suspendListing: (listingId: string, reason: string) => post(`/moderation/listings/${listingId}/suspend`, { reason }),
  /** Cảnh cáo tác giả: { sellerId, source, sourceId?, reason (>= 10 ký tự) } → 201 { strikeId, activeStrikes, strikeLimit, sellerSuspended } */
  issueStrike: (body: { sellerId: string; source: StrikeSource; sourceId?: string; reason: string }) => post<IssueStrikeResult>('/moderation/strikes', body),
  /** Ẩn đánh giá vi phạm */
  hideProductReview: (reviewId: string) => post(`/moderation/product-reviews/${reviewId}/hide`),

  // ---- GĐ E1: giám sát (monitoring.routes.js:35-100) ----

  /** GET /moderation/listings?status=suspended|archived → { listings } */
  getRestrictedListings: async (status: RestrictedStatus): Promise<RestrictedListing[]> =>
    listOf<RestrictedListing>((await apiFetch<{ listings?: unknown }>(`/moderation/listings${toQuery({ status })}`))?.listings, 'truyện tạm gỡ'),

  /** GET /moderation/strikes[?active=true] → { strikeLimit, strikes } (Web: chỉ gửi active khi lọc) */
  getStrikes: async ({ active }: { active?: boolean } = {}): Promise<StrikesResult> => {
    const data = await apiFetch<Partial<StrikesResult>>(`/moderation/strikes${active ? '?active=true' : ''}`);
    if (typeof data?.strikeLimit !== 'number') throw invalidResponseError('cảnh cáo');
    return { strikeLimit: data.strikeLimit, strikes: listOf<Strike>(data.strikes, 'cảnh cáo') };
  },

  /** GET /moderation/audits → { audits } (mới nhất trước) */
  getAudits: async (): Promise<RandomAudit[]> => listOf<RandomAudit>((await apiFetch<{ audits?: unknown }>('/moderation/audits'))?.audits, 'kiểm tra ngẫu nhiên'),

  /** POST /moderation/audits/run { count? (1–20) } → 201 { created, reviewIds }. Không có count → BE dùng số truyện/tuần đã cấu hình */
  runAudits: async (count?: number): Promise<RunAuditsResult> => {
    const data = await post<Partial<RunAuditsResult>>('/moderation/audits/run', count ? { count } : {});
    if (typeof data?.created !== 'number') throw invalidResponseError('chọn đợt kiểm tra');
    return { created: data.created, reviewIds: listOf<string>(data.reviewIds, 'chọn đợt kiểm tra') };
  },

  /** GET /moderation/ai-flags?days&min → { days, min, flags } */
  getAiFlags: async ({ days = 7, min = 2 }: { days?: number; min?: number } = {}): Promise<AiFlagsResult> => {
    const data = await apiFetch<Partial<AiFlagsResult>>(`/moderation/ai-flags${toQuery({ days, min })}`);
    return { days: data?.days ?? days, min: data?.min ?? min, flags: listOf<AiFlag>(data?.flags, 'cảnh báo AI') };
  },

  /** POST /moderation/ai-flags/:userId/block { days (0 = mở khoá, ≤ 90), reason? } → { userId, aiBlockedUntil } */
  setAiBlock: async (userId: string, body: { days: number; reason?: string }): Promise<AiBlockResult> => {
    const data = await post<Partial<AiBlockResult>>(`/moderation/ai-flags/${userId}/block`, body);
    if (data?.userId !== userId) throw invalidResponseError('khoá quyền dùng AI');
    return { userId, aiBlockedUntil: data.aiBlockedUntil ?? null };
  },
};

/**
 * Tổng quan kiểm duyệt như Web `getSpecialistOverview` (không có endpoint riêng): hàng chờ, hồ sơ người bán chờ duyệt,
 * tổng báo cáo đang mở, kiểm tra ngẫu nhiên = số mục `random_audit` trong hàng chờ.
 */
export const buildSpecialistOverview = (queue: QueueItem[], pendingSellers: unknown[], openReportGroups: ReportGroup[]) => ({
  queue,
  sellerApplications: pendingSellers.length,
  openReports: openReportGroups.reduce((n, g) => n + g.reports.length, 0),
  audits: queue.filter((q) => q.reviewType === 'random_audit').length,
});
