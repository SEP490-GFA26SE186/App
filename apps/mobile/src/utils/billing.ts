// apps/mobile/src/utils/billing.ts
// GĐ D1 – logic thuần cho mua / gia hạn gói qua payOS và hoàn tiền (không React Native, test được bằng Node).
// Luật khớp BE: billing.store.js fulfillOrder (gia hạn cộng thời hạn, gói khác bắt đầu kỳ mới), refunds.service.js
// (lý do 10–2000 ký tự, trong hạn). Chữ chép từ Web: BillingPage.jsx, BillingResultPage.jsx, PaymentHistory.jsx.
import type { OrderDto, OrderStatus, PaidOrderDto, PaidOrderItemDto, PlanDto, SubscriptionMeDto } from '../types/api';
import { formatDate, money } from './format';

export const REFUND_REASON_MIN = 10;
export const REFUND_REASON_MAX = 2000;

/** Đoạn giải thích thanh toán (Web BillingPage) */
export const PAYMENT_NOTE =
  'Thanh toán bằng chuyển khoản ngân hàng hoặc quét mã VietQR. Gói trả trước, gia hạn thủ công: gia hạn gói đang dùng thì cộng thêm thời hạn vào ngày hết hạn hiện tại. Đổi sang gói khác giữa kỳ: kỳ mới bắt đầu ngay, credit còn lại được giữ.';

const price = (p: PlanDto): number => Number(p.priceVnd);
const months = (p: PlanDto): number => (p.durationMonths === 12 ? 12 : 1);
const periodLabel = (p: PlanDto) => (months(p) === 12 ? 'năm' : 'tháng');

/** Giống BE addMonths / Web extendDate: cộng tháng theo lịch, giữ ngày (31/01 + 1 tháng → 28/02 hoặc 29/02) */
export const extendDate = (iso: string, add: number): Date => {
  const d = new Date(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + add);
  d.setUTCDate(Math.min(day, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()));
  return d;
};

export type PlanActionKind = 'renew' | 'current' | 'switchFree' | 'pay';
export interface PlanAction {
  kind: PlanActionKind;
  label: string;
  disabled: boolean;
  /** Chỉ khi gia hạn: ngày hết hạn mới */
  newExpiry?: string;
}

/** Nút của từng gói theo gói hiện tại (Web BillingPage) */
export const planAction = (plan: PlanDto, sub: SubscriptionMeDto): PlanAction => {
  const current = plan.code === sub.plan.code;
  if (current && price(plan) > 0) {
    return {
      kind: 'renew',
      label: `Gia hạn thêm ${months(plan) === 12 ? '1 năm' : '1 tháng'}`,
      disabled: false,
      newExpiry: sub.periodEnd ? formatDate(extendDate(sub.periodEnd, months(plan)).toISOString()) : undefined,
    };
  }
  if (current) return { kind: 'current', label: 'Đang dùng', disabled: true };
  if (price(plan) === 0) return { kind: 'switchFree', label: 'Chuyển về gói này', disabled: false };
  return { kind: 'pay', label: 'Thanh toán', disabled: false };
};

const PAYOS_NOTE = 'Ứng dụng sẽ mở trang thanh toán payOS. Thanh toán xong, ba mẹ quay lại ứng dụng để kiểm tra kết quả.';

/** Nội dung Dialog trước khi tạo đơn: tên gói, giá, ảnh hưởng tới gói đang dùng */
export const checkoutConfirm = (plan: PlanDto, action: PlanAction, sub: SubscriptionMeDto) => {
  const cost = `${money(price(plan))} / ${periodLabel(plan)}`;
  if (action.kind === 'renew') {
    return {
      title: `Gia hạn gói ${plan.name}?`,
      message: `${cost}.${action.newExpiry ? ` Hết hạn mới: ${action.newExpiry} — không mất ngày còn lại.` : ''}\n\n${PAYOS_NOTE}`,
      confirmLabel: 'Thanh toán',
      destructive: false,
    };
  }
  if (action.kind === 'switchFree') {
    const losesPaid = Number(sub.plan.priceVnd) > 0;
    return {
      title: `Chuyển về gói ${plan.name}?`,
      message: `Gói 0đ, không cần thanh toán. Kỳ mới bắt đầu ngay, credit còn lại được giữ.${losesPaid ? ` Gói ${sub.plan.name} đang dùng kết thúc ngay, không hoàn lại ngày còn lại.` : ''}`,
      confirmLabel: 'Chuyển gói',
      destructive: losesPaid,
    };
  }
  return {
    title: `Thanh toán gói ${plan.name}?`,
    message: `${cost} • ${plan.creditsPerMonth} credit mỗi tháng. Kỳ mới bắt đầu ngay khi thanh toán xong, credit còn lại được giữ.${sub.plan.code !== plan.code ? ` Gói ${sub.plan.name} đang dùng sẽ được thay thế.` : ''}\n\n${PAYOS_NOTE}`,
    confirmLabel: 'Thanh toán',
    destructive: false,
  };
};

/** Phần Linking của react-native mà luồng thanh toán cần (tiêm vào để test) */
export interface LinkingLike {
  openURL: (url: string) => Promise<unknown>;
}

export const OPEN_CHECKOUT_FAILED = 'Không mở được trang thanh toán. Ba mẹ thử lại sau nhé.';

/**
 * Tạo đơn rồi mở trang payOS. Gói 0đ (checkoutUrl null): BE đã đổi gói, không mở gì.
 * Không mở được liên kết → ném lỗi, không coi là thành công.
 */
export const checkoutAndOpen = async (
  planId: string,
  checkout: (planId: string) => Promise<{ order: OrderDto; checkoutUrl: string | null }>,
  linking: LinkingLike
): Promise<{ order: OrderDto; opened: boolean }> => {
  const { order, checkoutUrl } = await checkout(planId);
  if (checkoutUrl === null) return { order, opened: false };
  if (!/^https:\/\//i.test(checkoutUrl)) throw new Error(OPEN_CHECKOUT_FAILED);
  try {
    await linking.openURL(checkoutUrl);
  } catch {
    throw new Error(OPEN_CHECKOUT_FAILED);
  }
  return { order, opened: true };
};

/** Phần AppState của react-native mà màn cần (tiêm vào để test) */
export interface AppStateLike {
  currentState: string;
  addEventListener: (type: 'change', listener: (state: string) => void) => { remove: () => void };
}

/**
 * Gọi `onReturn` MỘT lần mỗi khi app từ nền quay lại `active` (ba mẹ trở về sau trang payOS / Web).
 * Không hẹn giờ, không polling. Trả hàm huỷ đăng ký.
 */
export const watchAppReturn = (appState: AppStateLike, onReturn: () => void): (() => void) => {
  let prev = appState.currentState;
  const sub = appState.addEventListener('change', (next) => {
    if (/inactive|background/.test(prev) && next === 'active') onReturn();
    prev = next;
  });
  return () => sub.remove();
};

/** Kết quả đơn (Web BillingResultPage); expired / failed hiện như "Đơn đã hết hạn" giống Web */
export type OrderViewTone = 'success' | 'info' | 'danger';
export const orderView = (status: OrderStatus): { title: string; text: string; tone: OrderViewTone; final: boolean } => {
  if (status === 'paid') return { title: 'Thanh toán thành công', text: 'Gói mới đã được kích hoạt và credit đã được cộng vào ví.', tone: 'success', final: true };
  if (status === 'pending')
    return {
      title: 'Đang chờ xác nhận thanh toán',
      text: 'Nếu ba mẹ đã chuyển khoản, hệ thống sẽ xác nhận trong ít phút. Bấm "Kiểm tra thanh toán" để xem lại.',
      tone: 'info',
      final: false,
    };
  if (status === 'cancelled') return { title: 'Đã huỷ thanh toán', text: 'Gói hiện tại không thay đổi. Ba mẹ có thể thử lại bất cứ lúc nào.', tone: 'danger', final: true };
  return { title: 'Đơn đã hết hạn', text: 'Gói hiện tại không thay đổi. Ba mẹ có thể thử lại bất cứ lúc nào.', tone: 'danger', final: true };
};

// ---- Lịch sử thanh toán + hoàn tiền ----

export const REFUND_STATUS: Record<string, { label: string; tone: 'info' | 'success' | 'danger' }> = {
  pending: { label: 'Đang chờ hoàn tiền', tone: 'info' },
  approved: { label: 'Đã hoàn tiền', tone: 'success' },
  rejected: { label: 'Không được hoàn', tone: 'danger' },
};

export const itemTitle = (i: PaidOrderItemDto): string => (i.itemType === 'plan' ? `Gói ${i.title ?? ''}` : `Truyện “${i.title ?? ''}”`).trim();

/** Hiện nút hoàn tiền: BE cho phép VÀ còn trong hạn theo giờ máy (dữ liệu tải lâu rồi có thể đã quá hạn) */
export const canRequestRefund = (i: PaidOrderItemDto, now: number = Date.now()): boolean =>
  i.refundable && !i.refund && (!i.deadline || now <= new Date(i.deadline).getTime());

/** Mỗi mục đã trả là một dòng (Web PaymentHistory flatMap) */
export const paymentRows = (orders: PaidOrderDto[]) => orders.flatMap((o) => o.items.map((item) => ({ order: o, item })));

export const refundReasonError = (reason: string): string | null => {
  const n = reason.trim().length;
  if (n < REFUND_REASON_MIN) return `Ba mẹ ghi lý do ít nhất ${REFUND_REASON_MIN} ký tự nhé`;
  if (n > REFUND_REASON_MAX) return `Lý do tối đa ${REFUND_REASON_MAX} ký tự`;
  return null;
};

export const refundConfirm = (order: PaidOrderDto, item: PaidOrderItemDto) => ({
  title: 'Gửi yêu cầu hoàn tiền?',
  message: `${itemTitle(item)} • ${money(item.unitPriceVnd)} • mã ${order.payosOrderCode ?? '—'}.\n\nQuản trị viên xem xét và chuyển trả vào tài khoản đã thanh toán. Khi được hoàn, ${
    item.itemType === 'plan' ? 'gói này bị huỷ' : 'quyền đọc truyện bị thu hồi'
  }.`,
  confirmLabel: 'Gửi yêu cầu',
  destructive: true,
});
