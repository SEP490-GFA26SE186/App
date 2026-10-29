// apps/mobile/src/services/characterService.ts
import { apiFetch, invalidResponseError } from './apiClient';
import { CharacterView } from '../types/viewModels';
import type { CharacterDetailDto, CharacterDto, CharactersListDto, CharacterResponseDto } from '../types/api';

// Mọi hàm ở đây throw ApiError khi BE lỗi/từ chối/trả sai hình dạng.
// Không được trả dữ liệu mẫu hoặc "thành công" giả (ADR-008).
export const characterService = {
  /**
   * Danh sách nhân vật: GET /characters → data { characters: [] }
   * Danh sách rỗng là kết quả hợp lệ.
   */
  getCharacters: async (): Promise<CharacterView[]> => {
    const data = await apiFetch<Partial<CharactersListDto>>('/characters');
    const list = Array.isArray(data?.characters) ? data.characters : Array.isArray(data) ? (data as any[]) : null;
    if (!list) throw invalidResponseError('danh sách nhân vật');
    return list.map(characterService.formatCharacter);
  },

  createCharacter: async (payload: { name: string; appearance: string }): Promise<CharacterView> => {
    const data = await apiFetch<Partial<CharacterResponseDto>>('/characters', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!data?.character?.id) throw invalidResponseError('tạo nhân vật');
    return characterService.formatCharacter(data.character);
  },

  updateCharacter: async (id: string, payload: { name?: string; appearance?: string }): Promise<CharacterView> => {
    const data = await apiFetch<Partial<CharacterResponseDto>>(`/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!data?.character?.id) throw invalidResponseError('cập nhật nhân vật');
    return characterService.formatCharacter(data.character);
  },

  /** Chi tiết nhân vật: GET /characters/:id → data { character } (kèm `child` nếu là nhân vật đại diện của bé). Chỉ đọc. */
  getCharacter: async (id: string): Promise<CharacterDetailDto> => {
    const data = await apiFetch<{ character?: CharacterDetailDto }>(`/characters/${id}`);
    if (!data?.character?.id) throw invalidResponseError('chi tiết nhân vật');
    return data.character;
  },

  deleteCharacter: async (id: string): Promise<boolean> => {
    await apiFetch(`/characters/${id}`, { method: 'DELETE' });
    return true;
  },

  /** Chỉ ánh xạ trường BE thực sự trả (không `role`/tính cách bịa) */
  formatCharacter: (raw: Partial<CharacterDto> & { childId?: string | null }): CharacterView => ({
    id: raw.id as string,
    name: raw.name as string,
    appearanceDescription: raw.appearance ?? '',
    photoReferenceUrl: raw.portraitImageUrl ?? undefined,
    portraitStatus: raw.portraitStatus ?? null,
    childId: raw.childId ?? null,
  }),
};
