// apps/mobile/src/services/characterService.ts
import { apiFetch, invalidResponseError } from './apiClient';
import { FamilyCharacter } from '../../../../packages/shared-types';

// Mọi hàm ở đây throw ApiError khi BE lỗi/từ chối/trả sai hình dạng.
// Không được trả dữ liệu mẫu hoặc "thành công" giả (ADR-008).
export const characterService = {
  /**
   * Danh sách nhân vật: GET /characters → data { characters: [] }
   * Danh sách rỗng là kết quả hợp lệ.
   */
  getCharacters: async (): Promise<FamilyCharacter[]> => {
    const data = await apiFetch<{ characters?: any[] }>('/characters');
    const list = Array.isArray(data?.characters) ? data.characters : Array.isArray(data) ? (data as any[]) : null;
    if (!list) throw invalidResponseError('danh sách nhân vật');
    return list.map(characterService.formatCharacter);
  },

  createCharacter: async (payload: { name: string; appearance: string; role?: string }): Promise<FamilyCharacter> => {
    const data = await apiFetch<{ character?: any }>('/characters', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!data?.character?.id) throw invalidResponseError('tạo nhân vật');
    return characterService.formatCharacter(data.character);
  },

  updateCharacter: async (id: string, payload: { name?: string; appearance?: string }): Promise<FamilyCharacter> => {
    const data = await apiFetch<{ character?: any }>(`/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!data?.character?.id) throw invalidResponseError('cập nhật nhân vật');
    return characterService.formatCharacter(data.character);
  },

  deleteCharacter: async (id: string): Promise<boolean> => {
    await apiFetch(`/characters/${id}`, { method: 'DELETE' });
    return true;
  },

  formatCharacter: (raw: any): FamilyCharacter => {
    return {
      id: raw.id,
      parentId: raw.parentId || '',
      name: raw.name,
      relationRole: (raw.role?.toUpperCase() as any) || raw.relationRole || 'HERO',
      appearanceDescription: raw.appearance || raw.appearanceDescription || '',
      photoReferenceUrl: raw.portraitImageKey,
      personalityTraits: raw.personalityTraits || ['Tốt bụng'],
    };
  },
};
