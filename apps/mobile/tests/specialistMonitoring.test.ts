// apps/mobile/tests/specialistMonitoring.test.ts
// GĐ E1 – Chuyên gia: giám sát. Đúng method/path/query/body cho 6 hàm (+ cảnh cáo mở rộng nguồn), tổng quan ghép đúng số như Web,
// Dialog xác nhận bắt buộc trước runAudits / setAiBlock, map lỗi BE. Fetch GIẢ (test.invalid) — không gọi BE thật. Chạy: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { buildSpecialistOverview, moderationService } from '../src/services/moderationService';
import { ApiError } from '../src/services/apiClient';
import { SPECIALIST_ROUTES, backManagement, navigateManagement } from '../src/navigation/managementRoutes';
import {
  aiBlockBody,
  clampAuditCount,
  clampFlagMin,
  runAuditsMessage,
  strikeResultMessage,
  strikeState,
} from '../src/utils/monitoring';
import type { QueueItem, ReportGroup } from '../src/types/management';

type Call = { url: string; method: string; body: any };
let calls: Call[] = [];
const respond = (body: unknown, status = 200) => {
  calls = [];
  (globalThis as any).fetch = async (url: string, init: RequestInit = {}) => {
    calls.push({ url, method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  };
};
const last = () => calls[calls.length - 1];
const path = (c: Call) => c.url.replace(/^http:\/\/test\.invalid\/api\/v1/, '');
const ok = (data: unknown, status = 200) => respond({ success: true, data }, status);

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const cases: [string, () => void | Promise<void>][] = [
  ['getRestrictedListings: GET /moderation/listings?status=…', async () => {
    const listing = { id: 'l1', title: 'T', status: 'suspended', updatedAt: '2026-11-01', seller: { id: 's1', displayName: 'Bin', status: 'approved' }, reportsCount: 3, buyersCount: 2, review: null };
    ok({ listings: [listing] });
    assert.deepEqual(await moderationService.getRestrictedListings('suspended'), [listing]);
    assert.deepEqual([last().method, path(last()), last().body], ['GET', '/moderation/listings?status=suspended', undefined]);
    ok({ listings: [] });
    await moderationService.getRestrictedListings('archived');
    assert.equal(path(last()), '/moderation/listings?status=archived');
  }],
  ['getStrikes: chỉ gửi active=true khi lọc (như Web); trả strikeLimit + strikes', async () => {
    ok({ strikeLimit: 3, strikes: [{ id: 'k1' }] });
    const r = await moderationService.getStrikes({ active: true });
    assert.equal(path(last()), '/moderation/strikes?active=true');
    assert.equal(r.strikeLimit, 3);
    assert.equal(r.strikes.length, 1);
    ok({ strikeLimit: 3, strikes: [] });
    await moderationService.getStrikes();
    assert.equal(path(last()), '/moderation/strikes');
  }],
  ['getAudits / runAudits: GET /moderation/audits; POST /moderation/audits/run { count } → { created, reviewIds }', async () => {
    ok({ audits: [{ reviewId: 'r1' }] });
    assert.equal((await moderationService.getAudits()).length, 1);
    assert.deepEqual([last().method, path(last())], ['GET', '/moderation/audits']);
    ok({ created: 2, reviewIds: ['r1', 'r2'] }, 201);
    assert.deepEqual(await moderationService.runAudits(5), { created: 2, reviewIds: ['r1', 'r2'] });
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/moderation/audits/run', { count: 5 }]);
    ok({ created: 0, reviewIds: [] }, 201);
    await moderationService.runAudits();
    assert.deepEqual(last().body, {}, 'không có count → BE dùng số truyện/tuần đã cấu hình');
  }],
  ['getAiFlags / setAiBlock: GET ?days&min; POST /ai-flags/:userId/block { days, reason? }', async () => {
    ok({ days: 14, min: 3, flags: [{ userId: 'u1' }] });
    const r = await moderationService.getAiFlags({ days: 14, min: 3 });
    assert.deepEqual([last().method, path(last())], ['GET', '/moderation/ai-flags?days=14&min=3']);
    assert.equal(r.flags.length, 1);
    ok({ userId: 'u1', aiBlockedUntil: '2026-11-12T00:00:00Z' });
    assert.deepEqual(await moderationService.setAiBlock('u1', aiBlockBody(3, '  spam  ')), { userId: 'u1', aiBlockedUntil: '2026-11-12T00:00:00Z' });
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/moderation/ai-flags/u1/block', { days: 3, reason: 'spam' }]);
    ok({ userId: 'u1', aiBlockedUntil: null });
    await moderationService.setAiBlock('u1', { days: 0 });
    assert.deepEqual(last().body, { days: 0 }, 'mở khoá = days 0');
    assert.deepEqual(aiBlockBody(7, '   '), { days: 7 }, 'lý do trống không gửi');
  }],
  ['issueStrike: nguồn takedown (Truyện tạm gỡ) / report (Ra cảnh cáo); câu báo theo kết quả BE', async () => {
    ok({ strikeId: 'k1', activeStrikes: 2, strikeLimit: 3, sellerSuspended: false }, 201);
    const r = await moderationService.issueStrike({ sellerId: 's1', source: 'takedown', reason: 'Truyện bị gỡ vì bạo lực' });
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/moderation/strikes', { sellerId: 's1', source: 'takedown', reason: 'Truyện bị gỡ vì bạo lực' }]);
    assert.equal(strikeResultMessage(r), 'Đã cảnh cáo (2/3 cảnh cáo còn hiệu lực)');
    assert.equal(strikeResultMessage({ ...r, activeStrikes: 3, sellerSuspended: true }), 'Đã cảnh cáo — đủ 3 cảnh cáo, tài khoản bán đã bị khoá');
  }],
  ['Lỗi BE: không thành công giả, câu đã dịch; response sai hình dạng → ApiError', async () => {
    respond({ success: false, message: 'Không tìm thấy phụ huynh.' }, 404);
    await assert.rejects(moderationService.setAiBlock('u9', { days: 3 }), (e: unknown) => e instanceof ApiError && e.status === 404 && e.message === 'Không tìm thấy phụ huynh.');
    respond({ success: false, message: 'Validation failed', errors: [{ path: 'count', message: 'Too big: expected number to be <=20' }] }, 400);
    await assert.rejects(moderationService.runAudits(21), (e: unknown) => e instanceof ApiError && e.message === 'Giá trị tối đa là 20');
    respond({ success: false, message: 'You do not have permission to access this resource' }, 403);
    await assert.rejects(moderationService.getAudits(), (e: unknown) => e instanceof ApiError && e.message === 'Tài khoản của bạn không có quyền vào mục này');
    for (const [run, body] of [
      [() => moderationService.getStrikes(), { strikes: [] }],
      [() => moderationService.runAudits(1), { reviewIds: [] }],
      [() => moderationService.setAiBlock('u1', { days: 1 }), { userId: 'khác' }],
      [() => moderationService.getRestrictedListings('suspended'), {}],
    ] as [() => Promise<unknown>, unknown][]) {
      ok(body);
      await assert.rejects(run(), (e: unknown) => e instanceof ApiError);
    }
  }],
  ['Tổng quan ghép như Web getSpecialistOverview: hàng chờ, người bán chờ, tổng báo cáo mở, kiểm tra ngẫu nhiên', () => {
    const q = (reviewType: string) => ({ reviewId: reviewType, reviewType }) as unknown as QueueItem;
    const queue = [q('submission'), q('random_audit'), q('report_followup'), q('random_audit')];
    const groups = [{ reports: [{}, {}] }, { reports: [{}] }] as unknown as ReportGroup[];
    const o = buildSpecialistOverview(queue, [{}, {}, {}], groups);
    assert.deepEqual({ ...o, queue: o.queue.length }, { queue: 4, sellerApplications: 3, openReports: 3, audits: 2 });
  }],
  ['Dialog xác nhận BẮT BUỘC trước runAudits và setAiBlock (khoá + mở khoá); chống bấm đúp', () => {
    const audits = noComments(read('screens/specialist/AuditsScreen.tsx'));
    const start = audits.slice(audits.indexOf('const start = async'), audits.indexOf('return ('));
    assert.ok(start.indexOf('dialog.confirm(runAuditsConfirm(count))') >= 0 && start.indexOf('dialog.confirm(') < start.indexOf('moderationService.runAudits('));
    assert.match(start, /if \(!\(await dialog\.confirm\(runAuditsConfirm\(count\)\)\)\) return;/);
    assert.match(start, /if \(busy\) return;/);
    const flags = noComments(read('screens/specialist/AiFlagsScreen.tsx'));
    for (const fn of ['const block = async', 'const unblock = async']) {
      const body = flags.slice(flags.indexOf(fn), flags.indexOf('};', flags.indexOf(fn)));
      assert.ok(body.indexOf('dialog.confirm(') >= 0 && body.indexOf('dialog.confirm(') < body.indexOf('moderationService.setAiBlock('), `${fn}: phải xác nhận trước`);
      assert.match(body, /busy/);
    }
    // Câu xác nhận ghi rõ số truyện / số ngày
    assert.match(noComments(read('utils/monitoring.ts')), /title: `Chọn \$\{count\} truyện để kiểm tra\?`/);
    assert.match(noComments(read('utils/monitoring.ts')), /confirmLabel: `Khoá \$\{days\} ngày`/);
  }],
  ['Câu chữ / giới hạn như Web + BE', () => {
    assert.equal(runAuditsMessage(3), 'Đã chọn 3 truyện để kiểm tra');
    assert.equal(runAuditsMessage(0), 'Không còn truyện đang bán nào để chọn');
    assert.equal(clampAuditCount(0), 1);
    assert.equal(clampAuditCount(99), 20);
    assert.equal(clampFlagMin(500), 100);
    assert.equal(strikeState({ revokedAt: '2026-11-01', active: false, expiresAt: '2027-01-01' }).label, 'Đã gỡ (kháng nghị)');
    assert.equal(strikeState({ revokedAt: null, active: false, expiresAt: '2026-01-01' }).label, 'Hết hạn');
    assert.match(strikeState({ revokedAt: null, active: true, expiresAt: '2027-01-01T00:00:00Z' }).label, /^Hiệu lực đến /);
  }],
  ['Điều hướng: 4 màn giám sát là màn con (không thêm tab), Back về màn trước; menu "Thêm" không còn "Dùng trên Web" cho 4 mục này', () => {
    const atMenu = navigateManagement('SPECIALIST', [{ route: SPECIALIST_ROUTES.QUEUE }], SPECIALIST_ROUTES.MENU);
    for (const r of [SPECIALIST_ROUTES.RESTRICTED, SPECIALIST_ROUTES.STRIKES, SPECIALIST_ROUTES.AUDITS, SPECIALIST_ROUTES.AI_FLAGS]) {
      const s = navigateManagement('SPECIALIST', atMenu, r);
      assert.equal(s.length, 2, `${r} là màn con`);
      assert.deepEqual(backManagement('SPECIALIST', s), atMenu);
    }
    const nav = noComments(read('navigation/SpecialistNavigator.tsx'));
    for (const key of ['suspended', 'strikes', 'audits', 'ai-flags']) assert.doesNotMatch(nav, new RegExp(`web\\('${key}'`), key);
    for (const r of ['RESTRICTED', 'STRIKES', 'AUDITS', 'AI_FLAGS']) assert.match(nav, new RegExp(`case SPECIALIST_ROUTES\\.${r}:`));
    // Lượt hậu kiểm / kiểm tra mở bằng màn Lượt duyệt có sẵn
    assert.match(nav, /<RestrictedListingsScreen onBack=\{nav\.goBack\} onOpenReview=\{openReview\}/);
    assert.match(nav, /<AuditsScreen onBack=\{nav\.goBack\} onOpenReview=\{openReview\}/);
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
