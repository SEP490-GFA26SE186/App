// apps/mobile/src/services/kidService.ts
// Mọi hàm dùng kidSessionToken (kidFetch), KHÔNG dùng token Parent. Lỗi → throw ApiError (401 = phiên Kid mất).
import { kidFetch, invalidResponseError } from './apiClient';
import type { KidDataSource } from '../types/viewModels';
import type { KidAnswerResultDto, KidMeDto, KidPlayDto, KidShelfItemDto } from '../types/api';

export const kidService: Required<KidDataSource> = {
  /** Bé của phiên Kid hiện tại: GET /kid/me → data { child } (BE lấy childId từ token kid_session) */
  getMe: async (): Promise<KidMeDto> => {
    const data = await kidFetch<Partial<KidMeDto>>('/kid/me');
    if (!data?.child?.id) throw invalidResponseError('hồ sơ bé');
    return { child: data.child };
  },

  /** Nạp lại một lượt đọc của chính bé: GET /kid/sessions/:id → { session, story } (lượt của bé khác → 404) */
  getSession: async (sessionId: string): Promise<KidPlayDto> => {
    const data = await kidFetch<Partial<KidPlayDto>>(`/kid/sessions/${sessionId}`);
    if (!data?.session?.id || !data.story?.id || !Array.isArray(data.story.pages) || !Array.isArray(data.story.checkpoints)) {
      throw invalidResponseError('lượt đọc');
    }
    return data as KidPlayDto;
  },

  /**
   * Tủ sách của bé: GET /kid/bookshelf → data { items[] } (chỉ truyện đã sẵn sàng, không có trang).
   * Danh sách rỗng là hợp lệ.
   */
  getShelf: async (): Promise<KidShelfItemDto[]> => {
    const data = await kidFetch<{ items?: KidShelfItemDto[] }>('/kid/bookshelf');
    if (!Array.isArray(data?.items)) throw invalidResponseError('tủ sách của bé');
    return data.items;
  },

  /**
   * Bắt đầu/tiếp tục đọc: POST /kid/sessions { storyId } → 201 { session, story }.
   * 404 = không có trên tủ sách; 422 `errors[{path:'storyId'}]` = truyện chưa sẵn sàng.
   */
  startReading: async (storyId: string): Promise<KidPlayDto> => {
    const data = await kidFetch<Partial<KidPlayDto>>('/kid/sessions', {
      method: 'POST',
      body: JSON.stringify({ storyId }),
    });
    if (!data?.session?.id || !data.story?.id || !Array.isArray(data.story.pages) || !Array.isArray(data.story.checkpoints)) {
      throw invalidResponseError('bắt đầu đọc truyện');
    }
    return data as KidPlayDto;
  },

  /** Lưu trang đang đọc: PUT /kid/sessions/:id/progress { pageId } */
  saveProgress: async (sessionId: string, pageId: string): Promise<void> => {
    await kidFetch(`/kid/sessions/${sessionId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ pageId }),
    });
  },

  /**
   * Trả lời điểm dừng: POST /kid/sessions/:id/answers (BE `.strict()`: chỉ gửi
   * checkpointId, emotion, optionId, skipped, timeToFirstMs, questionReplays) → data { result }.
   */
  answer: async (
    sessionId: string,
    body: {
      checkpointId: string;
      emotion?: string;
      optionId?: string;
      skipped?: boolean;
      timeToFirstMs?: number;
      questionReplays?: number;
    }
  ): Promise<KidAnswerResultDto> => {
    const data = await kidFetch<{ result?: KidAnswerResultDto }>(`/kid/sessions/${sessionId}/answers`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!data?.result?.checkpointId) throw invalidResponseError('trả lời điểm dừng');
    return data.result;
  },

  /** Hoàn thành lượt đọc: POST /kid/sessions/:id/complete (idempotent) */
  complete: async (sessionId: string): Promise<void> => {
    await kidFetch(`/kid/sessions/${sessionId}/complete`, { method: 'POST' });
  },

  /** Câu đọc dùng chung (tên cảm xúc, nhắc, khen…): GET /kid/ui-audio → { assets: { [key]: { text, audioUrl } } }. File BE tạo sẵn; phát ở useKidUiAudio */
  getUiAudio: async () => {
    const data = await kidFetch<{ assets?: Record<string, { text: string; audioUrl: string | null }> }>('/kid/ui-audio');
    if (!data?.assets || typeof data.assets !== 'object') throw invalidResponseError('âm thanh giao diện');
    return data.assets;
  },
};
