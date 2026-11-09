// apps/mobile/tests/billingPayment.test.ts
// GĐ D1 – mua / gia hạn gói qua payOS, kiểm tra đơn, lịch sử thanh toán, hoàn tiền. fetch GIẢ (test.invalid), Linking GIẢ,
// AppState GIẢ — không gọi BE thật, không mở trình duyệt, không tạo giao dịch.
// Chạy: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { billingService } from '../src/services/billingService';
import {
  OPEN_CHECKOUT_FAILED,
  canRequestRefund,
  checkoutAndOpen,
  checkoutConfirm,
  extendDate,
  orderView,
  paymentRows,
  planAction,
  refundReasonError,
  watchAppReturn,
} from '../src/utils/billing';
import type { OrderDto, PaidOrderItemDto, PlanDto, SubscriptionMeDto } from '../src/types/api';

type Call = { url: string; method: string; body: any };
let calls: Call[] = [];
const respond = (body: unknown, status = 200) => {
  calls = [];
  (globalThis as any).fetch = async (url: string, init: RequestInit = {}) => {
    calls.push({ url, method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  };
};
const ok = (data: unknown, status = 200) => respond({ success: true, data }, status);
const last = () => calls[calls.length - 1];
const path = (c: Call) => c.url.replace(/^http:\/\/test\.invalid\/api\/v1/, '');

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const UUID = '11111111-2222-4333-8444-555555555555';
const free: PlanDto = { id: 'p0', code: 'FREE', name: 'Miễn phí', durationMonths: 1, priceVnd: 0, creditsPerMonth: 5, maxChildren: 1, maxCharacters: 5, canSell: false };
const family: PlanDto = { id: 'p1', code: 'FAMILY', name: 'Gia đình', durationMonths: 1, priceVnd: '99000', creditsPerMonth: 30, maxChildren: 3, maxCharacters: 20, canSell: true };
const yearly: PlanDto = { ...family, id: 'p2', code: 'FAMILY_Y', name: 'Gia đình năm', durationMonths: 12, priceVnd: 990000 };
const subOf = (plan: PlanDto, periodEnd: string | null = '2026-01-31T00:00:00.000Z'): SubscriptionMeDto => ({
  isFallback: false, plan, status: 'active', periodStart: null, periodEnd, nextCreditGrantAt: null, usage: { childrenCount: 1, charactersCount: 2 },
});
const order = (patch: Partial<OrderDto> = {}): OrderDto => ({
  id: UUID, status: 'pending', totalVnd: 99000, payosOrderCode: 123456, paidAt: null, expiresAt: null, createdAt: '2026-11-10T00:00:00.000Z', items: [], ...patch,
});
const item = (patch: Partial<PaidOrderItemDto> = {}): PaidOrderItemDto => ({
  id: 'i1', itemType: 'plan', title: 'Gia đình', unitPriceVnd: 99000, status: 'paid', refund: null, refundable: true, deadline: '2026-11-13T00:00:00.000Z', ...patch,
});

/** AppState giả: phát sự kiện 'change' bằng tay */
const fakeAppState = (initial = 'active') => {
  let listener: ((s: string) => void) | null = null;
  let removed = false;
  return {
    currentState: initial,
    addEventListener: (_: 'change', l: (s: string) => void) => {
      listener = l;
      return { remove: () => void (removed = true) };
    },
    emit: (s: string) => listener?.(s),
    get removed() {
      return removed;
    },
  };
};

const cases: [string, () => void | Promise<void>][] = [
  ['Service: đúng method / path / body cho 4 hàm thanh toán', async () => {
    ok({ order: order(), checkoutUrl: 'https://pay.payos.vn/web/abc' }, 201);
    const r = await billingService.checkoutPlan(UUID);
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/payments/plans/checkout', { planId: UUID }]);
    assert.equal(r.checkoutUrl, 'https://pay.payos.vn/web/abc');

    ok({ order: order({ status: 'paid' }) });
    assert.equal((await billingService.getOrder(UUID)).status, 'paid');
    assert.deepEqual([last().method, path(last()), last().body], ['GET', `/payments/orders/${UUID}`, undefined]);

    ok({ refundWindowDays: 3, orders: [] });
    assert.deepEqual(await billingService.getMyOrders(), { refundWindowDays: 3, orders: [] });
    assert.deepEqual([last().method, path(last())], ['GET', '/payments/orders']);

    ok({ refund: { id: 'r1', status: 'pending' } }, 201);
    await billingService.requestRefund('i1', '  Bé không dùng tới gói này  ');
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/payments/order-items/i1/refund', { reason: 'Bé không dùng tới gói này' }]);
  }],

  ['Service: dữ liệu sai dạng → lỗi 502, không đoán; lỗi BE hiện câu BE (đã dịch)', async () => {
    ok({ order: order() }); // thiếu checkoutUrl
    await assert.rejects(billingService.checkoutPlan(UUID), (e: any) => e.status === 502);
    ok({ orders: [] }); // thiếu refundWindowDays
    await assert.rejects(billingService.getMyOrders(), (e: any) => e.status === 502);
    respond({ success: false, message: 'Đã quá thời hạn yêu cầu hoàn tiền.' }, 422);
    await assert.rejects(billingService.requestRefund('i1', 'lý do đủ dài rồi'), (e: any) => e.status === 422 && e.message === 'Đã quá thời hạn yêu cầu hoàn tiền.');
  }],

  ['Nút theo gói hiện tại khớp Web: gia hạn / đang dùng / chuyển về / thanh toán + hết hạn mới', () => {
    const onFamily = subOf(family);
    const renew = planAction(family, onFamily);
    assert.deepEqual([renew.kind, renew.label, renew.disabled], ['renew', 'Gia hạn thêm 1 tháng', false]);
    assert.equal(renew.newExpiry, new Date('2026-02-28T00:00:00.000Z').toLocaleDateString('vi-VN')); // 31/01 + 1 tháng
    assert.deepEqual([planAction(free, onFamily).kind, planAction(free, onFamily).label], ['switchFree', 'Chuyển về gói này']);
    assert.deepEqual([planAction(yearly, onFamily).kind, planAction(yearly, onFamily).label], ['pay', 'Thanh toán']);
    const onFree = subOf(free, null);
    assert.deepEqual([planAction(free, onFree).label, planAction(free, onFree).disabled], ['Đang dùng', true]);
    assert.equal(planAction(yearly, subOf(yearly)).label, 'Gia hạn thêm 1 năm');
    assert.equal(extendDate('2028-01-31T00:00:00.000Z', 1).toISOString().slice(0, 10), '2028-02-29');
    assert.equal(extendDate('2026-03-15T00:00:00.000Z', 12).toISOString().slice(0, 10), '2027-03-15');
  }],

  ['Dialog xác nhận nêu tên gói, giá, ảnh hưởng; chuyển về Miễn phí từ gói trả phí là thao tác nguy hiểm', () => {
    const onFamily = subOf(family);
    const r = checkoutConfirm(family, planAction(family, onFamily), onFamily);
    assert.match(r.title, /Gia hạn gói Gia đình/);
    assert.match(r.message, /99\.000 đ \/ tháng/);
    assert.match(r.message, /Hết hạn mới: .* không mất ngày còn lại/);
    assert.match(r.message, /payOS/);
    const p = checkoutConfirm(yearly, planAction(yearly, onFamily), onFamily);
    assert.match(p.message, /990\.000 đ \/ năm/);
    assert.match(p.message, /credit còn lại được giữ/);
    const f = checkoutConfirm(free, planAction(free, onFamily), onFamily);
    assert.equal(f.destructive, true);
    assert.match(f.message, /Gia đình đang dùng kết thúc ngay/);
  }],

  ['Màn Gói: Dialog xác nhận TRƯỚC khi tạo đơn; mở bằng Linking; không dùng <Modal> mới', () => {
    const w = noComments(read('screens/parent/WalletScreen.tsx'));
    const confirmAt = w.indexOf('dialog.confirm(checkoutConfirm(');
    const checkoutAt = w.indexOf('checkoutAndOpen(');
    assert.ok(confirmAt > 0 && checkoutAt > confirmAt, 'confirm phải đứng trước checkoutAndOpen');
    assert.match(w, /if \(!\(await dialog\.confirm\(checkoutConfirm\(/);
    assert.match(w, /checkoutAndOpen\(plan\.id as string, billingService\.checkoutPlan, Linking\)/);
    assert.match(w, /run\(\s*`buy:\$\{plan\.id\}`/); // chống bấm đúp + toast lỗi đã dịch
    assert.doesNotMatch(w, /<Modal\b/);
    assert.doesNotMatch(noComments(read('components/parent/PaymentHistory.tsx')), /<Modal\b|#[0-9a-fA-F]{3,8}\b/);
    assert.doesNotMatch(w, /#[0-9a-fA-F]{6}\b/);
  }],

  ['Mở đúng checkoutUrl bằng Linking; gói 0đ không mở; không mở được → lỗi, không báo thành công', async () => {
    const opened: string[] = [];
    const linking = { openURL: async (u: string) => void opened.push(u) };
    ok({ order: order(), checkoutUrl: 'https://pay.payos.vn/web/xyz' }, 201);
    const r = await checkoutAndOpen(UUID, billingService.checkoutPlan, linking);
    assert.deepEqual(opened, ['https://pay.payos.vn/web/xyz']);
    assert.deepEqual([r.opened, r.order.id], [true, UUID]);

    ok({ order: order({ status: 'paid', totalVnd: 0 }), checkoutUrl: null }, 201);
    const f = await checkoutAndOpen(UUID, billingService.checkoutPlan, linking);
    assert.equal(f.opened, false);
    assert.equal(opened.length, 1);

    ok({ order: order(), checkoutUrl: 'https://pay.payos.vn/web/fail' }, 201);
    await assert.rejects(checkoutAndOpen(UUID, billingService.checkoutPlan, { openURL: async () => { throw new Error('No app'); } }), { message: OPEN_CHECKOUT_FAILED });
    ok({ order: order(), checkoutUrl: 'javascript:alert(1)' }, 201);
    await assert.rejects(checkoutAndOpen(UUID, billingService.checkoutPlan, linking), { message: OPEN_CHECKOUT_FAILED });
    assert.equal(opened.length, 1);
  }],

  ['Quay lại app (nền → active) thì kiểm tra đơn ĐÚNG một lần; không hẹn giờ / polling', async () => {
    const app = fakeAppState('active');
    let checks = 0;
    const stop = watchAppReturn(app, () => void checks++);
    app.emit('active'); // không đổi trạng thái → không kiểm tra
    assert.equal(checks, 0);
    app.emit('background');
    app.emit('active');
    assert.equal(checks, 1);
    app.emit('inactive');
    app.emit('active');
    assert.equal(checks, 2);
    stop();
    assert.equal(app.removed, true);

    // Màn: kiểm tra đơn bằng GET /payments/orders/:id qua watchAppReturn(AppState, ...) và nút "Kiểm tra thanh toán"; không setInterval
    const w = noComments(read('screens/parent/WalletScreen.tsx'));
    assert.match(w, /watchAppReturn\(AppState, \(\) => void checkRef\.current\(\)\)/);
    assert.match(w, /billingService\.getOrder\(p\.orderId\)/);
    assert.match(w, /Kiểm tra thanh toán/);
    assert.match(w, /order\.status !== 'pending'[\s\S]{0,80}refreshAll\(\)/); // xong thì tải lại gói + credit
    assert.doesNotMatch(w + read('utils/billing.ts'), /setInterval|setTimeout/);
  }],

  ['Kết quả đơn khớp Web: paid / pending / cancelled / expired / failed', () => {
    assert.deepEqual([orderView('paid').title, orderView('paid').final], ['Thanh toán thành công', true]);
    assert.deepEqual([orderView('pending').title, orderView('pending').final], ['Đang chờ xác nhận thanh toán', false]);
    assert.equal(orderView('cancelled').title, 'Đã huỷ thanh toán');
    assert.equal(orderView('expired').title, 'Đơn đã hết hạn');
    assert.equal(orderView('failed').title, 'Đơn đã hết hạn');
  }],

  ['Hoàn tiền: ẩn khi quá hạn / đã gửi / BE không cho; lý do 10–2000 ký tự; gửi qua Dialog', () => {
    const now = new Date('2026-11-12T00:00:00.000Z').getTime();
    assert.equal(canRequestRefund(item(), now), true);
    assert.equal(canRequestRefund(item({ deadline: '2026-11-11T00:00:00.000Z' }), now), false); // quá hạn theo giờ máy
    assert.equal(canRequestRefund(item({ refundable: false, reason: 'expired' }), now), false);
    assert.equal(canRequestRefund(item({ refund: { id: 'r', status: 'pending', reason: 'x', decisionNote: null, bankTransactionRef: null, createdAt: '', handledAt: null } }), now), false);
    assert.ok(refundReasonError('ngắn'));
    assert.equal(refundReasonError('  Bé không dùng tới gói  '), null);
    assert.ok(refundReasonError('a'.repeat(2001)));
    const rows = paymentRows([{ id: 'o1', totalVnd: 1, paidAt: '2026-11-10T00:00:00.000Z', payosOrderCode: 9, items: [item(), item({ id: 'i2' })] }]);
    assert.deepEqual(rows.map((r) => r.item.id), ['i1', 'i2']);

    const h = noComments(read('components/parent/PaymentHistory.tsx'));
    assert.match(h, /canRequestRefund\(item\) &&/);
    assert.match(h, /minLength=\{REFUND_REASON_MIN\}/);
    assert.match(h, /maxLength=\{REFUND_REASON_MAX\}/);
    const confirmAt = h.indexOf('dialog.confirm(refundConfirm(');
    assert.ok(confirmAt > 0 && h.indexOf('billingService.requestRefund(') > confirmAt, 'confirm phải đứng trước requestRefund');
    assert.match(h, /run\(\s*`refund:\$\{target\.item\.id\}`/);
  }],
];

(async () => {
  let failed = 0;
  for (const [name, run] of cases) {
    try {
      await run();
      console.log(`PASS  ${name}`);
    } catch (e) {
      failed += 1;
      console.error(`FAIL  ${name}\n      ${(e as Error).message}`);
    }
  }
  console.log(`\n${cases.length - failed}/${cases.length} PASS`);
  process.exit(failed ? 1 : 0);
})();
