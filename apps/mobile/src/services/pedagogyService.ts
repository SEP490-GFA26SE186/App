// apps/mobile/src/services/pedagogyService.ts
// GĐ E2a – Chuyên gia: chuyện mẫu (/topics), kỹ năng con (/sub-skills), mẫu câu hỏi (/question-templates).
// GĐ E2b – soát câu hỏi AI (/checkpoint-review), tham số báo cáo (/pedagogy/report-settings), từ khoá chặn (/moderation/keywords).
// BE trả `data` là mảng / đối tượng trực tiếp (không bọc). Danh mục năng lực CASEL dùng eqSkillService.getSkills().
import { apiFetch, invalidResponseError } from './apiClient';
import type {
  AnswerFormat,
  BlockedKeyword,
  CheckpointReviewItem,
  CheckpointReviewStat,
  KeywordSeverity,
  ReportSettings,
  ManagedSubSkill,
  ManagedTopic,
  QuestionTemplate,
  SubSkillBody,
  TemplateContent,
  TopicBody,
  TopicDeleteResult,
} from '../types/pedagogy';

const id = (v: string) => encodeURIComponent(v);
const send = (method: 'POST' | 'PUT' | 'DELETE', body?: unknown) => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
/** Bỏ tham số rỗng / "all" (Web clean) */
export const queryOf = (q: Record<string, string | undefined>) => {
  const s = Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== '' && v !== 'all')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return s ? `?${s}` : '';
};

const list = <T>(data: unknown, what: string): T[] => {
  if (!Array.isArray(data)) throw invalidResponseError(what);
  return data as T[];
};
const one = <T extends { id?: string }>(data: T | undefined, what: string): T => {
  if (!data?.id) throw invalidResponseError(what);
  return data;
};

export const pedagogyService = {
  // ---- Chuyện mẫu ----
  /** GET /topics?skillId&search&isActive */
  getTopics: async (q: { skillId?: string; search?: string; isActive?: string } = {}): Promise<ManagedTopic[]> =>
    list<ManagedTopic>(await apiFetch(`/topics${queryOf({ ...q, search: q.search?.trim() })}`), 'chuyện mẫu'),
  /** POST /topics */
  createTopic: async (body: TopicBody): Promise<ManagedTopic> => one(await apiFetch<ManagedTopic>('/topics', send('POST', body)), 'chuyện mẫu'),
  /** PUT /topics/:id — chỉ trường đổi */
  updateTopic: async (topicId: string, body: Partial<TopicBody>): Promise<ManagedTopic> =>
    one(await apiFetch<ManagedTopic>(`/topics/${id(topicId)}`, send('PUT', body)), 'chuyện mẫu'),
  /** DELETE /topics/:id → { deleted, deactivated, message } (đã có truyện dùng → chỉ ngưng dùng) */
  deleteTopic: async (topicId: string): Promise<TopicDeleteResult> => {
    const data = await apiFetch<Partial<TopicDeleteResult>>(`/topics/${id(topicId)}`, send('DELETE'));
    if (typeof data?.deleted !== 'boolean' || !data.message) throw invalidResponseError('xoá chuyện mẫu');
    return data as TopicDeleteResult;
  },

  // ---- Kỹ năng con ----
  /** GET /sub-skills?skillId&search&isActive (Chuyên gia: kèm số đếm) */
  getSubSkills: async (q: { skillId?: string; search?: string; isActive?: string } = {}): Promise<ManagedSubSkill[]> =>
    list<ManagedSubSkill>(await apiFetch(`/sub-skills${queryOf({ ...q, search: q.search?.trim() })}`), 'kỹ năng con'),
  /** PUT /sub-skills/:id { nameVi?, descriptionVi?, ageMin?, ageMax?, isActive? } */
  updateSubSkill: async (subSkillId: string, body: SubSkillBody): Promise<ManagedSubSkill> =>
    one(await apiFetch<ManagedSubSkill>(`/sub-skills/${id(subSkillId)}`, send('PUT', body)), 'kỹ năng con'),

  // ---- Mẫu câu hỏi ----
  /** GET /question-templates?subSkillId&skillId&isActive */
  getTemplates: async (q: { subSkillId?: string; skillId?: string; isActive?: string } = {}): Promise<QuestionTemplate[]> =>
    list<QuestionTemplate>(await apiFetch(`/question-templates${queryOf(q)}`), 'mẫu câu hỏi'),
  /** POST /question-templates { subSkillId, title, answerFormat } → 201 mẫu + bản nháp v1 */
  createTemplate: async (body: { subSkillId: string; title: string; answerFormat: AnswerFormat }): Promise<QuestionTemplate> =>
    one(await apiFetch<QuestionTemplate>('/question-templates', send('POST', body)), 'mẫu câu hỏi'),
  /** PUT /question-templates/:id { title?, isActive? } */
  updateTemplate: async (templateId: string, body: { title?: string; isActive?: boolean }): Promise<QuestionTemplate> =>
    one(await apiFetch<QuestionTemplate>(`/question-templates/${id(templateId)}`, send('PUT', body)), 'mẫu câu hỏi'),
  /** PUT /question-templates/:id/draft — ghi bản nháp (chưa có thì tạo từ bản đã ban hành) */
  saveDraft: async (templateId: string, body: TemplateContent): Promise<QuestionTemplate> =>
    one(await apiFetch<QuestionTemplate>(`/question-templates/${id(templateId)}/draft`, send('PUT', body)), 'mẫu câu hỏi'),
  /** POST /question-templates/:id/publish — 422 liệt kê trường thiếu */
  publishTemplate: async (templateId: string): Promise<QuestionTemplate> =>
    one(await apiFetch<QuestionTemplate>(`/question-templates/${id(templateId)}/publish`, send('POST')), 'mẫu câu hỏi'),
  /** POST /question-templates/:id/duplicate → 201 mẫu mới (bản nháp v1) */
  duplicateTemplate: async (templateId: string): Promise<QuestionTemplate> =>
    one(await apiFetch<QuestionTemplate>(`/question-templates/${id(templateId)}/duplicate`, send('POST')), 'mẫu câu hỏi'),
  /** DELETE /question-templates/:id — 409 khi đã có điểm dừng dùng */
  deleteTemplate: async (templateId: string): Promise<{ deleted: boolean; message: string }> => {
    const data = await apiFetch<{ deleted?: boolean; message?: string }>(`/question-templates/${id(templateId)}`, send('DELETE'));
    if (!data?.deleted) throw invalidResponseError('xoá mẫu câu hỏi');
    return { deleted: true, message: data.message ?? 'Đã xoá mẫu câu hỏi.' };
  },

  // ---- Soát câu hỏi AI ----
  /** GET /checkpoint-review?status&skillId&subSkillId&templateId&cursor&limit → envelope { data: items, nextCursor } (nextCursor ngoài `data`) */
  getCheckpointQueue: async (q: { status?: string; skillId?: string; subSkillId?: string; templateId?: string; cursor?: string; limit?: number } = {}): Promise<{
    items: CheckpointReviewItem[];
    nextCursor: string | null;
  }> => {
    const body = await apiFetch<{ data?: CheckpointReviewItem[]; nextCursor?: string | null }>(
      `/checkpoint-review${queryOf({ ...q, limit: String(q.limit ?? 20) })}`,
      { raw: true }
    );
    if (!Array.isArray(body?.data)) throw invalidResponseError('hàng đợi soát câu hỏi');
    return { items: body.data, nextCursor: body.nextCursor ?? null };
  },
  /** GET /checkpoint-review/stats → [{ templateId, title, reviewed, flagged }] */
  getCheckpointReviewStats: async (): Promise<CheckpointReviewStat[]> => list<CheckpointReviewStat>(await apiFetch('/checkpoint-review/stats'), 'thống kê soát câu hỏi'),
  /** POST /checkpoint-review/:id/ok ("Ổn" cũng gỡ cờ nếu đang bị gắn) */
  markCheckpointOk: async (checkpointId: string): Promise<{ checkpointId: string; status: string }> =>
    reviewResult(await apiFetch(`/checkpoint-review/${id(checkpointId)}/ok`, send('POST'))),
  /** POST /checkpoint-review/:id/flag { reason 5–500 } — loại khỏi điểm và báo cáo EQ */
  flagCheckpoint: async (checkpointId: string, reason: string): Promise<{ checkpointId: string; status: string }> =>
    reviewResult(await apiFetch(`/checkpoint-review/${id(checkpointId)}/flag`, send('POST', { reason: reason.trim() }))),
  /** DELETE /checkpoint-review/:id/flag → quay lại hàng chờ soát */
  unflagCheckpoint: async (checkpointId: string): Promise<{ checkpointId: string; status: string }> =>
    reviewResult(await apiFetch(`/checkpoint-review/${id(checkpointId)}/flag`, send('DELETE'))),

  // ---- Tham số báo cáo EQ ----
  /** GET /pedagogy/report-settings → { window, minItems, developingFrom, secureFrom } */
  getReportSettings: async (): Promise<ReportSettings> => reportSettingsOf(await apiFetch('/pedagogy/report-settings')),
  /** PUT /pedagogy/report-settings — gửi đủ 4 trường */
  updateReportSettings: async (body: ReportSettings): Promise<ReportSettings> => reportSettingsOf(await apiFetch('/pedagogy/report-settings', send('PUT', body))),

  // ---- Từ khoá chặn ----
  /** GET /moderation/keywords?search&severity → { keywords } */
  getKeywords: async (q: { search?: string; severity?: string } = {}): Promise<BlockedKeyword[]> => {
    const data = await apiFetch<{ keywords?: BlockedKeyword[] }>(`/moderation/keywords${queryOf({ ...q, search: q.search?.trim() })}`);
    return list<BlockedKeyword>(data?.keywords, 'từ khoá chặn');
  },
  /** Một từ → POST /moderation/keywords (409 nếu đã có); nhiều từ → POST /bulk (từ đã có được cập nhật mức độ, bật lại) — như Web */
  addKeywords: async (keywords: string[], severity: KeywordSeverity): Promise<{ count: number }> => {
    if (keywords.length === 1) {
      const data = await apiFetch<{ keyword?: BlockedKeyword }>('/moderation/keywords', send('POST', { keyword: keywords[0], severity }));
      one(data?.keyword, 'từ khoá');
      return { count: 1 };
    }
    const data = await apiFetch<{ count?: number }>('/moderation/keywords/bulk', send('POST', { keywords, severity }));
    if (typeof data?.count !== 'number') throw invalidResponseError('từ khoá');
    return { count: data.count };
  },
  /** PUT /moderation/keywords/:id { severity?, isActive? } */
  updateKeyword: async (keywordId: string, body: { severity?: KeywordSeverity; isActive?: boolean }): Promise<BlockedKeyword> =>
    one((await apiFetch<{ keyword?: BlockedKeyword }>(`/moderation/keywords/${id(keywordId)}`, send('PUT', body)))?.keyword, 'từ khoá'),
  /** DELETE /moderation/keywords/:id → { deleted: true } */
  deleteKeyword: async (keywordId: string): Promise<boolean> => {
    const data = await apiFetch<{ deleted?: boolean }>(`/moderation/keywords/${id(keywordId)}`, send('DELETE'));
    if (!data?.deleted) throw invalidResponseError('xoá từ khoá');
    return true;
  },
};

const reviewResult = (data: unknown): { checkpointId: string; status: string } => {
  const d = data as { checkpointId?: string; status?: string } | undefined;
  if (!d?.checkpointId || !d.status) throw invalidResponseError('soát câu hỏi');
  return { checkpointId: d.checkpointId, status: d.status };
};

const reportSettingsOf = (data: unknown): ReportSettings => {
  const d = data as Partial<ReportSettings> | undefined;
  if (![d?.window, d?.minItems, d?.developingFrom, d?.secureFrom].every((v) => typeof v === 'number')) throw invalidResponseError('tham số báo cáo');
  return d as ReportSettings;
};
