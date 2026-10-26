// apps/mobile/src/types/viewModels.ts
// View model cho UI = kiểu dùng chung + trường BE trả mà UI cần (packages/shared-types là READ-ONLY).
import { FamilyCharacter } from '../../../../packages/shared-types';

export type CharacterView = FamilyCharacter & {
  /** Trạng thái chân dung AI từ BE (none | queued | ... ) – hiển thị nhãn, không suy diễn */
  portraitStatus?: string | null;
  /** Có giá trị = nhân vật đại diện của một bé (không xóa được, đổi tên ở hồ sơ bé) */
  childId?: string | null;
};
