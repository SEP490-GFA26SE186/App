// apps/mobile/src/services/eqSkillService.ts
// Phase 2 – danh mục năng lực CASEL (chỉ đọc). Không điểm số; dữ liệu đúng như BE trả.
import { apiFetch, invalidResponseError } from './apiClient';
import type { EqSkillDetailDto, EqSkillDto, SubSkillDto } from '../types/api';

export const eqSkillService = {
  /** 5 năng lực: GET /eq-skills → data { skills } (công khai) */
  getSkills: async (): Promise<EqSkillDto[]> => {
    const data = await apiFetch<{ skills?: EqSkillDto[] }>('/eq-skills');
    if (!Array.isArray(data?.skills)) throw invalidResponseError('danh sách năng lực');
    return data.skills;
  },

  /** Chi tiết + bài học đang dùng: GET /eq-skills/:idOrCode → data { skill } (BE nhận uuid hoặc mã CASEL) */
  getSkill: async (idOrCode: string): Promise<EqSkillDetailDto> => {
    const data = await apiFetch<{ skill?: EqSkillDetailDto }>(`/eq-skills/${encodeURIComponent(idOrCode)}`);
    if (!data?.skill?.id || !Array.isArray(data.skill.topics)) throw invalidResponseError('chi tiết năng lực');
    return data.skill;
  },

  /** Kỹ năng con đang dùng của một năng lực: GET /sub-skills?skillId (cần đăng nhập) → data là mảng */
  getSubSkills: async (skillId: string): Promise<SubSkillDto[]> => {
    const data = await apiFetch<SubSkillDto[]>(`/sub-skills?skillId=${encodeURIComponent(skillId)}`);
    if (!Array.isArray(data)) throw invalidResponseError('kỹ năng con');
    return data;
  },
};
