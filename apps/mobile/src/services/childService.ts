// apps/mobile/src/services/childService.ts
import { apiFetch } from './apiClient';
import { DEMO_CHILDREN } from './demoData';
import { ChildProfile } from '../../../../packages/shared-types';

export interface CreateChildPayload {
  name: string;
  birthDate?: string;
  preferredVoice?: string;
  appearance?: string;
}

export const childService = {
  /**
   * Danh sách hồ sơ bé: GET /children
   */
  getChildren: async (): Promise<ChildProfile[]> => {
    try {
      const data = await apiFetch<{ children: any[] }>('/children');
      const list = data?.children || (Array.isArray(data) ? data : []);
      return list.map(childService.formatChild);
    } catch (error) {
      return DEMO_CHILDREN;
    }
  },

  /**
   * Tạo hồ sơ bé mới: POST /children
   */
  createChild: async (payload: CreateChildPayload): Promise<ChildProfile> => {
    try {
      const data = await apiFetch<{ child: any }>('/children', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return childService.formatChild(data?.child || data);
    } catch (error) {
      // Fallback
      const newChild: ChildProfile = {
        id: `ch_local_${Date.now()}`,
        parentId: 'usr_parent',
        name: payload.name,
        age: 4,
        birthDate: payload.birthDate,
        gender: 'MALE',
        readingLevel: 'BEGINNER',
        favoriteThemes: ['Động vật', 'Vũ trụ'],
      };
      return newChild;
    }
  },

  /**
   * Cập nhật hồ sơ bé: PUT /children/:id
   */
  updateChild: async (childId: string, payload: Partial<CreateChildPayload>): Promise<ChildProfile> => {
    try {
      const data = await apiFetch<{ child: any }>(`/children/${childId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return childService.formatChild(data?.child || data);
    } catch (error) {
      return {
        id: childId,
        parentId: 'usr_parent',
        name: payload.name || 'Bé Yêu',
        age: 4,
        gender: 'MALE',
      };
    }
  },

  /**
   * Xóa hồ sơ bé: DELETE /children/:id
   */
  deleteChild: async (childId: string): Promise<boolean> => {
    try {
      await apiFetch(`/children/${childId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      return true;
    }
  },

  /**
   * Tổng quan hồ sơ & chỉ số EQ: GET /children/:id/overview
   */
  getChildOverview: async (childId: string): Promise<any> => {
    try {
      return await apiFetch(`/children/${childId}/overview`);
    } catch (error) {
      return {
        profile: { id: childId, name: 'Bé' },
        readingStats: { completedBooksCount: 2, totalMinutes: 24 },
        eqReport: {
          competencies: [
            { caselCode: 'self_awareness', nameVi: 'Tự nhận thức', level: 'developing' },
            { caselCode: 'social_awareness', nameVi: 'Nhận thức xã hội', level: 'secure' },
            { caselCode: 'relationship_skills', nameVi: 'Kỹ năng quan hệ', level: 'developing' },
          ],
        },
      };
    }
  },

  /**
   * Hành trình phát triển EQ: GET /children/:id/eq-journey?weeks=8
   */
  getChildEqJourney: async (childId: string, weeks = 8): Promise<any> => {
    try {
      return await apiFetch(`/children/${childId}/eq-journey?weeks=${weeks}`);
    } catch (error) {
      return {
        evidence: [],
        trend: [],
      };
    }
  },

  /**
   * Kệ sách của bé: GET /children/:id/bookshelf
   */
  getChildBookshelf: async (childId: string, page = 1, limit = 10): Promise<any> => {
    try {
      return await apiFetch(`/children/${childId}/bookshelf?page=${page}&limit=${limit}`);
    } catch (error) {
      return { items: [], pagination: { total: 0 } };
    }
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
      parentId: raw.parentId || 'usr_parent',
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
