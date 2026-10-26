// apps/mobile/src/services/billingService.ts
// C12 – CHỈ XEM gói, quota, lịch sử credit. Không nạp credit / thanh toán (SCOPE PENDING; BE không có top-up).
import { apiFetch, invalidResponseError } from './apiClient';
import type { CreditEntryDto, PaginationDto, PlanDto, SubscriptionMeDto } from '../types/api';

export const billingService = {
  /** Danh sách gói (công khai): GET /plans → data { plans } */
  getPlans: async (): Promise<PlanDto[]> => {
    const data = await apiFetch<{ plans?: PlanDto[] }>('/plans', { skipAuth: true });
    if (!Array.isArray(data?.plans)) throw invalidResponseError('danh sách gói');
    return data.plans;
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
};
