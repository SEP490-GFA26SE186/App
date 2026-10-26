// apps/mobile/src/navigation/routes.ts
// Khóa màn hình Parent (điều hướng bằng state, ADR-015). Giá trị trùng id tab hiện có để giữ nguyên hành vi.
// Đổi sang router khác sau này chỉ cần sửa lớp navigation/, màn hình dùng ROUTES.* thay vì chuỗi.
export const ROUTES = {
  HOME: 'HOME',
  MARKET: 'MARKET',
  CREATE: 'CREATE',
  EQ: 'EQ',
  WALLET: 'WALLET',
} as const;

export type RouteKey = (typeof ROUTES)[keyof typeof ROUTES];
