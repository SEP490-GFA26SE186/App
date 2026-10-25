// apps/mobile/src/services/characterService.ts
import { apiFetch } from './apiClient';
import { DEMO_CHARACTERS } from './demoData';
import { FamilyCharacter } from '../../../../packages/shared-types';

export const characterService = {
  getCharacters: async (): Promise<FamilyCharacter[]> => {
    try {
      const data = await apiFetch<{ characters: any[] }>('/characters');
      const list = data?.characters || (Array.isArray(data) ? data : []);
      return list.map(characterService.formatCharacter);
    } catch (error) {
      return DEMO_CHARACTERS;
    }
  },

  createCharacter: async (payload: { name: string; appearance: string; role?: string }): Promise<FamilyCharacter> => {
    try {
      const data = await apiFetch<{ character: any }>('/characters', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return characterService.formatCharacter(data?.character || data);
    } catch (error) {
      const newChar: FamilyCharacter = {
        id: `char_local_${Date.now()}`,
        name: payload.name,
        relationRole: (payload.role as any) || 'HERO',
        appearanceDescription: payload.appearance,
        personalityTraits: ['Ấm áp', 'Tốt bụng'],
      };
      return newChar;
    }
  },

  updateCharacter: async (id: string, payload: { name?: string; appearance?: string }): Promise<FamilyCharacter> => {
    try {
      const data = await apiFetch<{ character: any }>(`/characters/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return characterService.formatCharacter(data?.character || data);
    } catch (error) {
      return {
        id,
        name: payload.name || '',
        appearanceDescription: payload.appearance || '',
      };
    }
  },

  deleteCharacter: async (id: string): Promise<boolean> => {
    try {
      await apiFetch(`/characters/${id}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      return true;
    }
  },

  formatCharacter: (raw: any): FamilyCharacter => {
    return {
      id: raw.id,
      parentId: raw.parentId || 'usr_parent',
      name: raw.name,
      relationRole: (raw.role?.toUpperCase() as any) || raw.relationRole || 'HERO',
      appearanceDescription: raw.appearance || raw.appearanceDescription || '',
      photoReferenceUrl: raw.portraitImageKey,
      personalityTraits: raw.personalityTraits || ['Tốt bụng'],
    };
  },
};
