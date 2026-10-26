// apps/mobile/src/navigation/useParentNavigation.ts
// Điều hướng Parent bằng ngăn xếp state: chuyển tab thì làm mới ngăn xếp, mở màn hình con thì đẩy thêm.
// Nút Back của Android quay lại màn trước; ở màn gốc thì để hệ thống xử lý (thoát app) như trước.
import { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { NavState, ROUTES, RouteKey, RouteParams, TAB_ROUTES } from './routes';

export const useParentNavigation = () => {
  const [stack, setStack] = useState<NavState[]>([{ route: ROUTES.HOME }]);

  const navigate = useCallback((route: RouteKey, params?: RouteParams) => {
    setStack((prev) => (TAB_ROUTES.includes(route) ? [{ route, params }] : [...prev, { route, params }]));
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const canGoBack = stack.length > 1;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [canGoBack, goBack]);

  const current = stack[stack.length - 1];
  // Tab gốc đang được tô sáng trên thanh tab (phần tử đầu ngăn xếp luôn là tab)
  const rootTab = stack[0].route;

  return { current, rootTab, navigate, goBack, canGoBack };
};

export type ParentNavigation = ReturnType<typeof useParentNavigation>;
