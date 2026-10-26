// apps/mobile/src/screens/kid/useKidReader.ts
// Logic tủ sách + trình đọc + điểm dừng của Kid Mode. Mọi dữ liệu đến từ `source` (kidService thật hoặc fixture Preview).
// Quy tắc: không tự chấm điểm, không bịa kết quả; BE quyết định đúng/sai/gợi ý. Lỗi 401 = phiên Kid mất.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../services/apiClient';
import type { KidAnswerResultDto, KidCheckpointDto, KidPlayDto, KidShelfItemDto } from '../../types/api';
import type { KidDataSource } from '../../types/viewModels';

export type Choice = { emotion?: string; optionId?: string };

const isLost = (e: unknown): boolean => e instanceof ApiError && e.status === 401;
const messageOf = (e: unknown, fallback: string): string => (e instanceof Error && e.message ? e.message : fallback);

export const useKidReader = (source: KidDataSource) => {
  const [shelf, setShelf] = useState<KidShelfItemDto[]>([]);
  const [shelfStatus, setShelfStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [shelfError, setShelfError] = useState<string | null>(null);

  const [play, setPlay] = useState<KidPlayDto | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [results, setResults] = useState<Record<string, KidAnswerResultDto>>({});
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  /** Phiên Kid không còn hợp lệ (401): chỉ còn cách đăng nhập lại bằng mật khẩu */
  const [lost, setLost] = useState(false);

  const alive = useRef(true);
  const shelfReq = useRef(0);
  const busy = useRef(false); // chống bấm đúp mọi thao tác ghi
  const shownAt = useRef(0); // thời điểm hiện điểm dừng (timeToFirstMs)
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const loadShelf = useCallback(async () => {
    const req = ++shelfReq.current;
    setShelfStatus('loading');
    setShelfError(null);
    try {
      const items = await source.getShelf();
      if (!alive.current || req !== shelfReq.current) return;
      setShelf(items);
      setShelfStatus('ready');
    } catch (e) {
      if (!alive.current || req !== shelfReq.current) return;
      if (isLost(e)) setLost(true);
      setShelfError(messageOf(e, 'Không tải được tủ sách.'));
      setShelfStatus('error');
    }
  }, [source]);

  useEffect(() => {
    void loadShelf();
  }, [loadShelf]);

  const checkpoints: KidCheckpointDto[] = play?.story.checkpoints ?? [];
  const pages = play?.story.pages ?? [];
  const page = pages[pageIndex];
  const isLast = pageIndex === pages.length - 1;
  const checkpointAfter = (pageId?: string) => checkpoints.find((c) => c.afterPageId === pageId);
  const resultOf = (id: string): KidAnswerResultDto | null => results[id] ?? null;
  const pendingCheckpoint = (() => {
    const c = checkpointAfter(page?.id);
    return c && !resultOf(c.id)?.done ? c : undefined;
  })();
  /** Điểm dừng đang hiển thị (sau trang hiện tại) */
  const openCheckpoint = checkpointOpen ? checkpointAfter(page?.id) : undefined;

  const persistProgress = (pageId: string) => {
    if (!play) return;
    // Lưu tiến độ là best-effort: lỗi mạng không chặn việc đọc; 401 thì phiên đã mất
    source.saveProgress(play.session.id, pageId).catch((e) => {
      if (alive.current && isLost(e)) setLost(true);
    });
  };

  const open = async (storyId: string) => {
    if (busy.current) return;
    busy.current = true;
    setStartingId(storyId);
    setActionError(null);
    try {
      const data = await source.startReading(storyId);
      if (!alive.current) return;
      const resume = data.story.pages.findIndex((p) => p.id === data.session.currentPageId);
      setResults(
        Object.fromEntries(data.story.checkpoints.filter((c) => c.result).map((c) => [c.id, c.result as KidAnswerResultDto]))
      );
      setPageIndex(resume >= 0 ? resume : 0);
      setCheckpointOpen(false);
      setFinished(false);
      setPlay(data);
    } catch (e) {
      if (!alive.current) return;
      if (isLost(e)) setLost(true);
      setActionError(messageOf(e, 'Chưa mở được truyện này.'));
    } finally {
      busy.current = false;
      if (alive.current) setStartingId(null);
    }
  };

  const closeStory = () => {
    setPlay(null);
    setFinished(false);
    setCheckpointOpen(false);
    setActionError(null);
    void loadShelf(); // tiến độ đọc mới
  };

  const complete = async () => {
    if (!play || busy.current) return;
    busy.current = true;
    setSubmitting(true);
    setActionError(null);
    try {
      await source.complete(play.session.id);
      if (alive.current) setFinished(true);
    } catch (e) {
      if (!alive.current) return;
      if (isLost(e)) setLost(true);
      setActionError(messageOf(e, 'Chưa lưu được kết quả đọc. Bé thử lại nhé.'));
    } finally {
      busy.current = false;
      if (alive.current) setSubmitting(false);
    }
  };

  /** "Trang sau": nếu trang có điểm dừng chưa xong → hiện điểm dừng; hết truyện → hoàn thành */
  const next = () => {
    if (!play || busy.current) return;
    if (pendingCheckpoint) {
      shownAt.current = Date.now();
      setActionError(null);
      setCheckpointOpen(true);
      return;
    }
    if (isLast) {
      void complete();
      return;
    }
    const nextPage = pages[pageIndex + 1];
    setPageIndex(pageIndex + 1);
    persistProgress(nextPage.id);
  };

  const prev = () => {
    if (pageIndex === 0) return;
    setCheckpointOpen(false);
    setPageIndex(pageIndex - 1);
  };

  const submit = async (body: { emotion?: string; optionId?: string; skipped?: boolean }) => {
    const cp = openCheckpoint;
    if (!play || !cp || busy.current) return;
    busy.current = true;
    setSubmitting(true);
    setActionError(null);
    try {
      const first = !results[cp.id];
      const result = await source.answer(play.session.id, {
        checkpointId: cp.id,
        ...body,
        // Chỉ đo thời gian cho lần chọn đầu (lần chọn lại sau gợi ý không tính)
        ...(first ? { timeToFirstMs: Math.max(0, Date.now() - shownAt.current) } : {}),
      });
      if (alive.current) setResults((r) => ({ ...r, [cp.id]: result }));
    } catch (e) {
      if (!alive.current) return;
      // 409 (BE: 'Lượt đọc này đã kết thúc', câu trả lời KHÔNG được lưu) cũng hiện lỗi thật, không coi là xong
      if (isLost(e)) setLost(true);
      setActionError(messageOf(e, 'Chưa gửi được câu trả lời. Bé thử lại nhé.'));
    } finally {
      busy.current = false;
      if (alive.current) setSubmitting(false);
    }
  };

  /** Sau khi điểm dừng xong: đóng và đi tiếp */
  const continueAfterCheckpoint = () => {
    setCheckpointOpen(false);
    if (isLast) {
      void complete();
      return;
    }
    const nextPage = pages[pageIndex + 1];
    setPageIndex(pageIndex + 1);
    persistProgress(nextPage.id);
  };

  return {
    shelf,
    shelfStatus,
    shelfError,
    reloadShelf: loadShelf,
    play,
    startingId,
    page,
    pageIndex,
    pageCount: pages.length,
    isLast,
    openCheckpoint,
    pendingCheckpoint,
    resultOf,
    submitting,
    actionError,
    finished,
    lost,
    open,
    closeStory,
    next,
    prev,
    submit,
    continueAfterCheckpoint,
    retryComplete: complete,
  };
};
