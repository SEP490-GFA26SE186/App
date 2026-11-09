// apps/mobile/tests/adminPlansFinance.test.ts
// GĐ F – Admin: Gói & định giá, Doanh thu & đối soát, Cấu hình AI. Đúng method/path/body 7 hàm (fetch GIẢ, test.invalid — không
// gọi BE thật), validate form gói khớp BE, Dialog xác nhận bắt buộc trước mọi thao tác ghi, chỉ khoá nhóm `ai` được hiện.
// Chạy: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { adminService } from '../src/services/adminService';
import { ApiError } from '../src/services/apiClient';
import { ADMIN_ROUTES, backManagement, navigateManagement } from '../src/navigation/managementRoutes';
import {
  aiSettings,
  createPlanBody,
  planConfirm,
  planForm,
  planFormErrors,
  settingFromInput,
  settingInputError,
  settingToInput,
  updatePlanBody,
} from '../src/utils/adminConfig';
import type { AdminPlan, PlatformSetting } from '../src/types/management';

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

const plan: AdminPlan = { id: 'p1', code: 'FAMILY', name: 'Gia đình', durationMonths: 1, priceVnd: 99000, creditsPerMonth: 30, maxChildren: 3, maxCharacters: 20, canSell: true, isActive: true, activeSubscribers: 12 };
const freePlan: AdminPlan = { ...plan, id: 'p0', code: 'FREE', name: 'Miễn phí', priceVnd: 0, canSell: false };
const setting = (patch: Partial<PlatformSetting>): PlatformSetting => ({
  key: 'ai_cost.story_text.short', group: 'ai', label: 'Credit cho truyện AI ngắn', hint: null, unit: 'credit', type: 'int', min: 0, max: 100, value: 1, isDefault: true, updatedAt: null, updatedBy: null, ...patch,
});

const cases: [string, () => void | Promise<void>][] = [
  ['Gói: GET /admin/plans; POST /admin/plans; PUT /admin/plans/:id chỉ gửi trường đổi', async () => {
    ok({ plans: [plan] });
    assert.deepEqual(await adminService.getAdminPlans(), [plan]);
    assert.deepEqual([last().method, path(last())], ['GET', '/admin/plans']);
    const form = { ...planForm(), code: 'premium_2', name: ' Cao cấp ', priceVnd: '199000', creditsPerMonth: '60', maxChildren: '5', maxCharacters: '50', canSell: true };
    ok({ plan: { ...plan, id: 'p2' } }, 201);
    await adminService.createPlan(createPlanBody(form));
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/admin/plans', { name: 'Cao cấp', priceVnd: 199000, creditsPerMonth: 60, maxChildren: 5, maxCharacters: 50, canSell: true, isActive: true, code: 'PREMIUM_2', durationMonths: 1 }]);
    ok({ plan });
    const body = updatePlanBody(plan, { ...planForm(plan), priceVnd: '109000', isActive: false });
    await adminService.updatePlan('p1', body);
    assert.deepEqual([last().method, path(last()), last().body], ['PUT', '/admin/plans/p1', { priceVnd: 109000, isActive: false }]);
    assert.deepEqual(updatePlanBody(plan, planForm(plan)), {}, 'không đổi gì → không gửi');
  }],
  ['Đối soát: GET /admin/finance/reconciliation; POST …/fix-counters → { fixed }', async () => {
    const recon = { checkedAt: '2026-11-10T00:00:00Z', walletsChecked: 5, walletMismatches: [], paidWithoutWebhook: [], counterDrift: [{ listingId: 'l1', title: 'T', purchaseCount: 2, paidActual: 3, freeClaimCount: 0, freeActual: 0 }] };
    ok(recon);
    assert.deepEqual(await adminService.getReconciliation(), recon);
    assert.deepEqual([last().method, path(last())], ['GET', '/admin/finance/reconciliation']);
    ok({ fixed: 1 });
    assert.deepEqual(await adminService.fixCounters(), { fixed: 1 });
    assert.deepEqual([last().method, path(last())], ['POST', '/admin/finance/reconciliation/fix-counters']);
  }],
  ['Cấu hình: GET /admin/settings; PUT /admin/settings/:key { value } (key được mã hoá URL)', async () => {
    const s = setting({});
    ok({ groups: { ai: 'Chi phí AI' }, settings: [s] });
    assert.equal((await adminService.getSettings()).settings.length, 1);
    assert.deepEqual([last().method, path(last())], ['GET', '/admin/settings']);
    ok({ setting: { ...s, value: 2 } });
    assert.equal((await adminService.updateSetting(s.key, 2)).value, 2);
    assert.deepEqual([last().method, path(last()), last().body], ['PUT', '/admin/settings/ai_cost.story_text.short', { value: 2 }]);
  }],
  ['Lỗi BE (409 trùng mã, 422 gói FREE / ngoài khoảng) → ApiError, không thành công giả; response sai hình dạng → lỗi', async () => {
    respond({ success: false, message: 'Mã gói đã tồn tại.' }, 409);
    await assert.rejects(adminService.createPlan(createPlanBody({ ...planForm(), code: 'FAMILY', name: 'X2' })), (e: unknown) => e instanceof ApiError && e.status === 409 && e.message === 'Mã gói đã tồn tại.');
    respond({ success: false, message: 'Gói Miễn phí luôn có giá 0đ.' }, 422);
    await assert.rejects(adminService.updatePlan('p0', { priceVnd: 1000 }), (e: unknown) => e instanceof ApiError && e.status === 422);
    respond({ success: false, message: 'Credit cho truyện AI ngắn: trong khoảng 0–100.' }, 422);
    await assert.rejects(adminService.updateSetting('ai_cost.story_text.short', 500), (e: unknown) => e instanceof ApiError && e.message === 'Credit cho truyện AI ngắn: trong khoảng 0–100.');
    for (const [run, body] of [
      [() => adminService.getAdminPlans(), {}],
      [() => adminService.updatePlan('p1', { name: 'Mới' }), {}],
      [() => adminService.fixCounters(), {}],
      [() => adminService.getReconciliation(), { walletMismatches: [] }],
      [() => adminService.updateSetting('k', 1), { setting: { key: 'khác' } }],
    ] as [() => Promise<unknown>, unknown][]) {
      ok(body);
      await assert.rejects(run(), (e: unknown) => e instanceof ApiError);
    }
  }],
  ['Validate form gói khớp BE (planFields, mã, thời hạn, gói FREE)', () => {
    assert.deepEqual(planFormErrors({ ...planForm(), code: 'PRO', name: 'Pro' }), {});
    const bad = planFormErrors({ ...planForm(), code: 'pro-1', name: 'P', priceVnd: '1.5', creditsPerMonth: '10001', maxChildren: '0', maxCharacters: '201' });
    assert.deepEqual(Object.keys(bad).sort(), ['code', 'creditsPerMonth', 'maxCharacters', 'maxChildren', 'name', 'priceVnd'].sort());
    assert.ok(planFormErrors({ ...planForm(), code: 'PRO', name: 'Pro', priceVnd: '100000001' }).priceVnd);
    assert.ok(planFormErrors({ ...planForm(), code: 'A', name: 'Pro' }).code, 'mã tối thiểu 2 ký tự');
    assert.deepEqual(planFormErrors({ ...planForm(), code: 'ab_2', name: 'Pro' }), {}, 'mã tự viết hoa như BE');
    assert.equal(createPlanBody({ ...planForm(), code: 'ab_2', name: 'Pro' }).code, 'AB_2');
    // Sửa: không kiểm mã / thời hạn (không sửa được)
    assert.deepEqual(planFormErrors(planForm(plan), plan), {});
    const free = planFormErrors({ ...planForm(freePlan), priceVnd: '1000', isActive: false }, freePlan);
    assert.equal(free.priceVnd, 'Gói Miễn phí luôn có giá 0đ.');
    assert.equal(free.isActive, 'Không tắt được gói Miễn phí.');
  }],
  ['Dialog xác nhận gói: liệt kê thay đổi; đổi giá / credit nhắc chỉ áp dụng lần mua sau', () => {
    const c = planConfirm(plan, { priceVnd: 109000, creditsPerMonth: 40 });
    assert.match(c.message, /Giá: 99\.000 đ → 109\.000 đ/);
    assert.match(c.message, /Credit mỗi tháng: 30 → 40/);
    assert.match(c.message, /áp dụng cho lần mua sau/);
    assert.match(c.message, /12 người dùng/);
    assert.doesNotMatch(planConfirm(plan, { name: 'Mới' }).message, /lần mua sau/);
    assert.match(planConfirm(undefined, createPlanBody({ ...planForm(), code: 'PRO', name: 'Pro' })).title, /Tạo gói Pro/);
  }],
  ['Dialog xác nhận BẮT BUỘC trước mọi thao tác ghi (tạo / sửa gói, tính lại bộ đếm, lưu cấu hình); chống bấm đúp', () => {
    const plans = noComments(read('screens/admin/PlansScreen.tsx'));
    const save = plans.slice(plans.indexOf('const save = async'), plans.indexOf('return (', plans.indexOf('const save = async')));
    assert.ok(save.indexOf('dialog.confirm(planConfirm(plan, body))') < save.indexOf('adminService.updatePlan('));
    assert.ok(save.indexOf('dialog.confirm(planConfirm(undefined, body))') < save.indexOf('adminService.createPlan('));
    assert.match(save, /if \(busy\) return;/);
    const fin = noComments(read('screens/admin/FinanceScreen.tsx'));
    const fix = fin.slice(fin.indexOf('const fix = async'), fin.indexOf('return (', fin.indexOf('const fix = async')));
    assert.ok(fix.indexOf('dialog.confirm(fixCountersConfirm(') >= 0 && fix.indexOf('dialog.confirm(') < fix.indexOf('adminService.fixCounters('));
    assert.match(fix, /if \(busy \|\|/);
    // GĐ D2: lưu cài đặt chuyển sang components/admin/SettingsGroup (dùng chung nhóm ai + market)
    const ai = noComments(read('components/admin/SettingsGroup.tsx'));
    const aiSave = ai.slice(ai.indexOf('const save = async'), ai.indexOf('return (', ai.indexOf('const save = async')));
    assert.ok(aiSave.indexOf('dialog.confirm(settingConfirm(s, raw))') >= 0 && aiSave.indexOf('dialog.confirm(') < aiSave.indexOf('adminService.updateSetting('));
    assert.match(aiSave, /if \(busy\) return;/);
  }],
  ['Cấu hình AI chỉ hiện nhóm `ai`; giá trị kiểm như BE settingError; tỉ lệ hiện %', () => {
    const all = [setting({}), setting({ key: 'finance.usd_vnd', min: 15000, max: 40000, value: 26000, unit: 'đ / 1 USD' }), setting({ key: 'market.seller_share_rate', group: 'market', type: 'rate', min: 0.5, max: 0.95, value: 0.8 }), setting({ key: 'moderation.strike_limit', group: 'moderation' })];
    assert.deepEqual(aiSettings(all).map((s) => s.key), ['ai_cost.story_text.short', 'finance.usd_vnd']);
    // GĐ D2: màn chỉ truyền group="ai"; SettingsGroup lọc bằng settingsOfGroup (aiSettings = nhóm ai)
    const screen = noComments(read('screens/admin/AiConfigScreen.tsx'));
    assert.match(screen, /<SettingsGroup group="ai"/);
    assert.doesNotMatch(screen, /\.settings\b/);
    assert.match(noComments(read('components/admin/SettingsGroup.tsx')), /settingsOfGroup\(all, group\)/);
    const s = setting({});
    assert.equal(settingInputError(s, 'abc'), 'Credit cho truyện AI ngắn: phải là số.');
    assert.equal(settingInputError(s, '1.5'), 'Credit cho truyện AI ngắn: phải là số nguyên.');
    assert.equal(settingInputError(s, '101'), 'Credit cho truyện AI ngắn: trong khoảng 0–100.');
    assert.equal(settingInputError(s, '3'), null);
    const rate = all[2];
    assert.equal(settingToInput(rate), '80');
    assert.equal(settingFromInput(rate, '85'), 0.85);
    assert.equal(settingInputError(rate, '99'), 'Credit cho truyện AI ngắn: trong khoảng 50%–95%.');
    assert.doesNotMatch(screen, /apiKey|API_KEY|secret|process\.env/i, 'không hiện khoá / secret');
  }],
  ['Điều hướng: 3 màn là màn con mở từ "Thêm" (không thêm tab), Back về menu; không còn "Dùng trên Web" cho 3 mục này', () => {
    const atMenu = navigateManagement('ADMIN', [{ route: ADMIN_ROUTES.DASHBOARD }], ADMIN_ROUTES.MENU);
    for (const r of [ADMIN_ROUTES.PLANS, ADMIN_ROUTES.FINANCE, ADMIN_ROUTES.AI_CONFIG]) {
      const s = navigateManagement('ADMIN', atMenu, r);
      assert.equal(s.length, 2, `${r} là màn con`);
      assert.deepEqual(backManagement('ADMIN', s), atMenu);
    }
    const nav = noComments(read('navigation/AdminNavigator.tsx'));
    assert.doesNotMatch(nav, /Dùng trên Web|webOnly/);
    for (const r of ['PLANS', 'FINANCE', 'AI_CONFIG']) assert.match(nav, new RegExp(`case ADMIN_ROUTES\\.${r}:`));
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
