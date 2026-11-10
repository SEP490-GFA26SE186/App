// apps/mobile/src/utils/market.ts
// GĐ D2 – logic thuần cho Chợ truyện (không React Native, test được bằng Node). Bộ lọc / chữ chép từ Web
// (MarketplacePage.jsx, ListingDetailPage.jsx, PurchaseResultPage.jsx, ListingReviews.jsx, ReportListingButton.jsx);
// luật kiểm tra khớp BE (market.validation.js, reviews.routes.js, monitoring.routes.js reportRouter).
import { REPORT_CATEGORIES } from '../constants/management';
import { CASEL, CASEL_ORDER } from '../constants/eq';
import type { OrderStatus } from '../types/api';
import type { ListingCardDto, ListingCompetency, ListingDetailDto, ListingNarration, ListingQuery, ListingSort, ReportBody, ReviewBody, ReviewTag } from '../types/market';

export const MARKET_PAGE_SIZE = 8; // Web PAGE_SIZE

// Khoảng giá → priceMin / priceMax (VND, gồm cả hai đầu)
export type PriceRange = 'all' | 'free' | 'under20' | '20to50' | 'over50';
export const PRICE_RANGES: Record<PriceRange, { label: string; priceMin?: number; priceMax?: number }> = {
  all: { label: 'Tất cả' },
  free: { label: 'Miễn phí', priceMin: 0, priceMax: 0 },
  under20: { label: 'Dưới 20.000đ', priceMin: 1, priceMax: 19999 },
  '20to50': { label: '20.000–50.000đ', priceMin: 20000, priceMax: 50000 },
  over50: { label: 'Trên 50.000đ', priceMin: 50001 },
};
export const PRICE_OPTIONS = (Object.keys(PRICE_RANGES) as PriceRange[]).map((value) => ({ value, label: PRICE_RANGES[value].label }));

export const AGE_OPTIONS = [{ value: 'all', label: 'Mọi độ tuổi' }, ...[5, 6, 7, 8].map((a) => ({ value: String(a), label: `${a} tuổi` }))];
export const NARRATION_OPTIONS: { value: ListingNarration; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'with', label: 'Có giọng đọc' },
  { value: 'without', label: 'Chỉ có chữ' },
];
export const SORT_OPTIONS: { value: ListingSort; label: string }[] = [
  { value: 'best_selling', label: 'Bán chạy' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp' },
];
export const COMPETENCY_OPTIONS: { value: ListingCompetency; label: string }[] = [
  { value: 'all', label: 'Tất cả năng lực' },
  ...CASEL_ORDER.map((c) => ({ value: c as ListingCompetency, label: CASEL[c].label })),
];

export interface MarketFilters {
  search: string;
  competency: ListingCompetency;
  age: string;
  price: PriceRange;
  narration: ListingNarration;
  sort: ListingSort;
}
export const DEFAULT_MARKET_FILTERS: MarketFilters = { search: '', competency: 'all', age: 'all', price: 'all', narration: 'all', sort: 'best_selling' };

/** Bộ lọc màn → query GET /market/listings (giống Web: chỉ gửi priceMin / priceMax của khoảng đã chọn) */
export const listingQuery = (f: MarketFilters, page: number): ListingQuery => {
  const range = PRICE_RANGES[f.price];
  return {
    search: f.search.trim().slice(0, 200) || undefined,
    competency: f.competency,
    age: f.age,
    priceMin: range.priceMin,
    priceMax: range.priceMax,
    narration: f.narration,
    sort: f.sort,
    page,
    limit: MARKET_PAGE_SIZE,
  };
};

/** Web formatListingPrice */
export const listingPrice = (priceVnd: number): string => (Number(priceVnd) ? `${Number(priceVnd).toLocaleString('vi-VN')}đ` : 'Miễn phí');

export const ratingLabel = (avg: number | null | undefined, count?: number): string =>
  avg == null || (count !== undefined && count === 0) ? 'Chưa có đánh giá' : `${Number(avg).toFixed(1)} / 5${count ? ` (${count})` : ''}`;

/** Nút chính ở chi tiết theo trạng thái sở hữu (Web ListingDetailPage) */
export type ListingActionKind = 'mine' | 'owned' | 'claim' | 'buy';
export const listingAction = (l: Pick<ListingDetailDto, 'isMine' | 'owned' | 'priceVnd'>): { kind: ListingActionKind; label: string } => {
  if (l.isMine) return { kind: 'mine', label: 'Đây là truyện ba mẹ đăng bán.' };
  if (l.owned) return { kind: 'owned', label: 'Đọc trong Chế độ Bé' };
  if (!Number(l.priceVnd)) return { kind: 'claim', label: 'Nhận miễn phí' };
  return { kind: 'buy', label: `Mua ${listingPrice(l.priceVnd)}` };
};

const PAYOS_NOTE = 'Ứng dụng sẽ mở trang thanh toán payOS. Thanh toán xong, ba mẹ quay lại ứng dụng để kiểm tra kết quả.';

/** Dialog trước khi mua / nhận (tên, giá) */
export const buyConfirm = (l: Pick<ListingCardDto, 'title' | 'priceVnd' | 'seller'>) =>
  Number(l.priceVnd)
    ? {
        title: `Mua truyện “${l.title}”?`,
        message: `${listingPrice(l.priceVnd)} • người bán ${l.seller.displayName}. Mua xong, truyện thuộc về ba mẹ để đưa lên tủ sách của bé.\n\n${PAYOS_NOTE}`,
        confirmLabel: 'Thanh toán',
      }
    : {
        title: `Nhận truyện “${l.title}”?`,
        message: `Truyện miễn phí • người bán ${l.seller.displayName}. Truyện vào mục "Đã mua" ngay để ba mẹ đưa lên tủ sách của bé.`,
        confirmLabel: 'Nhận miễn phí',
      };

/** Kết quả đơn mua truyện (Web PurchaseResultPage) */
export const purchaseView = (status: OrderStatus): { title: string; text: string; tone: 'success' | 'info' | 'danger'; final: boolean } => {
  if (status === 'paid') return { title: 'Mua truyện thành công', text: 'Truyện đã thuộc về ba mẹ. Đưa lên tủ sách để bé đọc nhé.', tone: 'success', final: true };
  if (status === 'pending')
    return { title: 'Đang chờ xác nhận thanh toán', text: 'Nếu ba mẹ đã chuyển khoản, hệ thống sẽ xác nhận trong ít phút. Bấm "Kiểm tra thanh toán" để xem lại.', tone: 'info', final: false };
  return { title: status === 'cancelled' ? 'Đã huỷ thanh toán' : 'Đơn đã hết hạn', text: 'Ba mẹ có thể mua lại bất cứ lúc nào.', tone: 'danger', final: true };
};

// ---- Đánh giá ----

export const REVIEW_TAG_LABELS: Record<ReviewTag, string> = {
  child_liked: 'Bé rất thích',
  age_appropriate: 'Hợp độ tuổi',
  clear_lesson: 'Bài học rõ ràng',
  good_narration: 'Giọng đọc hay',
};
export const REVIEW_COMMENT_MAX = 1000;

export interface ReviewForm {
  rating: number;
  comment: string;
  tags: ReviewTag[];
}

export const reviewFormError = (f: ReviewForm): string | null => {
  if (!Number.isInteger(f.rating) || f.rating < 1 || f.rating > 5) return 'Ba mẹ chọn số sao nhé';
  if (f.comment.trim().length > REVIEW_COMMENT_MAX) return `Nhận xét tối đa ${REVIEW_COMMENT_MAX} ký tự`;
  return null;
};

/** Body PUT review: nhận xét rỗng → bỏ; thẻ bỏ trùng, chỉ giữ thẻ BE cho chọn */
export const reviewBody = (f: ReviewForm, allowed: ReviewTag[]): ReviewBody => ({
  rating: f.rating,
  ...(f.comment.trim() ? { comment: f.comment.trim() } : {}),
  tags: [...new Set(f.tags)].filter((t) => allowed.includes(t)),
});

export const reviewConfirm = (title: string, f: ReviewForm, editing: boolean) => ({
  title: editing ? 'Lưu đánh giá?' : 'Gửi đánh giá?',
  message: `“${title}” • ${f.rating} sao${f.tags.length ? ` • ${f.tags.map((t) => REVIEW_TAG_LABELS[t]).join(', ')}` : ''}. Đánh giá hiện công khai với tên “Ba mẹ …”.`,
  confirmLabel: editing ? 'Lưu đánh giá' : 'Gửi đánh giá',
});

/** Gợi ý khi chưa đánh giá được (Web ListingReviews) */
export const reviewHint = (r: { canReview: boolean; isSeller: boolean; myReview: { hidden: boolean } | null }, owned: boolean): string | null => {
  if (r.myReview?.hidden) return 'Đánh giá của ba mẹ đã bị ẩn do vi phạm quy định cộng đồng.';
  if (!r.canReview && !r.isSeller && owned) return 'Khi bé đọc hết truyện, ba mẹ có thể đánh giá để giúp các gia đình khác chọn truyện.';
  return null;
};

/** Thanh phân bố sao: tỉ lệ 0..1 theo tổng */
export const distributionRows = (d: Record<string, number>) => {
  const total = [1, 2, 3, 4, 5].reduce((n, s) => n + (d[String(s)] ?? 0), 0);
  return [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: d[String(s)] ?? 0, ratio: total ? (d[String(s)] ?? 0) / total : 0 }));
};

// ---- Báo cáo ----

export const REPORT_DESCRIPTION_MAX = 2000;
export const REPORT_OPTIONS = Object.entries(REPORT_CATEGORIES).map(([value, label]) => ({ value, label }));

export const reportError = (category: string, description: string): string | null => {
  if (!(category in REPORT_CATEGORIES)) return 'Ba mẹ chọn loại vấn đề giúp nhé';
  if (description.trim().length > REPORT_DESCRIPTION_MAX) return `Mô tả tối đa ${REPORT_DESCRIPTION_MAX} ký tự`;
  return null;
};

export const reportBody = (category: string, description: string): ReportBody => ({ category, ...(description.trim() ? { description: description.trim() } : {}) });

/** Web ReportListingButton: 409 = đã báo cáo trước đó → coi như đã gửi (không báo lỗi đỏ) */
export const reportOutcome = async (send: Promise<unknown>): Promise<'sent' | 'duplicate'> => {
  try {
    await send;
    return 'sent';
  } catch (e: any) {
    if (e?.status === 409) return 'duplicate';
    throw e;
  }
};

export const reportConfirm = (target: 'listing' | 'review', category: string) => ({
  title: target === 'listing' ? 'Gửi báo cáo truyện?' : 'Gửi báo cáo đánh giá?',
  message: `Loại: ${REPORT_CATEGORIES[category] ?? category}. Kiểm duyệt viên sẽ xem xét; thông tin của ba mẹ không được gửi cho người bán. Mỗi ${target === 'listing' ? 'truyện' : 'đánh giá'} chỉ báo cáo được một lần.`,
  confirmLabel: 'Gửi báo cáo',
  destructive: true,
});
