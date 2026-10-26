// apps/mobile/src/services/storyService.ts
import { apiFetch, invalidResponseError } from './apiClient';
import { PedagogicalTemplate } from '../../../../packages/shared-types';
import { StoryView } from '../types/viewModels';
import type {
  AiPricingDto,
  AnalyzeStoryResultDto,
  GenerationDto,
  PaginationDto,
  StoryDto,
  StoryResponseDto,
  TopicDto,
} from '../types/api';

// Mọi hàm ở đây throw ApiError khi BE lỗi/từ chối/trả sai hình dạng.
// Không được trả dữ liệu mẫu, truyện cục bộ hoặc "thành công" giả (ADR-008).

/** Payload POST /stories (BE stories.validation createStory) */
export interface CreateStoryPayload {
  entry: 'topic' | 'family' | 'handwritten';
  length: 'short' | 'medium' | 'long' | 'custom';
  title: string;
  topicId?: string;
  situation?: string;
  characters: Array<{ characterId: string; isMain: boolean }>;
  analysisToken?: string;
  scored?: boolean;
  useAiImage?: boolean;
  useTts?: boolean;
}

/** BE giới hạn limit ≤ 100; tối đa MAX_PAGES trang để không lặp vô hạn nếu BE trả sai */
const PAGE_LIMIT = 100;
const MAX_PAGES = 10;

export const storyService = {
  /**
   * Danh sách truyện của phụ huynh: GET /stories (ApiResponse.paginated: `data` = mảng, `pagination` ở top-level).
   * Đọc hết các trang. Danh sách rỗng là kết quả hợp lệ.
   */
  getStories: async (params: { status?: 'draft' | 'generating' | 'ready' } = {}): Promise<StoryView[]> => {
    const all: StoryView[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const query = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
      if (params.status) query.append('status', params.status);
      const body = await apiFetch<{ data?: StoryDto[]; pagination?: PaginationDto }>(`/stories?${query}`, { raw: true });
      if (!Array.isArray(body?.data)) throw invalidResponseError('danh sách truyện');
      all.push(...body.data.map(storyService.formatStory));
      // Không rõ tổng số trang (BE luôn trả totalPages) → dừng, không đoán
      if (typeof body.pagination?.totalPages !== 'number' || page >= body.pagination.totalPages) break;
    }
    return all;
  },

  /** Chi tiết truyện: GET /stories/:id → data { story } (có trang, điểm dừng, readiness) */
  getStory: async (id: string): Promise<StoryView> => {
    const data = await apiFetch<Partial<StoryResponseDto>>(`/stories/${id}`);
    if (!data?.story?.id) throw invalidResponseError('chi tiết truyện');
    return storyService.formatStory(data.story);
  },

  /** Tạo truyện (bản nháp): POST /stories → 201 data { story } */
  createStory: async (payload: CreateStoryPayload): Promise<StoryView> => {
    const data = await apiFetch<Partial<StoryResponseDto>>('/stories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!data?.story?.id) throw invalidResponseError('tạo truyện');
    return storyService.formatStory(data.story);
  },

  /** Phân tích lời kể (lối "Kể chuyện nhà mình"): POST /stories/analyze. 422/429/502 do BE trả, hiển thị nguyên văn. */
  analyze: async (payload: {
    situation: string;
    characters: Array<{ characterId: string; isMain: boolean }>;
    length: 'short' | 'medium' | 'long';
    subSkillIds?: string[];
  }): Promise<AnalyzeStoryResultDto> => {
    const data = await apiFetch<Partial<AnalyzeStoryResultDto>>('/stories/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!data?.analysisToken || typeof data.momentSummary !== 'string') throw invalidResponseError('phân tích lời kể');
    return data as AnalyzeStoryResultDto;
  },

  /** Bảng giá credit theo độ dài: GET /stories/ai-pricing */
  getAiPricing: async (): Promise<AiPricingDto> => {
    const data = await apiFetch<Partial<AiPricingDto>>('/stories/ai-pricing');
    if (!Array.isArray(data?.lengths)) throw invalidResponseError('bảng giá AI');
    return data as AiPricingDto;
  },

  /** Bắt đầu AI viết truyện: POST /stories/:id/generate → 202 { aiRequestId }; 402 = thiếu credit */
  startGeneration: async (storyId: string): Promise<string> => {
    const data = await apiFetch<{ aiRequestId?: string }>(`/stories/${storyId}/generate`, { method: 'POST' });
    if (!data?.aiRequestId) throw invalidResponseError('bắt đầu viết truyện');
    return data.aiRequestId;
  },

  /** Trạng thái viết truyện: GET /stories/:id/generation → data { generation | null } (null = chưa từng viết) */
  getGeneration: async (storyId: string): Promise<GenerationDto | null> => {
    const data = await apiFetch<{ generation?: GenerationDto | null }>(`/stories/${storyId}/generation`);
    if (!data || !('generation' in data)) throw invalidResponseError('trạng thái viết truyện');
    return data.generation ?? null;
  },

  /** Đánh dấu đã xem lại: POST /stories/:id/review. 422 kèm `errors[]` nếu truyện chưa đủ điều kiện */
  reviewStory: async (storyId: string): Promise<StoryView> => {
    const data = await apiFetch<Partial<StoryResponseDto>>(`/stories/${storyId}/review`, { method: 'POST' });
    if (!data?.story?.id) throw invalidResponseError('xem lại truyện');
    return storyService.formatStory(data.story);
  },

  /** Thêm truyện vào tủ sách của bé: POST /bookshelf (idempotent). 422 = truyện chưa sẵn sàng cho bé */
  addToShelf: async (childId: string, storyId: string): Promise<boolean> => {
    await apiFetch('/bookshelf', {
      method: 'POST',
      body: JSON.stringify({ childId, storyId }),
    });
    return true;
  },

  /** Gỡ truyện khỏi tủ sách của bé: DELETE /bookshelf/:storyId?childId=... */
  removeFromShelf: async (childId: string, storyId: string): Promise<boolean> => {
    await apiFetch(`/bookshelf/${storyId}?childId=${childId}`, { method: 'DELETE' });
    return true;
  },

  /**
   * Chuyện mẫu / chủ đề: GET /topics → data là mảng (BE listTopics)
   * Danh sách rỗng là kết quả hợp lệ.
   */
  getTemplates: async (): Promise<PedagogicalTemplate[]> => {
    const data = await apiFetch<TopicDto[]>('/topics');
    if (!Array.isArray(data)) throw invalidResponseError('danh sách chủ đề');
    return data.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.skill?.nameVi || '',
      targetAgeGroup: t.ageMin != null && t.ageMax != null ? `${t.ageMin}-${t.ageMax}` : '',
      description: t.guidance || '',
    }));
  },

  /** Chỉ ánh xạ trường BE trả (không ảnh/văn bản mặc định). Bản tóm tắt không có `pages` → mảng rỗng, detailLoaded=false. */
  formatStory: (raw: StoryDto): StoryView => {
    const sceneImage = new Map((raw.scenes ?? []).map((s) => [s.id, s.imageUrl ?? '']));
    return {
      id: raw.id,
      title: raw.title,
      summary: raw.momentSummary ?? undefined,
      coverImageUrl: raw.cover?.imageUrl ?? undefined,
      theme: raw.topic?.title,
      status: raw.status.toUpperCase(),
      createdAt: raw.createdAt ?? '',
      updatedAt: raw.updatedAt,
      length: raw.length,
      entry: raw.entry,
      momentSummary: raw.momentSummary,
      reviewedAt: raw.reviewedAt,
      readiness: raw.readiness,
      characters: raw.characters,
      checkpoints: raw.checkpoints,
      pageCount: raw.pageCount ?? raw.pages?.length,
      checkpointCount: raw.checkpointCount ?? raw.checkpoints?.length,
      detailLoaded: Array.isArray(raw.pages),
      pages: (raw.pages ?? []).map((p) => ({
        id: p.id,
        pageNumber: p.pageOrder,
        text: p.contentText ?? '',
        illustrationUrl: (p.sceneId && sceneImage.get(p.sceneId)) || '',
        audioNarrationUrl: p.audioUrl ?? undefined,
      })),
    };
  },
};
