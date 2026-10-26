// apps/mobile/src/services/storyService.ts
import { apiFetch, invalidResponseError } from './apiClient';
import { Story, PedagogicalTemplate } from '../../../../packages/shared-types';
import type { StoryResponseDto, TopicDto } from '../types/api';

// Mọi hàm ở đây throw ApiError khi BE lỗi/từ chối/trả sai hình dạng.
// Không được trả dữ liệu mẫu, truyện cục bộ hoặc "thành công" giả (ADR-008).
export const storyService = {
  /**
   * Lấy danh sách truyện của phụ huynh: GET /stories
   * BE (ApiResponse.paginated) đặt mảng truyện ở `data`, phân trang ở top-level.
   * Danh sách rỗng là kết quả hợp lệ.
   */
  getStories: async (params: { status?: string; page?: number; limit?: number } = {}): Promise<Story[]> => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const data = await apiFetch<any>(`/stories?${query.toString()}`);
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : null;
    if (!list) throw invalidResponseError('danh sách truyện');
    return list.map(storyService.formatStory);
  },

  /**
   * Lấy chi tiết truyện: GET /stories/:id → data { story }
   */
  getStory: async (id: string): Promise<Story> => {
    const data = await apiFetch<Partial<StoryResponseDto>>(`/stories/${id}`);
    if (!data?.story?.id) throw invalidResponseError('chi tiết truyện');
    return storyService.formatStory(data.story);
  },

  /**
   * Tạo truyện mới (Draft): POST /stories
   * LƯU Ý: payload này CHƯA đúng contract BE (entry/length…) – sẽ làm lại ở T5.1.
   * Hiện không có luồng UI nào gọi hàm này.
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
    const data = await apiFetch<Partial<StoryResponseDto>>('/stories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!data?.story?.id) throw invalidResponseError('tạo truyện');
    return storyService.formatStory(data.story);
  },

  /**
   * Thêm truyện vào kệ sách của bé: POST /bookshelf
   */
  addToShelf: async (childId: string, storyId: string): Promise<boolean> => {
    await apiFetch('/bookshelf', {
      method: 'POST',
      body: JSON.stringify({ childId, storyId }),
    });
    return true;
  },

  /**
   * Gỡ truyện khỏi kệ sách của bé: DELETE /bookshelf/:storyId?childId=...
   */
  removeFromShelf: async (childId: string, storyId: string): Promise<boolean> => {
    await apiFetch(`/bookshelf/${storyId}?childId=${childId}`, {
      method: 'DELETE',
    });
    return true;
  },

  /**
   * Lấy danh sách mẫu sư phạm / chủ đề: GET /topics → data là mảng (BE listTopics)
   * Danh sách rỗng là kết quả hợp lệ.
   */
  getTemplates: async (): Promise<PedagogicalTemplate[]> => {
    const data = await apiFetch<TopicDto[]>('/topics');
    if (!Array.isArray(data)) throw invalidResponseError('danh sách chủ đề');
    return data.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.skill?.nameVi || 'EMOTIONAL_INTELLIGENCE',
      targetAgeGroup: `${t.ageMin || 3}-${t.ageMax || 6}`,
      description: t.guidance || 'Rèn luyện kỹ năng cảm xúc và hành vi cho bé.',
      icon: '✨',
    }));
  },

  formatStory: (raw: any): Story => {
    return {
      id: raw.id,
      creatorId: raw.creatorId || raw.authorId || '',
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
