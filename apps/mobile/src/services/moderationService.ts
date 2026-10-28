// apps/mobile/src/services/moderationService.ts
// Chuyên gia sư phạm (BE: authorize('specialist', 'admin')). Đối chiếu BE/api/src/modules/publishing/publishing.routes.js
// (hàng chờ, nhận bài, xem trang, quyết định, hồ sơ người bán) và monitoring/monitoring.routes.js (báo cáo, tạm gỡ, cảnh cáo).
import { apiFetch, invalidResponseError } from './apiClient';
import { toQuery } from './adminService';
import type { QueueItem, ReportGroup, ReportStatus, ReviewDecision, ReviewDetail, SellerApplication, SellerStatus } from '../types/management';

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
  /** Cảnh cáo tác giả: { sellerId, source, sourceId?, reason (>= 10 ký tự) } */
  issueStrike: (body: { sellerId: string; source: 'report'; sourceId?: string; reason: string }) => post('/moderation/strikes', body),
  /** Ẩn đánh giá vi phạm */
  hideProductReview: (reviewId: string) => post(`/moderation/product-reviews/${reviewId}/hide`),
};
