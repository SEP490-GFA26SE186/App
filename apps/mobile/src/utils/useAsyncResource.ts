// apps/mobile/src/utils/useAsyncResource.ts
// Nạp một tài nguyên từ BE cho một màn hình: loading / ready / error + reload. Bỏ kết quả của lần nạp cũ
// (đổi bé, rời màn) để không hiện dữ liệu lệch. Đổi `deps` → xóa dữ liệu cũ (không hiện số liệu của bé khác).
import { useCallback, useEffect, useRef, useState } from 'react';

export type ResourceStatus = 'loading' | 'ready' | 'error';

export const useAsyncResource = <T,>(loader: () => Promise<T>, deps: unknown[]) => {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<ResourceStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const req = useRef(0);

  const load = useCallback(async () => {
    const id = ++req.current;
    setStatus('loading');
    setError(null);
    try {
      const value = await loader();
      if (id !== req.current) return;
      setData(value);
      setStatus('ready');
    } catch (e: any) {
      if (id !== req.current) return;
      setError(e?.message || 'Không tải được dữ liệu.');
      setStatus('error');
    }
  }, deps);

  useEffect(() => {
    setData(null);
    void load();
    return () => {
      req.current += 1;
    };
  }, [load]);

  return { data, status, error, reload: load };
};
