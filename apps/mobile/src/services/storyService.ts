// apps/mobile/src/services/storyService.ts
import { apiFetch } from './apiClient';
import { DEMO_STORIES, DEMO_TEMPLATES } from './demoData';
import { Story, PedagogicalTemplate } from '../../../../packages/shared-types';

export const storyService = {
  /**
   * Lấy danh sách truyện của phụ huynh: GET /stories
   */
  getStories: async (params: { status?: string; page?: number; limit?: number } = {}): Promise<Story[]> => {
    try {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());

      const data = await apiFetch<{ data: any[]; pagination: any }>(`/stories?${query.toString()}`);
      const list = data?.data || (Array.isArray(data) ? data : []);
      return list.map(storyService.formatStory);
    } catch (error) {
      return DEMO_STORIES;
    }
  },

  /**
   * Lấy chi tiết truyện: GET /stories/:id
   */
  getStory: async (id: string): Promise<Story> => {
    try {
      const data = await apiFetch<{ story: any }>(`/stories/${id}`);
      return storyService.formatStory(data?.story || data);
    } catch (error) {
      const found = DEMO_STORIES.find((s) => s.id === id);
      if (found) return found;
      throw error;
    }
  },

  /**
   * Tạo truyện mới (Draft): POST /stories
   */
  createStory: async (payload: {
    entry?: 'topic' | 'family' | 'custom';
    title: string;
    topicId?: string;
    length?: string;
    situation?: string;
    characters?: Array<{ characterId: string; isMain: boolean }>;
    useAiImage?: boolean;
    useTts?: boolean;
  }): Promise<Story> => {
    try {
      const data = await apiFetch<{ story: any }>('/stories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return storyService.formatStory(data?.story || data);
    } catch (error) {
      const newStory: Story = {
        id: `story_local_${Date.now()}`,
        title: payload.title,
        status: 'PUBLISHED',
        theme: 'Cổ tích & EQ',
        targetAgeGroup: '3-6',
        createdAt: new Date().toISOString(),
        pages: [
          {
            id: 'p_loc_1',
            pageNumber: 1,
            text: payload.situation || 'Một ngày nắng ấm đẹp trời trong khu vườn kỳ diệu...',
            illustrationUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
          },
        ],
      };
      return newStory;
    }
  },

  /**
   * Thêm truyện vào kệ sách của bé: POST /bookshelf
   */
  addToShelf: async (childId: string, storyId: string): Promise<boolean> => {
    try {
      await apiFetch('/bookshelf', {
        method: 'POST',
        body: JSON.stringify({ childId, storyId }),
      });
      return true;
    } catch (error) {
      return true;
    }
  },

  /**
   * Gỡ truyện khỏi kệ sách của bé: DELETE /bookshelf/:storyId?childId=...
   */
  removeFromShelf: async (childId: string, storyId: string): Promise<boolean> => {
    try {
      await apiFetch(`/bookshelf/${storyId}?childId=${childId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      return true;
    }
  },

  /**
   * Lấy danh sách mẫu sư phạm / chủ đề: GET /topics
   */
  getTemplates: async (): Promise<PedagogicalTemplate[]> => {
    try {
      const data = await apiFetch<any[]>('/topics');
      if (Array.isArray(data) && data.length > 0) {
        return data.map((t) => ({
          id: t.id,
          title: t.title,
          category: t.skill?.nameVi || 'EMOTIONAL_INTELLIGENCE',
          targetAgeGroup: `${t.ageMin || 3}-${t.ageMax || 6}`,
          description: t.guidance || 'Rèn luyện kỹ năng cảm xúc và hành vi cho bé.',
          icon: '✨',
        }));
      }
      return DEMO_TEMPLATES;
    } catch (error) {
      return DEMO_TEMPLATES;
    }
  },

  formatStory: (raw: any): Story => {
    return {
      id: raw.id,
      creatorId: raw.creatorId || raw.authorId || 'usr_parent',
      title: raw.title,
      summary: raw.summary || raw.description || '',
      coverImageUrl: raw.cover?.imageUrl || raw.coverImageUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      theme: raw.topic?.title || raw.theme || 'Trí tuệ cảm xúc',
      targetAgeGroup: raw.targetAgeGroup || '3-6',
      status: (raw.status?.toUpperCase() as any) || 'PUBLISHED',
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
      pages: (raw.pages || []).map((p: any, idx: number) => ({
        id: p.id || `p_${idx}`,
        pageNumber: p.pageNumber ?? idx + 1,
        text: p.contentText || p.text || '',
        illustrationUrl: p.illustrationUrl || p.scene?.imageUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
        audioNarrationUrl: p.audioNarrationUrl || p.narrationAudioKey,
        choices: (p.choices || p.checkpoints || []).map((c: any) => ({
          id: c.id,
          label: c.label || c.question || 'Tiếp tục câu chuyện',
          targetNextPageNumber: c.targetNextPageNumber ?? (p.pageNumber ? p.pageNumber + 1 : idx + 2),
          eqSignal: c.eqSignal || 'EMPATHY',
        })),
      })),
    };
  },
};
