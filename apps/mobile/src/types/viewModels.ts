// apps/mobile/src/types/viewModels.ts
// View model cho UI = kiểu dùng chung + trường BE trả mà UI cần (packages/shared-types là READ-ONLY).
import { FamilyCharacter, Story } from '../../../../packages/shared-types';
import type { StoryCharacterRefDto, StoryCheckpointDto, StoryLengthDto } from './api';

export type CharacterView = FamilyCharacter & {
  /** Trạng thái chân dung AI từ BE (none | queued | ... ) – hiển thị nhãn, không suy diễn */
  portraitStatus?: string | null;
  /** Có giá trị = nhân vật đại diện của một bé (không xóa được, đổi tên ở hồ sơ bé) */
  childId?: string | null;
};

/** Truyện của phụ huynh = Story dùng chung + trường BE trả mà màn hình cần. `pages`/`checkpoints` chỉ đầy đủ khi lấy chi tiết. */
export type StoryView = Story & {
  length?: StoryLengthDto;
  entry?: string;
  momentSummary?: string | null;
  reviewedAt?: string | null;
  /** Chỉ có ở chi tiết: truyện đã đủ điều kiện lên tủ sách bé chưa */
  readiness?: { ready: boolean; reason?: string | null };
  characters?: StoryCharacterRefDto[];
  checkpoints?: StoryCheckpointDto[];
  pageCount?: number;
  checkpointCount?: number;
  /** true khi `pages` đã nạp từ GET /stories/:id (danh sách tóm tắt không có trang) */
  detailLoaded?: boolean;
};

/**
 * Nguồn dữ liệu của KidModeScreen. Kid Mode thật: `kidService` (BE). UI Preview (dev): fixture, không gọi API.
 * Đặt ở đây (không ở services) để `src/dev` không phải import service (grep G11).
 */
export interface KidDataSource {
  getShelf: () => Promise<import('./api').KidShelfItemDto[]>;
  startReading: (storyId: string) => Promise<import('./api').KidPlayDto>;
  saveProgress: (sessionId: string, pageId: string) => Promise<void>;
  answer: (
    sessionId: string,
    body: {
      checkpointId: string;
      emotion?: string;
      optionId?: string;
      skipped?: boolean;
      timeToFirstMs?: number;
      questionReplays?: number;
    }
  ) => Promise<import('./api').KidAnswerResultDto>;
  complete: (sessionId: string) => Promise<void>;
}
