// apps/mobile/src/utils/useReduceMotion.ts
// Cài đặt "Giảm chuyển động" của hệ thống (Android "Xóa hiệu ứng động", iOS Reduce Motion, Web prefers-reduced-motion).
// Dùng cho animation viết bằng Animated của RN; animation Reanimated đã tự tôn trọng cài đặt này (ReduceMotion.System).
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useReduceMotion = (): boolean => {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
};
