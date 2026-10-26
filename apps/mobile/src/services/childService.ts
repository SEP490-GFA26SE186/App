// apps/mobile/src/services/childService.ts
import { apiFetch, invalidResponseError } from './apiClient';
import { ChildProfile } from '../../../../packages/shared-types';
import type { ChildDto, ChildOverviewDto, ChildrenListDto, ChildResponseDto, EqReportDto } from '../types/api';

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
