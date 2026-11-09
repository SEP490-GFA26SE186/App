// apps/mobile/src/utils/characterPortrait.ts
// GĐ B3 – logic thuần cho chân dung nhân vật AI (không React Native, test được bằng Node).
// Nguồn: Web components/parent/{CharacterPortrait,AppearanceHints}.jsx, hooks/useStudio.js (polling 4 s);
// BE stories.images.service.js#startPortrait, characters/lib/portraitFailure.js.

const DRAWING = new Set(['queued', 'generating']);

export interface PortraitCharacter {
  appearance?: string | null;
  imageUrl?: string | null;
  portraitStatus?: string | null;
  portraitFailure?: string | null;
}

export const isPortraitDrawing = (c?: { portraitStatus?: string | null } | null): boolean => DRAWING.has(c?.portraitStatus ?? '');

export const countDrawingPortraits = (list: ({ portraitStatus?: string | null } | null | undefined)[]): number => list.filter(isPortraitDrawing).length;

/** Lý do chân dung lỗi theo `portraitFailure` của BE; null nếu không lỗi (Web CharacterPortrait) */
export const portraitFailureText = (c: { portraitStatus?: string | null; portraitFailure?: string | null }): string | null => {
  if (c.portraitStatus !== 'failed') return null;
  return c.portraitFailure === 'blocked'
    ? 'Bộ lọc ảnh không nhận mô tả này (credit đã hoàn). Ba mẹ sửa mô tả, bỏ tên nhân vật hoạt hình, vũ khí, trang phục hở.'
    : 'Chưa vẽ được do lỗi tạm thời, credit đã hoàn lại.';
};

export interface PortraitAction {
  /** false = đang vẽ: không hiện nút, chỉ hiện trạng thái */
  visible: boolean;
  label: string;
  disabled: boolean;
  /** Vì sao nút bị khoá (hiện ngay dưới nút) */
  reason: string | null;
}

/**
 * Nút vẽ chân dung: "Vẽ chân dung AI" (chưa có ảnh) / "Vẽ lại" (đã có ảnh hoặc lỗi), kèm chi phí.
 * Khoá khi chưa có mô tả (BE 422), chưa biết giá (không xác nhận được số credit sẽ trừ), không đủ credit (BE 402).
 */
export const portraitAction = (c: PortraitCharacter, cost: number | null | undefined, creditBalance: number | null): PortraitAction => {
  if (isPortraitDrawing(c)) return { visible: false, label: '', disabled: true, reason: null };
  const base = c.imageUrl || c.portraitStatus === 'failed' ? 'Vẽ lại' : 'Vẽ chân dung AI';
  const label = cost != null && cost > 0 ? `${base} · ${cost} credit` : base;
  if (!c.appearance?.trim()) return { visible: true, label, disabled: true, reason: 'Thêm mô tả ngoại hình trước khi vẽ chân dung.' };
  if (cost == null) return { visible: true, label, disabled: true, reason: 'Chưa tải được giá credit, ba mẹ thử lại sau nhé.' };
  if (creditBalance != null && creditBalance < cost) {
    return { visible: true, label, disabled: true, reason: `Không đủ credit: cần ${cost}, ba mẹ còn ${creditBalance}.` };
  }
  return { visible: true, label, disabled: false, reason: null };
};

/** Câu xác nhận trước khi vẽ (tốn credit thật) */
export const portraitConfirmMessage = (name: string, cost: number): string =>
  `AI sẽ vẽ chân dung của ${name} và trừ ${cost} credit. Nếu vẽ lỗi, credit được hoàn lại.`;

/** Lỗi BE khi bấm vẽ: 402 đổi sang câu rõ (BE chỉ trả "Không đủ credit"); còn lại giữ câu BE đã dịch */
export const portraitErrorMessage = (e: { status?: number; message?: string } | null | undefined): string =>
  e?.status === 402 ? 'Ba mẹ không đủ credit để vẽ chân dung' : e?.message || 'Chưa vẽ được chân dung, ba mẹ thử lại sau nhé.';

// ---- Hỏi lại BE khi có chân dung đang vẽ (Web useCharacters refetchInterval 4 s) ----

export type PollStop = 'done' | 'limit' | 'error' | 'cancelled';

/**
 * Hỏi lại `load` mỗi `intervalMs` khi còn chân dung đang vẽ. Dừng khi hết ('done'), quá `maxPolls` ('limit'),
 * `maxFailures` lỗi liên tiếp ('error') hoặc `stop()` (rời màn). Số đang vẽ giảm (xong / lỗi – BE hoàn credit) → `onDrawn()`.
 */
export const createPortraitPoller = <T>(opts: {
  load: () => Promise<T>;
  drawingCount: (data: T) => number;
  onData: (data: T) => void;
  onDrawn: () => void;
  onStop?: (reason: PollStop) => void;
  intervalMs?: number;
  maxPolls?: number;
  maxFailures?: number;
  schedule?: (fn: () => void, ms: number) => unknown;
  cancel?: (handle: unknown) => void;
}) => {
  const intervalMs = opts.intervalMs ?? 4000;
  const maxPolls = opts.maxPolls ?? 150; // 150 × 4 s = 10 phút (một chân dung ~30 giây)
  const maxFailures = opts.maxFailures ?? 4;
  const schedule = opts.schedule ?? ((fn, ms) => setTimeout(fn, ms));
  const cancel = opts.cancel ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  let handle: unknown;
  let stopped = false;
  let polls = 0;
  let failures = 0;
  let drawing = 0;

  const finish = (reason: PollStop) => {
    if (stopped) return;
    stopped = true;
    if (handle !== undefined) cancel(handle);
    handle = undefined;
    opts.onStop?.(reason);
  };

  const tick = async () => {
    handle = undefined;
    if (stopped) return;
    polls += 1;
    try {
      const data = await opts.load();
      if (stopped) return;
      failures = 0;
      const now = opts.drawingCount(data);
      if (now < drawing) opts.onDrawn();
      drawing = now;
      opts.onData(data);
      if (now === 0) return finish('done');
    } catch {
      if (stopped) return;
      failures += 1;
      if (failures >= maxFailures) return finish('error');
    }
    if (polls >= maxPolls) return finish('limit');
    handle = schedule(() => void tick(), intervalMs);
  };

  return {
    start: (initialDrawing: number) => {
      if (stopped || handle !== undefined) return;
      drawing = initialDrawing;
      if (initialDrawing === 0) return finish('done');
      handle = schedule(() => void tick(), intervalMs);
    },
    stop: () => finish('cancelled'),
  };
};

// ---- Gợi ý mô tả ngoại hình (Web AppearanceHints, commit a6aeb5b): chỉ nhắc, không chặn lưu ----

export const APPEARANCE_TIP =
  'Tả những gì nhìn thấy: tóc, màu da, dáng người, trang phục, phụ kiện. Ví dụ: “tóc đen xoăn ngắn, dáng cao mảnh khảnh, mặc áo choàng đỏ và bộ đồ xanh có ngôi sao”. Không cần ghi tên thật.';

const RISKS = [
  {
    terms: ['siêu nhân', 'siêu anh hùng', 'người nhện', 'spider', 'spiderman', 'batman', 'superman', 'ultraman', 'elsa', 'anna', 'doraemon', 'nobita', 'pikachu', 'pokemon', 'mickey', 'naruto', 'sonic', 'mario', 'barbie', 'hello kitty', 'công chúa disney'],
    tip: 'Nhân vật hoạt hình / siêu anh hùng có bản quyền dễ bị chặn — tả trang phục thay vì gọi tên, ví dụ “áo choàng đỏ, bộ đồ xanh có ngôi sao”.',
  },
  {
    terms: ['súng', 'kiếm', 'dao', 'gươm', 'bom', 'máu', 'đánh nhau', 'chiến đấu'],
    tip: 'Vũ khí, máu, đánh nhau thường bị chặn — bỏ khỏi mô tả ngoại hình.',
  },
  {
    terms: ['cởi trần', 'đồ bơi', 'áo tắm', 'bikini', 'đồ lót', 'khỏa thân', 'hở'],
    tip: 'Trang phục hở dễ bị chặn với ảnh trẻ em — chọn trang phục kín như áo thun, váy, đồ ngủ.',
  },
  {
    terms: ['ốm', 'gầy', 'gầy gò', 'béo', 'mập'],
    tip: 'Nên tả dáng người nhẹ nhàng như “dáng cao, mảnh khảnh”, “tròn trịa” — “ốm” AI có thể hiểu là bị bệnh.',
  },
];

// Ranh giới từ = không phải chữ Latin / tiếng Việt. Web dùng \p{L}; ở đây liệt kê dải chữ để không phụ thuộc Hermes hỗ trợ Unicode property escape.
const LETTER = 'a-z0-9\\u00C0-\\u024F\\u1E00-\\u1EFF';
const hasTerm = (text: string, term: string) => new RegExp(`(^|[^${LETTER}])${term}($|[^${LETTER}])`, 'i').test(text);

/** Các lời nhắc ứng với chi tiết dễ bị bộ lọc ảnh chặn trong mô tả */
export const appearanceRisks = (text: string | null | undefined): string[] => {
  const t = (text ?? '').normalize('NFC').toLowerCase();
  return t.trim() ? RISKS.filter((r) => r.terms.some((term) => hasTerm(t, term))).map((r) => r.tip) : [];
};
