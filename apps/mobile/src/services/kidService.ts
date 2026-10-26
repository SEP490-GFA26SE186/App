// apps/mobile/src/services/kidService.ts
import { kidFetch, invalidResponseError } from './apiClient';
import { storyService } from './storyService';
import { Story } from '../../../../packages/shared-types';

export const kidService = {
  /**
   * Kệ sách Chế độ Trẻ Em (yêu cầu kidSessionToken): GET /kid/bookshelf
   * Danh sách rỗng là hợp lệ. Contract còn lệch (xem API_MAPPING §4) → sửa ở T6.1.
   */
  getKidShelf: async (): Promise<Story[]> => {
    const data = await kidFetch<{ items?: any[] }>('/kid/bookshelf');
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? (data as any[]) : null;
    if (!items) throw invalidResponseError('kệ sách của bé');
    return items.map((item) => storyService.formatStory(item.story || item));
  },

  /**
   * Bắt đầu phiên đọc truyện của bé: POST /kid/sessions { storyId }
   */
  startReading: async (storyId: string): Promise<{ session: any; story: Story }> => {
    const data = await kidFetch<{ session?: any; story?: any }>('/kid/sessions', {
      method: 'POST',
      body: JSON.stringify({ storyId }),
    });
    if (!data?.session?.id || !data?.story) throw invalidResponseError('bắt đầu đọc truyện');
    return {
      session: data.session,
      story: storyService.formatStory(data.story),
    };
  },

  /**
   * Lưu tiến độ đọc trang: PUT /kid/sessions/:sessionId/progress { pageId }
   */
  saveProgress: async (sessionId: string, pageId: string): Promise<boolean> => {
    await kidFetch(`/kid/sessions/${sessionId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ pageId }),
    });
    return true;
  },

  /**
   * Trả lời điểm dừng câu hỏi EQ: POST /kid/sessions/:sessionId/answers
   * (payload còn lệch contract BE – sửa ở T6.2)
   */
  answerCheckpoint: async (sessionId: string, body: { checkpointId: string; optionId?: string; emotionChoice?: string }): Promise<any> => {
    const data = await kidFetch(`/kid/sessions/${sessionId}/answers`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return data?.result || data;
  },

  /**
   * Hoàn thành lượt đọc truyện: POST /kid/sessions/:sessionId/complete
   */
  completeReading: async (sessionId: string): Promise<boolean> => {
    await kidFetch(`/kid/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
    return true;
  },
};
