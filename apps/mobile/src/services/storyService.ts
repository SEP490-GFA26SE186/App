// apps/mobile/src/services/storyService.ts
import { apiFetch, invalidResponseError } from './apiClient';
import { PedagogicalTemplate } from '../types/domain';
import { StoryView } from '../types/viewModels';
import type {
  AiPricingDto,
  AnalyzeStoryResultDto,
  BookshelfCheckDto,
  BookshelfPageDto,
  CheckpointTypeDto,
  GenerationDto,
  PaginationDto,
  ShelfItemDto,
  ShelfStatus,
  StoryDto,
  StoryResponseDto,
  TopicDto,
} from '../types/api';

// Mọi hàm ở đây throw ApiError khi BE lỗi/từ chối/trả sai hình dạng.
// Không được trả dữ liệu mẫu, truyện cục bộ hoặc "thành công" giả (ADR-008).

/** Payload POST /stories (BE stories.validation createStory) */
export interface CreateStoryPayload {
  /** Bỏ trống với truyện tự viết (length 'custom'): BE tự đặt handwritten */
  entry?: 'topic' | 'family' | 'handwritten';
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

/** Phương án điểm dừng gửi lên (BE checkpointOption) – perspective: {text,isCorrect}; problem_solving: {text,role,feedback} */
export interface CheckpointOptionInput {
  text?: string | null;
  role?: 'constructive' | 'avoidant' | 'impulsive';
  isCorrect?: boolean;
  feedback?: string | null;
}

/** Body PUT /stories/:id/checkpoints/:cpId (BE updateCheckpoint) */
export interface UpdateCheckpointBody {
  question?: string | null;
  hint?: string | null;
  answerEmotion?: 'happy' | 'sad' | 'angry' | 'scared' | 'neutral';
  options?: CheckpointOptionInput[];
}

/** Body POST /stories/:id/checkpoints (BE createCheckpoint) */
export interface CreateCheckpointBody {
  type: CheckpointTypeDto;
  afterPageId: string;
  targetToken?: string;
}

/** Lệnh editor: BE trả `data { story }` (chi tiết đầy đủ) → trả nguyên DTO cho màn Sửa truyện */
const editorCall = async (path: string, init: RequestInit, what: string): Promise<StoryDto> => {
  const data = await apiFetch<Partial<StoryResponseDto>>(path, init);
  if (!data?.story?.id) throw invalidResponseError(what);
  return data.story;
};
const json = (method: string, body?: unknown): RequestInit => ({ method, ...(body !== undefined && { body: JSON.stringify(body) }) });

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

  // ---- Sửa truyện (Web useStoryEditor). Mọi lệnh trả chi tiết truyện mới nhất (StoryDto). ----

  /** Chi tiết truyện dạng DTO cho màn Sửa truyện: GET /stories/:id → data { story } */
  getStoryDetail: (id: string): Promise<StoryDto> => editorCall(`/stories/${id}`, {}, 'chi tiết truyện'),

  /** Hoàn tất (POST /stories/:id/review) cho màn Sửa truyện. 422 kèm errors[{path,message}] */
  reviewStoryDetail: (storyId: string): Promise<StoryDto> => editorCall(`/stories/${storyId}/review`, json('POST'), 'hoàn tất truyện'),

  /** Thêm trang (chỉ truyện tự viết): POST /stories/:id/pages { contentText? } */
  createPage: (storyId: string, contentText?: string | null): Promise<StoryDto> =>
    editorCall(`/stories/${storyId}/pages`, json('POST', contentText === undefined ? {} : { contentText }), 'thêm trang'),

  /** Lưu chữ một trang: PUT /stories/:id/pages/:pageId { contentText } (chuỗi trống / null = xoá chữ) */
  updatePage: (storyId: string, pageId: string, contentText: string | null): Promise<StoryDto> =>
    editorCall(`/stories/${storyId}/pages/${pageId}`, json('PUT', { contentText }), 'lưu trang'),

  /** Xoá trang (chỉ truyện tự viết): DELETE /stories/:id/pages/:pageId. 409 nếu trang có điểm dừng sau nó */
  deletePage: (storyId: string, pageId: string): Promise<StoryDto> =>
    editorCall(`/stories/${storyId}/pages/${pageId}`, json('DELETE'), 'xoá trang'),

  /** Thêm điểm dừng (chỉ truyện tự viết): POST /stories/:id/checkpoints { type, afterPageId, targetToken? } */
  createCheckpoint: (storyId: string, body: CreateCheckpointBody): Promise<StoryDto> =>
    editorCall(`/stories/${storyId}/checkpoints`, json('POST', body), 'thêm điểm dừng'),

  /** Sửa điểm dừng: PUT /stories/:id/checkpoints/:cpId { question?, hint?, answerEmotion?, options? } */
  updateCheckpoint: (storyId: string, checkpointId: string, body: UpdateCheckpointBody): Promise<StoryDto> =>
    editorCall(`/stories/${storyId}/checkpoints/${checkpointId}`, json('PUT', body), 'lưu điểm dừng'),

  /** Xoá điểm dừng (chỉ truyện tự viết): DELETE /stories/:id/checkpoints/:cpId */
  deleteCheckpoint: (storyId: string, checkpointId: string): Promise<StoryDto> =>
    editorCall(`/stories/${storyId}/checkpoints/${checkpointId}`, json('DELETE'), 'xoá điểm dừng'),

  /** Chọn ảnh bìa: PUT /stories/:id/cover { sceneId } – cảnh đã có ảnh; null = mặc định (cảnh 1). Không vẽ tranh */
  setCover: (storyId: string, sceneId: string | null): Promise<StoryDto> =>
    editorCall(`/stories/${storyId}/cover`, json('PUT', { sceneId }), 'đổi ảnh bìa'),

  /** Xoá truyện: DELETE /stories/:id (BE xoá mềm, không trả data) */
  deleteStory: async (storyId: string): Promise<boolean> => {
    await apiFetch(`/stories/${storyId}`, { method: 'DELETE' });
    return true;
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

  /** Giá sách một bé: GET /bookshelf?childId&page&limit(≤50)&status (envelope: `data` = mảng, `child` + `pagination` ở top-level) */
  getBookshelf: async (childId: string, params: { page?: number; limit?: number; status?: ShelfStatus } = {}): Promise<BookshelfPageDto> => {
    const query = new URLSearchParams({
      childId,
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
      status: params.status ?? 'all',
    });
    const body = await apiFetch<{ data?: ShelfItemDto[]; child?: BookshelfPageDto['child']; pagination?: PaginationDto }>(`/bookshelf?${query}`, { raw: true });
    if (!Array.isArray(body?.data) || !body.pagination || !body.child?.id) throw invalidResponseError('giá sách');
    return { child: body.child, items: body.data, pagination: body.pagination };
  },

  /** Truyện đang ở giá sách của bé nào: GET /bookshelf/check/:storyId → data { storyId, children[] } (mọi bé của phụ huynh) */
  checkShelf: async (storyId: string): Promise<BookshelfCheckDto> => {
    const data = await apiFetch<Partial<BookshelfCheckDto>>(`/bookshelf/check/${storyId}`);
    if (!Array.isArray(data?.children)) throw invalidResponseError('trạng thái giá sách');
    return data as BookshelfCheckDto;
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
