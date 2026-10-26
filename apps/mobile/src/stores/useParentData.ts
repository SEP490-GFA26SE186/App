// apps/mobile/src/stores/useParentData.ts
// Dữ liệu Parent của phiên hiện tại (do BE trả). Rỗng = chưa có/không có dữ liệu; lỗi = dataStatus 'error'.
// KHÔNG bao giờ thay bằng dữ liệu mẫu khi API lỗi (ADR-008, ADR-016).
import { MutableRefObject, useCallback, useState } from 'react';
import { ChildProfile, FamilyCharacter, PedagogicalTemplate, Story } from '../../../../packages/shared-types';
import { SessionUser } from '../types/sessionUser';
import { authService, childService, characterService, storyService } from '../services';

export type DataStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface LoadResult {
  /** stale: phiên đã đổi trong lúc chờ (bỏ qua); expired: BE từ chối phiên (401/403); done: đã áp dụng kết quả */
  outcome: 'stale' | 'expired' | 'done';
  /** user mới từ GET /auth/me (có ví) nếu lấy được */
  user?: SessionUser;
}

export const useParentDataState = (sessionRef: MutableRefObject<number>) => {
  const [childrenProfiles, setChildrenProfiles] = useState<ChildProfile[]>([]);
  const [characters, setCharacters] = useState<FamilyCharacter[]>([]);
  const [templates, setTemplates] = useState<PedagogicalTemplate[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus>('idle');
  const [dataError, setDataError] = useState<string | null>(null);

  // Xóa dữ liệu của phiên trước (tránh lộ dữ liệu tài khoản A sang tài khoản B)
  const reset = useCallback(() => {
    setChildrenProfiles([]);
    setCharacters([]);
    setTemplates([]);
    setStories([]);
    setDataStatus('idle');
    setDataError(null);
  }, []);

  const loadAll = useCallback(
    async (sid: number = sessionRef.current): Promise<LoadResult> => {
      setDataStatus('loading');
      setDataError(null);
      const results = await Promise.allSettled([
        authService.getMe(),
        childService.getChildren(),
        characterService.getCharacters(),
        storyService.getStories(),
        storyService.getTemplates(),
      ]);
      // Phiên đã đổi (đăng xuất/đổi tài khoản) trong lúc chờ: bỏ kết quả cũ
      if (sid !== sessionRef.current) return { outcome: 'stale' };

      if (results.some((r) => r.status === 'rejected' && authService.isAuthError(r.reason))) {
        return { outcome: 'expired' };
      }

      const [meR, childrenR, charactersR, storiesR, templatesR] = results;
      // Thành công (kể cả danh sách rỗng) → dùng đúng dữ liệu BE; thất bại → KHÔNG thay bằng dữ liệu mẫu
      if (childrenR.status === 'fulfilled') setChildrenProfiles(childrenR.value);
      if (charactersR.status === 'fulfilled') setCharacters(charactersR.value);
      if (storiesR.status === 'fulfilled') setStories(storiesR.value);
      if (templatesR.status === 'fulfilled') setTemplates(templatesR.value);

      const failed = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
      if (failed) {
        setDataStatus('error');
        setDataError(failed.reason?.message || 'Không tải được dữ liệu từ máy chủ.');
      } else {
        setDataStatus('ready');
      }
      return { outcome: 'done', user: meR.status === 'fulfilled' ? meR.value : undefined };
    },
    [sessionRef]
  );

  // Chỉ nhận hồ sơ bé đã được BE tạo (AuthModal gọi POST /children rồi báo lại đây).
  const addChild = useCallback((child: Partial<ChildProfile>) => {
    if (!child.id) return;
    const created = child as ChildProfile;
    setChildrenProfiles((prev) => (prev.some((c) => c.id === created.id) ? prev : [...prev, created]));
  }, []);

  return {
    childrenProfiles,
    characters,
    templates,
    stories,
    dataStatus,
    dataError,
    setCharacters,
    addChild,
    loadAll,
    reset,
  };
};
