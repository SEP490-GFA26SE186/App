// apps/mobile/src/services/kidService.ts
import { kidFetch } from './apiClient';
import { storyService } from './storyService';
import { DEMO_STORIES } from './demoData';
import { Story } from '../../../../packages/shared-types';

export const kidService = {
  /**
   * Kệ sách Chế độ Trẻ Em (yêu cầu kidSessionToken): GET /kid/bookshelf
   */
  getKidShelf: async (): Promise<Story[]> => {
    try {
      const data = await kidFetch<{ items: any[] }>('/kid/bookshelf');
      const items = data?.items || (Array.isArray(data) ? data : []);
      if (items.length > 0) {
        return items.map((item) => storyService.formatStory(item.story || item));
      }
      return DEMO_STORIES;
    } catch (error) {
      return DEMO_STORIES;
    }
  },

  /**
   * Bắt đầu phiên đọc truyện của bé: POST /kid/sessions { storyId }
   */
  startReading: async (storyId: string): Promise<{ session: any; story: Story }> => {
    try {
      const data = await kidFetch<{ session: any; story: any }>('/kid/sessions', {
        method: 'POST',
        body: JSON.stringify({ storyId }),
      });
      return {
        session: data?.session,
        story: storyService.formatStory(data?.story || data),
      };
    } catch (error) {
      const found = DEMO_STORIES.find((s) => s.id === storyId) || DEMO_STORIES[0];
      return {
        session: { id: `sess_${Date.now()}` },
        story: found,
      };
    }
  },

  /**
   * Lưu tiến độ đọc trang: PUT /kid/sessions/:sessionId/progress { pageId }
   */
  saveProgress: async (sessionId: string, pageId: string): Promise<boolean> => {
    try {
      await kidFetch(`/kid/sessions/${sessionId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ pageId }),
      });
      return true;
    } catch (error) {
      return true;
    }
  },

  /**
   * Trả lời điểm dừng câu hỏi EQ: POST /kid/sessions/:sessionId/answers
   */
  answerCheckpoint: async (sessionId: string, body: { checkpointId: string; optionId?: string; emotionChoice?: string }): Promise<any> => {
    try {
      const data = await kidFetch(`/kid/sessions/${sessionId}/answers`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return data?.result || data;
    } catch (error) {
      return {
        checkpointId: body.checkpointId,
        correct: true,
        done: true,
      };
    }
  },

  /**
   * Hoàn thành lượt đọc truyện: POST /kid/sessions/:sessionId/complete
   */
  completeReading: async (sessionId: string): Promise<boolean> => {
    try {
      await kidFetch(`/kid/sessions/${sessionId}/complete`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      return true;
    }
  },
};
