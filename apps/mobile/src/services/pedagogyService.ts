// apps/mobile/src/services/pedagogyService.ts
// GĐ E2a – Chuyên gia: chuyện mẫu (/topics), kỹ năng con (/sub-skills), mẫu câu hỏi (/question-templates).
// BE trả `data` là mảng / đối tượng trực tiếp (không bọc). Danh mục năng lực CASEL dùng eqSkillService.getSkills().
import { apiFetch, invalidResponseError } from './apiClient';
import type {
  AnswerFormat,
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
};
