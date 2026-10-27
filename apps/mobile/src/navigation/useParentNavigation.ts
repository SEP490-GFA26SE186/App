// apps/mobile/src/navigation/useParentNavigation.ts
// Điều hướng Parent bằng ngăn xếp state: chuyển tab thì làm mới ngăn xếp, mở màn hình con thì đẩy thêm.
// Nút Back của Android quay lại màn trước; ở tab khác Trang chủ thì về Trang chủ; ở Trang chủ thì để hệ thống thoát app.
import { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { NavState, ROUTES, RouteKey, RouteParams, activeTabFor, backStack, navigateStack } from './routes';

export const useParentNavigation = () => {
  const [stack, setStack] = useState<NavState[]>([{ route: ROUTES.HOME }]);

  const navigate = useCallback((route: RouteKey, params?: RouteParams) => {
    setStack((prev) => navigateStack(prev, route, params));
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => backStack(prev) ?? prev);
  }, []);

  const canGoBack = stack.length > 1;
  // Back của Android: màn con → màn trước; tab khác Trang chủ → Trang chủ; ở Trang chủ thì để hệ thống thoát app
  const handlesBack = backStack(stack) !== null;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!handlesBack) return false;
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [handlesBack, goBack]);

  const current = stack[stack.length - 1];
  // Tab đang được tô sáng trên thanh tab (phần tử đầu ngăn xếp luôn là tab; Ví tô sáng Hồ sơ)
  const rootTab = activeTabFor(stack);

  return { current, rootTab, navigate, goBack, canGoBack };
};

export type ParentNavigation = ReturnType<typeof useParentNavigation>;
