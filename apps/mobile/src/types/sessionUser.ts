// apps/mobile/src/types/sessionUser.ts
import { UserAccount } from '../../../../packages/shared-types';

/**
 * User của phiên hiện tại, do BE xác nhận.
 * `creditBalance` là `null` khi BE chưa trả ví (vd response /auth/login không có `wallet`):
 * UI phải hiển thị "—", không được suy diễn thành 0 hay số bất kỳ.
 * (packages/shared-types là READ-ONLY nên view model nằm ở Mobile.)
 */
export type SessionUser = Omit<UserAccount, 'creditBalance'> & {
  creditBalance: number | null;
};
