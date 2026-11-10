// apps/mobile/src/utils/selling.ts
// GĐ D3 – logic thuần cho Bán truyện (không React Native, test được bằng Node). Luật khớp BE: publishing.validation.js,
// publishing/lib/publish.js (giá), withdrawals.routes.js (ngân hàng, rút tiền), monitoring.routes.js (kháng nghị),
// reviews.routes.js (trả lời). Chữ chép từ Web: SellingPage.jsx, NewListingPage.jsx, EarningsPanel.jsx, StrikesPanel.jsx.
import { LISTING_STATUS } from '../constants/management';
import { BANKS } from '../constants/banks';
import type { BadgeTone } from '../components/ui/Badge';
import type { NarrationDto } from '../types/api';
import type { BankBody, ListingBody, MyListingDto, MySellerDto, SellerFields, SellerProfileMeDto, WithdrawalStatus } from '../types/selling';

const money = (v: number) => `${Math.round(v).toLocaleString('vi-VN')}đ`;

// ---- Hồ sơ người bán ----

/** Khối trên cùng của màn Bán truyện (Web SellingPage) */
export type SellerView = 'need_plan' | 'apply' | 'reapply' | 'pending' | 'approved' | 'suspended';
export const sellerView = (me: MySellerDto): SellerView => {
  const status = me.seller?.status;
  if (!me.planCanSell && status !== 'approved') return 'need_plan';
  if (status === 'approved') return 'approved';
  if (status === 'suspended') return 'suspended';
  if (status === 'pending') return 'pending';
  return status === 'rejected' ? 'reapply' : 'apply';
};
/** Người bán (đã duyệt hoặc đang bị khoá) thấy truyện, doanh thu, cảnh cáo */
export const isSeller = (me: MySellerDto) => me.seller?.status === 'approved' || me.seller?.status === 'suspended';

export interface SellerForm {
  displayName: string;
  bio: string;
  expertise: string;
}
export const sellerForm = (s?: SellerProfileMeDto | null): SellerForm => ({ displayName: s?.displayName ?? '', bio: s?.bio ?? '', expertise: s?.expertise ?? '' });

export const sellerFormErrors = (f: SellerForm): Partial<Record<keyof SellerForm, string>> => {
  const e: Partial<Record<keyof SellerForm, string>> = {};
  const n = f.displayName.trim().length;
  if (n < 2) e.displayName = 'Biệt danh tối thiểu 2 ký tự';
  else if (n > 100) e.displayName = 'Biệt danh tối đa 100 ký tự';
  if (f.bio.length > 2000) e.bio = 'Giới thiệu tối đa 2000 ký tự';
  if (f.expertise.length > 1000) e.expertise = 'Kinh nghiệm tối đa 1000 ký tự';
  return e;
};

/** Nộp: bỏ trường rỗng. Sửa: gửi đủ 3 trường, chuỗi rỗng = xoá (Web ApplyForm; BE PUT .strict()) */
export const sellerBody = (f: SellerForm, editing: boolean): SellerFields =>
  editing
    ? { displayName: f.displayName.trim(), bio: f.bio.trim(), expertise: f.expertise.trim() }
    : { displayName: f.displayName.trim(), ...(f.bio.trim() ? { bio: f.bio.trim() } : {}), ...(f.expertise.trim() ? { expertise: f.expertise.trim() } : {}) };

export const sellerConfirm = (f: SellerForm, editing: boolean) =>
  editing
    ? { title: 'Lưu hồ sơ bán?', message: `Biệt danh công khai: “${f.displayName.trim()}”. Thông tin hiện trên trang người bán ở Chợ truyện.`, confirmLabel: 'Lưu hồ sơ' }
    : {
        title: 'Gửi hồ sơ người bán?',
        message: `Biệt danh công khai: “${f.displayName.trim()}”. Chuyên gia sẽ duyệt hồ sơ trước khi ba mẹ đăng bán truyện.`,
        confirmLabel: 'Gửi hồ sơ',
      };

// ---- Truyện đã đăng ----

/** Nhãn trạng thái (Web SellingPage): bản cũ đã được thay bằng phiên bản mới thì ghi rõ */
export const listingStatusLabel = (l: MyListingDto, all: MyListingDto[]): { label: string; tone: BadgeTone } => {
  const successor = all.find((x) => x.previousListingId === l.id && x.status !== 'rejected');
  if (l.status === 'archived' && successor?.status === 'published') return { label: 'Đã thay bằng phiên bản mới', tone: 'neutral' };
  return LISTING_STATUS[l.status] ?? { label: l.status, tone: 'neutral' };
};

/** Đang có phiên bản mới chờ duyệt → không cho cập nhật thêm (BE 409) */
export const versionPending = (l: MyListingDto, all: MyListingDto[]) =>
  all.some((x) => x.previousListingId === l.id && ['submitted', 'in_review', 'changes_requested'].includes(x.status));

export const canUpdateVersion = (l: MyListingDto, all: MyListingDto[]) => l.status === 'published' && !!l.sourceStoryId && !versionPending(l, all);

/** Giọng đọc bản đăng bán (Web NarrationStatus) */
export const narrationLabel = (l: Pick<MyListingDto, 'hasNarration' | 'narration'>): { text: string; tone: 'muted' | 'ok' | 'working' | 'broken'; canRetry: boolean } => {
  if (!l.hasNarration) return { text: 'Chỉ có chữ (không giọng đọc)', tone: 'muted', canRetry: false };
  const n = l.narration;
  if (!n || n.complete) return { text: 'Có giọng đọc', tone: 'ok', canRetry: false };
  const broken = n.failed > 0 || n.missing > 0;
  return broken
    ? { text: `Giọng đọc lỗi ${n.failed + n.missing}/${n.total} đoạn — chuyên gia chưa duyệt được`, tone: 'broken', canRetry: true }
    : { text: `Đang tạo giọng đọc ${n.ready}/${n.total} đoạn — xong mới vào hàng chờ duyệt`, tone: 'working', canRetry: false };
};

/** Còn bản đang tạo giọng đọc (chưa lỗi) → hỏi lại (Web refetchInterval) */
export const needsNarrationPoll = (listings: { narration: NarrationDto | null }[]) =>
  listings.some((l) => !!l.narration && !l.narration.complete && !l.narration.failed && !l.narration.missing);
export const NARRATION_POLL_MS = 10_000;
export const NARRATION_POLL_MAX = 30; // ~5 phút, không polling vô hạn

// ---- Đăng bán / phiên bản ----

export const PRICE_MIN_VND = 5000;
export const PRICE_MAX_VND = 500000;
export const PRICE_STEP_VND = 1000;

export interface ListingForm {
  storyId: string;
  title: string;
  description: string;
  free: boolean;
  price: string;
  /** token → tên chung */
  aliases: Record<string, string>;
}
export const emptyListingForm = (storyId = ''): ListingForm => ({ storyId, title: '', description: '', free: false, price: '', aliases: {} });

/** Phiên bản mới: điền sẵn từ bản đang bán (tên chung lấy theo token của bản đăng bán) */
export const versionForm = (live: MyListingDto, liveCharacters: { token: string; name: string | null }[]): ListingForm => ({
  storyId: live.sourceStoryId ?? '',
  title: live.title,
  description: live.description ?? '',
  free: live.priceVnd === 0,
  price: live.priceVnd ? String(live.priceVnd) : '',
  aliases: Object.fromEntries(liveCharacters.map((c) => [c.token, c.name ?? ''])),
});

/** Web NewListingPage priceError + BE validPriceVnd */
export const priceError = (raw: string): string | null => {
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return 'Nhập giá bằng số (đồng).';
  const v = Number(t);
  if (v < PRICE_MIN_VND || v > PRICE_MAX_VND) return 'Giá từ 5.000đ đến 500.000đ, hoặc chọn Miễn phí.';
  if (v % PRICE_STEP_VND !== 0) return 'Giá phải là bội số của 1.000đ.';
  return null;
};

/** Lỗi theo ô, khoá giống `errors[].path` của BE ("title", "priceVnd", "aliases.{NV1}") */
export const listingFormErrors = (f: ListingForm, tokens: string[]): Record<string, string> => {
  const e: Record<string, string> = {};
  if (!f.storyId) e.storyId = 'Chọn truyện đã hoàn tất để đăng bán.';
  const n = f.title.trim().length;
  if (n < 3) e.title = 'Tên truyện tối thiểu 3 ký tự';
  else if (n > 200) e.title = 'Tên truyện tối đa 200 ký tự';
  if (f.description.length > 2000) e.description = 'Mô tả tối đa 2000 ký tự';
  const p = f.free ? null : priceError(f.price);
  if (p) e.priceVnd = p;
  for (const t of tokens) {
    const a = (f.aliases[t] ?? '').trim();
    if (!a) e[`aliases.${t}`] = `Đặt tên chung cho nhân vật ${t}.`;
    else if (a.length > 100) e[`aliases.${t}`] = 'Tên tối đa 100 ký tự.';
  }
  return e;
};

export const listingBody = (f: ListingForm, tokens: string[]): ListingBody => ({
  storyId: f.storyId,
  title: f.title.trim(),
  ...(f.description.trim() ? { description: f.description.trim() } : {}),
  priceVnd: f.free ? 0 : Number(f.price.trim()),
  aliases: tokens.map((token) => ({ token, aliasName: (f.aliases[token] ?? '').trim() })),
});

/** BE trả errors[{ path: "listing.title" | "aliases.{NV1}" | ... }] → khoá ô của form */
export const fieldErrorsFromBe = (errors: { path?: string; message?: string }[] | undefined): Record<string, string> =>
  Object.fromEntries((errors ?? []).filter((x) => x.path && x.message).map((x) => [String(x.path).replace(/^(body|listing)\./, ''), String(x.message)]));

export const listingConfirm = (body: ListingBody, liveTitle?: string) => ({
  title: liveTitle ? `Gửi phiên bản mới của “${liveTitle}”?` : `Gửi “${body.title}” cho chuyên gia duyệt?`,
  message: `${body.priceVnd ? money(body.priceVnd) : 'Miễn phí'} • ${body.aliases.length} nhân vật dùng tên chung.${
    liveTitle ? ' Bản đang bán vẫn bán cho tới khi chuyên gia duyệt bản mới; duyệt xong, người đã mua tự nhận bản mới.' : ''
  } Bản đăng bán không kèm chuyện thật ở nhà và không kèm giọng đọc của gia đình.`,
  confirmLabel: 'Gửi chuyên gia duyệt',
});

// ---- Doanh thu, ngân hàng, rút tiền ----

export const WITHDRAWAL_STATUS: Record<WithdrawalStatus, { label: string; tone: BadgeTone }> = {
  requested: { label: 'Chờ chuyển khoản', tone: 'info' },
  processing: { label: 'Đang chuyển tiền', tone: 'warning' },
  paid: { label: 'Đã chuyển', tone: 'success' },
  rejected: { label: 'Bị từ chối', tone: 'danger' },
  cancelled: { label: 'Đã huỷ', tone: 'neutral' },
};

/** Che số tài khoản (chỉ 4 số cuối) — dùng ở Dialog xác nhận, không hiện đủ số ngoài ô đang nhập */
export const maskAccount = (acc: string) => {
  const t = acc.trim();
  return t.length <= 4 ? '••••' : `•••• ${t.slice(-4)}`;
};

export interface BankForm {
  bankBin: string;
  accountNumber: string;
  accountHolder: string;
}
export const bankFormErrors = (f: BankForm): Partial<Record<keyof BankForm, string>> => {
  const e: Partial<Record<keyof BankForm, string>> = {};
  if (!BANKS.some((b) => b.bin === f.bankBin)) e.bankBin = 'Chọn ngân hàng';
  if (!/^[0-9A-Za-z]{4,30}$/.test(f.accountNumber.trim())) e.accountNumber = 'Số tài khoản không hợp lệ';
  const h = f.accountHolder.trim().length;
  if (h < 2 || h > 150) e.accountHolder = 'Tên chủ tài khoản 2–150 ký tự';
  return e;
};
export const bankBody = (f: BankForm): BankBody => ({
  bankBin: f.bankBin,
  bankName: BANKS.find((b) => b.bin === f.bankBin)?.name ?? '',
  accountNumber: f.accountNumber.trim(),
  accountHolder: f.accountHolder.trim(),
});
export const bankConfirm = (b: BankBody, changing: boolean) => ({
  title: changing ? 'Đổi tài khoản nhận tiền?' : 'Lưu tài khoản nhận tiền?',
  message: `${b.bankName} • ${maskAccount(b.accountNumber)} • ${b.accountHolder.toUpperCase()}.${changing ? ' Đổi tài khoản thì 24 giờ sau mới rút được.' : ''}`,
  confirmLabel: 'Lưu tài khoản',
});

export const withdrawError = (raw: string, minVnd: number, availableVnd: number): string | null => {
  const t = raw.trim();
  if (!/^\d+$/.test(t) || Number(t) <= 0) return 'Nhập số tiền bằng số (đồng).';
  const v = Number(t);
  if (v < minVnd) return `Số tiền rút tối thiểu là ${money(minVnd)}.`;
  if (v > availableVnd) return 'Số dư có thể rút không đủ.';
  return null;
};
export const withdrawConfirm = (amountVnd: number, bank: { bankName: string; accountNumber: string }) => ({
  title: `Rút ${money(amountVnd)}?`,
  message: `Chuyển vào ${bank.bankName} • ${bank.accountNumber}. Số tiền được giữ lại cho tới khi quản trị viên chuyển khoản; ba mẹ huỷ được khi yêu cầu còn chờ.`,
  confirmLabel: 'Rút tiền',
});
export const cancelWithdrawConfirm = (amountVnd: number) => ({
  title: `Huỷ yêu cầu rút ${money(amountVnd)}?`,
  message: 'Số tiền trở lại mục "Rút được".',
  confirmLabel: 'Huỷ yêu cầu',
  destructive: true,
});

// ---- Cảnh cáo, trả lời đánh giá ----

export const APPEAL_REASON_MIN = 20;
export const APPEAL_REASON_MAX = 2000;
export const appealConfirm = { title: 'Gửi kháng nghị?', message: 'Mỗi cảnh cáo chỉ kháng nghị được một lần. Admin sẽ xem xét và trả lời.', confirmLabel: 'Gửi kháng nghị' };

export const REPLY_MIN = 2;
export const REPLY_MAX = 1000;
export const replyConfirm = (author: string) => ({
  title: `Trả lời đánh giá của ${author}?`,
  message: 'Mỗi đánh giá chỉ trả lời được một lần và hiện công khai dưới đánh giá.',
  confirmLabel: 'Gửi trả lời',
});
