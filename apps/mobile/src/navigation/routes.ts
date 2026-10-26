// apps/mobile/src/navigation/routes.ts
// Khóa màn hình Parent (điều hướng bằng state, ADR-015). Màn hình dùng ROUTES.* thay vì chuỗi.
// Đổi sang router khác sau này chỉ cần sửa lớp navigation/.
export const ROUTES = {
  // 5 tab trên thanh tab
  HOME: 'HOME',
  LIBRARY: 'LIBRARY',
  CREATE: 'CREATE',
  EQ: 'EQ',
  WALLET: 'WALLET',
  // Màn hình con (không nằm trên thanh tab)
  MORE: 'MORE',
  CHILDREN: 'CHILDREN',
  CHARACTERS: 'CHARACTERS',
  STORY: 'STORY',
  SETTINGS: 'SETTINGS',
  HELP: 'HELP',
  MARKET: 'MARKET', // SCOPE PENDING: giữ nguyên, không phát triển thêm
} as const;

export type RouteKey = (typeof ROUTES)[keyof typeof ROUTES];

export const TAB_ROUTES: RouteKey[] = [ROUTES.HOME, ROUTES.LIBRARY, ROUTES.CREATE, ROUTES.EQ, ROUTES.WALLET];

export interface RouteParams {
  storyId?: string;
}

export interface NavState {
  route: RouteKey;
  params?: RouteParams;
}
