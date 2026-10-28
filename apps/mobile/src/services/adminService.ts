// apps/mobile/src/services/adminService.ts
// Quản trị (chỉ role admin — BE: authorize('admin')). Endpoint đối chiếu BE/api/src/modules/admin/admin.routes.js,
// market/withdrawals.routes.js (rút tiền) và monitoring/monitoring.routes.js (kháng nghị). Lỗi BE giữ nguyên message.
import { apiFetch, invalidResponseError } from './apiClient';
import type {
  AccountRole,
  AccountsPage,
  AdminNavBadges,
  AppealStatus,
  AuditLogsPage,
  FinanceRange,
  FinanceSummary,
  RefundRequest,
  RefundStatus,
  StrikeAppeal,
  Withdrawal,
  WithdrawalStatus,
} from '../types/management';

/** Bỏ tham số rỗng/"all" (BE mặc định "all") rồi ghép query string */
export const toQuery = (params: Record<string, string | number | undefined | null>): string => {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

const listOf = <T,>(value: unknown, what: string): T[] => {
  if (!Array.isArray(value)) throw invalidResponseError(what);
  return value as T[];
};

const post = <T,>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

export const adminService = {
  /** GET /admin/overview → { navBadges } (số việc đang chờ) */
  getOverview: async (): Promise<AdminNavBadges> => {
    const data = await apiFetch<{ navBadges?: AdminNavBadges }>('/admin/overview');
    if (!data?.navBadges) throw invalidResponseError('tổng quan quản trị');
    return data.navBadges;
  },

  /** GET /admin/finance/summary?range */
  getFinanceSummary: async (range: FinanceRange): Promise<FinanceSummary> => {
    const data = await apiFetch<FinanceSummary>(`/admin/finance/summary${toQuery({ range })}`);
    if (!data?.revenue || !Array.isArray(data.series) || !data.sellerFunds) throw invalidResponseError('số liệu tài chính');
    return data;
  },

  /** GET /admin/accounts?role&status&search&page */
  getAccounts: async (params: { role: AccountRole | 'all'; status: 'all' | 'active' | 'locked'; search: string; page: number }): Promise<AccountsPage> => {
    const data = await apiFetch<AccountsPage>(`/admin/accounts${toQuery({ ...params, search: params.search.trim() })}`);
    if (!Array.isArray(data?.accounts) || !data.pagination) throw invalidResponseError('danh sách tài khoản');
    return data;
  },

  /** PATCH /admin/accounts/:userId { isActive } — khoá thì BE thu hồi phiên của người đó */
  setAccountActive: (userId: string, isActive: boolean) =>
    apiFetch<{ id: string; isActive: boolean }>(`/admin/accounts/${userId}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),

  /** POST /admin/accounts/moderators — tạo tài khoản Chuyên gia sư phạm */
  createSpecialist: (body: { email: string; username: string; fullName: string; password: string }) =>
    post<{ account: { id: string } }>('/admin/accounts/moderators', body),

  /** GET /admin/withdrawals?status → { withdrawals } */
  getWithdrawals: async (status: WithdrawalStatus): Promise<Withdrawal[]> =>
    listOf<Withdrawal>((await apiFetch<{ withdrawals?: unknown }>(`/admin/withdrawals${toQuery({ status })}`))?.withdrawals, 'danh sách rút tiền'),
  /** POST /admin/withdrawals/:id/mark-paid { bankTransactionRef? } */
  markWithdrawalPaid: (id: string, bankTransactionRef?: string) =>
    post(`/admin/withdrawals/${id}/mark-paid`, bankTransactionRef ? { bankTransactionRef } : {}),
  /** POST /admin/withdrawals/:id/reject { reason } (BE: tối thiểu 3 ký tự) */
  rejectWithdrawal: (id: string, reason: string) => post(`/admin/withdrawals/${id}/reject`, { reason }),

  /** GET /admin/refunds?status → { refunds } */
  getRefunds: async (status: RefundStatus): Promise<RefundRequest[]> =>
    listOf<RefundRequest>((await apiFetch<{ refunds?: unknown }>(`/admin/refunds${toQuery({ status })}`))?.refunds, 'danh sách hoàn tiền'),
  /** POST /admin/refunds/:id/decision { approve, bankTransactionRef?, note? } */
  decideRefund: (id: string, body: { approve: boolean; bankTransactionRef?: string; note?: string }) =>
    post(`/admin/refunds/${id}/decision`, body),

  /** GET /admin/appeals?status → { appeals } */
  getAppeals: async (status: AppealStatus): Promise<StrikeAppeal[]> =>
    listOf<StrikeAppeal>((await apiFetch<{ appeals?: unknown }>(`/admin/appeals${toQuery({ status })}`))?.appeals, 'danh sách kháng nghị'),
  /** POST /admin/appeals/:id/decision { approve, note? } → { status, sellerReinstated } */
  decideAppeal: (id: string, body: { approve: boolean; note?: string }) =>
    post<{ status: AppealStatus; sellerReinstated?: boolean }>(`/admin/appeals/${id}/decision`, body),

  /** GET /admin/audit-logs?action&page → { prefixes, logs, pagination } (chỉ đọc) */
  getAuditLogs: async (params: { action: string; page: number }): Promise<AuditLogsPage> => {
    const data = await apiFetch<AuditLogsPage>(`/admin/audit-logs${toQuery(params)}`);
    if (!Array.isArray(data?.logs) || !data.pagination) throw invalidResponseError('nhật ký kiểm toán');
    return { ...data, prefixes: Array.isArray(data.prefixes) ? data.prefixes : [] };
  },
};
