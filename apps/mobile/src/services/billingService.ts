// apps/mobile/src/services/billingService.ts
// C12 – gói, quota, lịch sử credit. GĐ D1 – mua / gia hạn gói qua payOS, lịch sử thanh toán, yêu cầu hoàn tiền
// (BE billing.routes.js + admin.routes.js parentRefundRouter, gắn ở /payments). Không nạp credit lẻ (BE không có top-up).
import { apiFetch, invalidResponseError } from './apiClient';
import type {
  CheckoutResultDto,
  CreditEntryDto,
  MyOrdersDto,
  OrderDto,
  PaginationDto,
  PlanDetailDto,
  PlanDto,
  RefundDto,
  SubscriptionMeDto,
} from '../types/api';

export const billingService = {
  /** Danh sách gói (công khai): GET /plans → data { plans } */
  getPlans: async (): Promise<PlanDto[]> => {
    const data = await apiFetch<{ plans?: PlanDto[] }>('/plans', { skipAuth: true });
    if (!Array.isArray(data?.plans)) throw invalidResponseError('danh sách gói');
    return data.plans;
  },

  /** Chi tiết một gói (công khai, chỉ xem): GET /plans/:id → data { plan }. Không có thanh toán ở đây. */
  getPlan: async (id: string): Promise<PlanDetailDto> => {
    const data = await apiFetch<{ plan?: PlanDetailDto }>(`/plans/${encodeURIComponent(id)}`, { skipAuth: true });
    if (!data?.plan?.code) throw invalidResponseError('chi tiết gói');
    return data.plan;
  },

  /** Gói hiện tại + mức dùng: GET /subscriptions/me (isFallback = chưa có dòng subscription → gói Miễn phí mặc định của BE) */
  getSubscription: async (): Promise<SubscriptionMeDto> => {
    const data = await apiFetch<Partial<SubscriptionMeDto>>('/subscriptions/me');
    if (!data?.plan || !data.usage) throw invalidResponseError('gói hiện tại');
    return data as SubscriptionMeDto;
  },

  /** Lịch sử credit: GET /subscriptions/me/credit-history?page&limit(≤50) → data { entries, pagination } */
  getCreditHistory: async (page = 1, limit = 20): Promise<{ entries: CreditEntryDto[]; pagination: PaginationDto }> => {
    const data = await apiFetch<{ entries?: CreditEntryDto[]; pagination?: PaginationDto }>(
      `/subscriptions/me/credit-history?page=${page}&limit=${limit}`
    );
    if (!Array.isArray(data?.entries) || !data.pagination) throw invalidResponseError('lịch sử credit');
    return { entries: data.entries, pagination: data.pagination };
  },

  /** Tạo đơn mua / gia hạn gói: POST /payments/plans/checkout { planId } → { order, checkoutUrl } (checkoutUrl null với gói 0đ) */
  checkoutPlan: async (planId: string): Promise<CheckoutResultDto> => {
    const data = await apiFetch<Partial<CheckoutResultDto>>('/payments/plans/checkout', { method: 'POST', body: JSON.stringify({ planId }) });
    if (!data?.order?.id || (data.checkoutUrl !== null && typeof data.checkoutUrl !== 'string')) throw invalidResponseError('đơn thanh toán');
    return { order: data.order, checkoutUrl: data.checkoutUrl };
  },

  /** Trạng thái đơn: GET /payments/orders/:orderId → { order }. Đơn còn chờ thì BE tự hỏi payOS trước khi trả */
  getOrder: async (orderId: string): Promise<OrderDto> => {
    const data = await apiFetch<{ order?: OrderDto }>(`/payments/orders/${encodeURIComponent(orderId)}`);
    if (!data?.order?.status) throw invalidResponseError('trạng thái đơn');
    return data.order;
  },

  /** Lịch sử thanh toán (đơn đã trả > 0đ) + hạn hoàn tiền từng mục: GET /payments/orders */
  getMyOrders: async (): Promise<MyOrdersDto> => {
    const data = await apiFetch<Partial<MyOrdersDto>>('/payments/orders');
    if (!Array.isArray(data?.orders) || typeof data.refundWindowDays !== 'number') throw invalidResponseError('lịch sử thanh toán');
    return { refundWindowDays: data.refundWindowDays, orders: data.orders };
  },

  /** Yêu cầu hoàn tiền một mục: POST /payments/order-items/:itemId/refund { reason } (10–2000 ký tự) → 201 { refund } */
  requestRefund: async (itemId: string, reason: string): Promise<RefundDto> => {
    const data = await apiFetch<{ refund?: RefundDto }>(`/payments/order-items/${encodeURIComponent(itemId)}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason.trim() }),
    });
    if (!data?.refund?.id) throw invalidResponseError('yêu cầu hoàn tiền');
    return data.refund;
  },
};
