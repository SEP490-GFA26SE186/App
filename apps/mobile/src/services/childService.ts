// apps/mobile/src/services/childService.ts
import { apiFetch, invalidResponseError } from './apiClient';
import { ChildProfile } from '../types/domain';
import type {
  ChildBookshelfDto,
  ChildDto,
  ChildOverviewDto,
  ChildrenListDto,
  ChildResponseDto,
  ChildUsageDto,
  EqJourneyDto,
  EqReportDto,
  ShelfStatus,
} from '../types/api';

export interface CreateChildPayload {
  name: string;
  birthDate?: string;
  preferredVoice?: string;
  appearance?: string;
}

// Mọi hàm ở đây throw ApiError khi BE lỗi/từ chối/trả sai hình dạng.
// Không được trả dữ liệu mẫu hoặc "thành công" giả (ADR-008).
export const childService = {
  /**
   * Danh sách hồ sơ bé: GET /children → data { children: [] }
   * Danh sách rỗng là kết quả hợp lệ.
   */
  getChildren: async (): Promise<ChildProfile[]> => {
    const data = await apiFetch<Partial<ChildrenListDto>>('/children');
    const list = Array.isArray(data?.children) ? data.children : Array.isArray(data) ? (data as any[]) : null;
    if (!list) throw invalidResponseError('danh sách hồ sơ bé');
    return list.map(childService.formatChild);
  },

  /**
   * Tạo hồ sơ bé mới: POST /children → data { child }
   */
  createChild: async (payload: CreateChildPayload): Promise<ChildProfile> => {
    const data = await apiFetch<Partial<ChildResponseDto>>('/children', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!data?.child?.id) throw invalidResponseError('tạo hồ sơ bé');
    return childService.formatChild(data.child);
  },

  /**
   * Cập nhật hồ sơ bé: PUT /children/:id → data { child }
   */
  updateChild: async (childId: string, payload: Partial<CreateChildPayload>): Promise<ChildProfile> => {
    const data = await apiFetch<Partial<ChildResponseDto>>(`/children/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!data?.child?.id) throw invalidResponseError('cập nhật hồ sơ bé');
    return childService.formatChild(data.child);
  },

  /**
   * Xóa hồ sơ bé: DELETE /children/:id
   */
  deleteChild: async (childId: string): Promise<boolean> => {
    await apiFetch(`/children/${childId}`, {
      method: 'DELETE',
    });
    return true;
  },

  /**
   * Tổng quan: GET /children/:id/overview → { profile, todayUsage, readingStats, eqReport }
   */
  getChildOverview: async (childId: string): Promise<ChildOverviewDto> => {
    const data = await apiFetch<Partial<ChildOverviewDto>>(`/children/${childId}/overview`);
    if (!data?.profile?.id || !data.todayUsage || !data.readingStats) throw invalidResponseError('tổng quan của bé');
    return data as ChildOverviewDto;
  },

  /**
   * Báo cáo EQ theo năng lực CASEL: GET /children/:id/eq-report
   */
  getChildEqReport: async (childId: string): Promise<EqReportDto> => {
    const data = await apiFetch<Partial<EqReportDto>>(`/children/${childId}/eq-report`);
    if (!data?.childId || !Array.isArray(data.competencies)) throw invalidResponseError('báo cáo EQ');
    return { ...data, recommendations: data.recommendations ?? [] } as EqReportDto;
  },

  /** Chi tiết hồ sơ bé: GET /children/:id → data { child } (DTO gốc: có nhân vật đại diện, số truyện, lượt đọc xong) */
  getChild: async (childId: string): Promise<ChildDto> => {
    const data = await apiFetch<Partial<ChildResponseDto>>(`/children/${childId}`);
    if (!data?.child?.id) throw invalidResponseError('hồ sơ bé');
    return data.child;
  },

  /** Thời gian đọc trong một ngày (giờ VN): GET /children/:id/usage?date=YYYY-MM-DD; không có date = hôm nay */
  getChildUsage: async (childId: string, date?: string): Promise<ChildUsageDto> => {
    const query = date ? `?date=${date}` : '';
    const data = await apiFetch<Partial<ChildUsageDto>>(`/children/${childId}/usage${query}`);
    if (typeof data?.usedSeconds !== 'number' || typeof data.sessionsCount !== 'number') throw invalidResponseError('thời gian đọc');
    return data as ChildUsageDto;
  },

  /** Hành trình EQ: GET /children/:id/eq-journey?weeks=4..26 → báo cáo EQ + trend theo tuần */
  getChildEqJourney: async (childId: string, weeks = 8): Promise<EqJourneyDto> => {
    const data = await apiFetch<Partial<EqJourneyDto>>(`/children/${childId}/eq-journey?weeks=${weeks}`);
    if (!Array.isArray(data?.trend)) throw invalidResponseError('hành trình EQ');
    return data as EqJourneyDto;
  },

  /** Giá sách của bé: GET /children/:id/bookshelf?page&limit(≤50)&status → data { child, items, pagination, counts, continueReading } */
  getChildBookshelf: async (childId: string, params: { page?: number; limit?: number; status?: ShelfStatus } = {}): Promise<ChildBookshelfDto> => {
    const query = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 10), status: params.status ?? 'all' });
    const data = await apiFetch<Partial<ChildBookshelfDto>>(`/children/${childId}/bookshelf?${query}`);
    if (!Array.isArray(data?.items) || !data.counts || !data.pagination) throw invalidResponseError('giá sách của bé');
    return data as ChildBookshelfDto;
  },

  /** Chỉ ánh xạ trường BE trả. `age` do BE tính từ ngày sinh; không có ngày sinh → 0 (UI dùng `ageLabel`, không hiện số). */
  formatChild: (raw: Partial<ChildDto> & { parentId?: string }): ChildProfile => ({
    id: raw.id as string,
    parentId: raw.parentId ?? '',
    name: raw.name as string,
    birthDate: raw.birthDate ?? undefined,
    age: typeof raw.age === 'number' ? raw.age : 0,
    avatarUrl: raw.character?.portraitImageUrl ?? undefined,
  }),
};
