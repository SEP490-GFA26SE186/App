// apps/mobile/src/utils/format.ts — định dạng số tiền/ngày giờ cho màn quản trị (khớp Web utils/format.js).

/** 1234567 → "1.234.567 đ". Không có số (null/không hợp lệ) → "—", không đoán thành 0. */
export const money = (n: number | null | undefined): string =>
  typeof n === 'number' && Number.isFinite(n) ? `${Math.round(n).toLocaleString('vi-VN')} đ` : '—';

export const formatNumber = (n: number | null | undefined): string =>
  typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('vi-VN') : '—';

/** Giá truyện trên Chợ: 0 → "Miễn phí" */
export const listingPrice = (priceVnd: number | null | undefined): string =>
  Number(priceVnd) ? `${formatNumber(Number(priceVnd))}đ` : 'Miễn phí';

export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export const formatDate = (iso: string | null | undefined): string => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—');

/** "vừa gửi" / "3 giờ trước" / "2 ngày trước" (Web SpecialistDashboardPage) */
export const since = (iso: string | null | undefined, now: number = Date.now()): string => {
  if (!iso) return '';
  const h = Math.floor((now - new Date(iso).getTime()) / 3_600_000);
  return h < 1 ? 'vừa gửi' : h < 24 ? `${h} giờ trước` : `${Math.floor(h / 24)} ngày trước`;
};

/** Chữ dạng token {NV1} → tên chung người bán đặt (bản đăng bán không chứa tên thật) */
export const withNames = (text: string | null | undefined, characters: { token: string; name: string }[]): string =>
  (text ?? '').replace(/\{NV\d+\}/g, (t) => characters.find((c) => c.token === t)?.name ?? t);
