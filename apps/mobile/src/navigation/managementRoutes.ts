// apps/mobile/src/navigation/managementRoutes.ts
// Điều hướng Admin / Chuyên gia sư phạm bằng ngăn xếp state (ADR-015), tách khỏi ngăn xếp Parent.
// Thanh tab 4 mục cho việc dùng hằng ngày; các trang ít dùng nằm trong "Thêm" (thay sidebar của Web).
import type { IconName } from '../components/ui/Icon';
import type { Role } from '../types/domain';

export type AppShellKind = 'PARENT' | 'ADMIN' | 'SPECIALIST' | 'UNSUPPORTED';
export type ManagementRole = 'ADMIN' | 'SPECIALIST';

/** Role do BE xác nhận → khung giao diện. Role lạ không được rơi vào giao diện Phụ huynh. */
export const shellForRole = (role: Role | string | null | undefined): AppShellKind => {
  switch (role) {
    case 'PARENT':
      return 'PARENT';
    case 'ADMIN':
      return 'ADMIN';
    case 'SPECIALIST':
      return 'SPECIALIST';
    default:
      return 'UNSUPPORTED';
  }
};

export const ADMIN_ROUTES = {
  DASHBOARD: 'ADMIN_DASHBOARD',
  QUEUES: 'ADMIN_QUEUES',
  ACCOUNTS: 'ADMIN_ACCOUNTS',
  MENU: 'ADMIN_MENU',
  WITHDRAWALS: 'ADMIN_WITHDRAWALS',
  REFUNDS: 'ADMIN_REFUNDS',
  APPEALS: 'ADMIN_APPEALS',
  AUDIT_LOGS: 'ADMIN_AUDIT_LOGS',
} as const;

export const SPECIALIST_ROUTES = {
  QUEUE: 'SPEC_QUEUE',
  SELLERS: 'SPEC_SELLERS',
  REPORTS: 'SPEC_REPORTS',
  MENU: 'SPEC_MENU',
  REVIEW: 'SPEC_REVIEW',
} as const;

export type ManagementRoute =
  | (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES]
  | (typeof SPECIALIST_ROUTES)[keyof typeof SPECIALIST_ROUTES];

export interface ManagementTab {
  route: ManagementRoute;
  label: string;
  icon: IconName;
  iconActive: IconName;
}

export const MANAGEMENT_TABS: Record<ManagementRole, ManagementTab[]> = {
  ADMIN: [
    { route: ADMIN_ROUTES.DASHBOARD, label: 'Tổng quan', icon: 'grid-outline', iconActive: 'grid' },
    { route: ADMIN_ROUTES.QUEUES, label: 'Việc chờ', icon: 'file-tray-full-outline', iconActive: 'file-tray-full' },
    { route: ADMIN_ROUTES.ACCOUNTS, label: 'Tài khoản', icon: 'people-outline', iconActive: 'people' },
    { route: ADMIN_ROUTES.MENU, label: 'Thêm', icon: 'menu-outline', iconActive: 'menu' },
  ],
  SPECIALIST: [
    { route: SPECIALIST_ROUTES.QUEUE, label: 'Hàng chờ', icon: 'book-outline', iconActive: 'book' },
    { route: SPECIALIST_ROUTES.SELLERS, label: 'Người bán', icon: 'id-card-outline', iconActive: 'id-card' },
    { route: SPECIALIST_ROUTES.REPORTS, label: 'Báo cáo', icon: 'flag-outline', iconActive: 'flag' },
    { route: SPECIALIST_ROUTES.MENU, label: 'Thêm', icon: 'menu-outline', iconActive: 'menu' },
  ],
};

export interface ManagementParams {
  reviewId?: string;
}

export interface ManagementNavState {
  route: ManagementRoute;
  params?: ManagementParams;
}

export const homeRouteFor = (role: ManagementRole): ManagementRoute => MANAGEMENT_TABS[role][0].route;

const isTab = (role: ManagementRole, route: ManagementRoute) => MANAGEMENT_TABS[role].some((t) => t.route === route);

/** Tab → làm mới ngăn xếp; màn con → đẩy thêm; chạm lặp đúng màn đang mở (cùng tham số) bị bỏ qua. */
export const navigateManagement = (
  role: ManagementRole,
  stack: ManagementNavState[],
  route: ManagementRoute,
  params?: ManagementParams
): ManagementNavState[] => {
  if (isTab(role, route)) return [{ route, params }];
  const top = stack[stack.length - 1];
  if (top.route === route && top.params?.reviewId === params?.reviewId) return stack;
  return [...stack, { route, params }];
};

/** Back: màn con → quay lại; tab khác tab đầu → về tab đầu; đang ở tab đầu → null (để hệ thống thoát app). */
export const backManagement = (role: ManagementRole, stack: ManagementNavState[]): ManagementNavState[] | null => {
  if (stack.length > 1) return stack.slice(0, -1);
  const home = homeRouteFor(role);
  return stack[0].route === home ? null : [{ route: home }];
};
