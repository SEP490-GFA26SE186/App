// apps/mobile/src/services/childService.ts
import { apiFetch, invalidResponseError } from './apiClient';
import { ChildProfile } from '../../../../packages/shared-types';

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
    const data = await apiFetch<{ children?: any[] }>('/children');
    const list = Array.isArray(data?.children) ? data.children : Array.isArray(data) ? (data as any[]) : null;
    if (!list) throw invalidResponseError('danh sách hồ sơ bé');
    return list.map(childService.formatChild);
  },

  /**
   * Tạo hồ sơ bé mới: POST /children → data { child }
   */
  createChild: async (payload: CreateChildPayload): Promise<ChildProfile> => {
    const data = await apiFetch<{ child?: any }>('/children', {
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
    const data = await apiFetch<{ child?: any }>(`/children/${childId}`, {
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
   * Tổng quan hồ sơ & chỉ số EQ: GET /children/:id/overview
   */
  getChildOverview: async (childId: string): Promise<any> => {
    return apiFetch(`/children/${childId}/overview`);
  },

  /**
   * Hành trình phát triển EQ: GET /children/:id/eq-journey?weeks=8
   */
  getChildEqJourney: async (childId: string, weeks = 8): Promise<any> => {
    return apiFetch(`/children/${childId}/eq-journey?weeks=${weeks}`);
  },

  /**
   * Kệ sách của bé: GET /children/:id/bookshelf
   */
  getChildBookshelf: async (childId: string, page = 1, limit = 10): Promise<any> => {
    return apiFetch(`/children/${childId}/bookshelf?page=${page}&limit=${limit}`);
  },

  formatChild: (raw: any): ChildProfile => {
    let calcAge = raw.age;
    if (!calcAge && raw.birthDate) {
      const birth = new Date(raw.birthDate);
      const diff = Date.now() - birth.getTime();
      calcAge = Math.max(1, Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
    }

    return {
      id: raw.id,
      parentId: raw.parentId || '',
      name: raw.name,
      nickname: raw.nickname || raw.name,
      birthDate: raw.birthDate,
      age: calcAge || 4,
      gender: raw.gender || 'MALE',
      readingLevel: raw.readingLevel || 'BEGINNER',
      favoriteThemes: raw.favoriteThemes || ['Gia đình', 'Động vật'],
      favoriteTopics: raw.favoriteTopics || [],
      avatarUrl: raw.avatarUrl || raw.character?.portraitImageKey,
    };
  },
};
