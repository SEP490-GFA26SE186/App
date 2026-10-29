// apps/mobile/src/navigation/routes.ts
// Khóa màn hình Parent (điều hướng bằng state, ADR-015). Màn hình dùng ROUTES.* thay vì chuỗi.
// Đổi sang router khác sau này chỉ cần sửa lớp navigation/.
export const ROUTES = {
  // 5 tab trên thanh tab: Trang chủ · Tủ truyện · [Sáng tác] · Tiến độ · Hồ sơ (MORE)
  HOME: 'HOME',
  LIBRARY: 'LIBRARY',
  CREATE: 'CREATE',
  EQ: 'EQ',
  MORE: 'MORE',
  // Màn hình con (không nằm trên thanh tab). WALLET (R3): mở từ pill credit ở header hoặc từ Hồ sơ
  WALLET: 'WALLET',
  CHILDREN: 'CHILDREN',
  CHILD_DETAIL: 'CHILD_DETAIL',
  EQ_SKILLS: 'EQ_SKILLS',
  CHARACTERS: 'CHARACTERS',
  STORY: 'STORY',
  SETTINGS: 'SETTINGS',
  HELP: 'HELP',
  MARKET: 'MARKET', // SCOPE PENDING: giữ nguyên, không phát triển thêm
} as const;

export type RouteKey = (typeof ROUTES)[keyof typeof ROUTES];

export const TAB_ROUTES: RouteKey[] = [ROUTES.HOME, ROUTES.LIBRARY, ROUTES.CREATE, ROUTES.EQ, ROUTES.MORE];

export interface RouteParams {
  storyId?: string;
  childId?: string;
  /** LIBRARY: 'shelf' = mở thẳng chế độ "Tủ sách của bé" */
  view?: 'shelf';
}

export interface NavState {
  route: RouteKey;
  params?: RouteParams;
}

/** Chuyển màn: tab thì làm mới ngăn xếp; màn con thì đẩy thêm. Chạm lặp vào đúng màn đang mở (cùng route + tham số) bị bỏ qua. */
export const navigateStack = (stack: NavState[], route: RouteKey, params?: RouteParams): NavState[] => {
  if (TAB_ROUTES.includes(route)) return [{ route, params }];
  const top = stack[stack.length - 1];
  if (top.route === route && top.params?.storyId === params?.storyId && top.params?.childId === params?.childId) return stack;
  return [...stack, { route, params }];
};

/** Tab được tô sáng: tab gốc của ngăn xếp; Ví thuộc nhóm Hồ sơ nên khi đang xem Ví thì tô "Hồ sơ". */
export const activeTabFor = (stack: NavState[]): RouteKey =>
  stack[stack.length - 1].route === ROUTES.WALLET ? ROUTES.MORE : stack[0].route;

/** Nút Back: màn con → quay lại; tab khác Trang chủ → về Trang chủ; đang ở Trang chủ → null (để hệ thống xử lý/thoát app). */
export const backStack = (stack: NavState[]): NavState[] | null => {
  if (stack.length > 1) return stack.slice(0, -1);
  return stack[0].route === ROUTES.HOME ? null : [{ route: ROUTES.HOME }];
};
