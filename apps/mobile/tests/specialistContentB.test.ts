// apps/mobile/tests/specialistContentB.test.ts
// GĐ E2b – Chuyên gia: Soát câu hỏi AI, Tham số báo cáo, Từ khoá chặn; Admin nhóm cài đặt `moderation`. Đúng method/path/body
// từng endpoint (fetch GIẢ, test.invalid — không gọi BE thật), kiểm form khớp BE, Dialog trước mọi thao tác ghi, quyền đúng BE,
// không còn mục "Dùng trên Web" trong khu Chuyên gia. Chạy: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { pedagogyService } from '../src/services/pedagogyService';
import { SPECIALIST_ROUTES, backManagement, navigateManagement } from '../src/navigation/managementRoutes';
import { settingInputError, settingsOfGroup } from '../src/utils/adminConfig';
import {
  addKeywordsConfirm,
  flagRate,
  keywordsError,
  parseKeywords,
  reportRules,
  reportSettingsBody,
  reportSettingsError,
  reportSettingsForm,
  reviewActions,
  severityConfirm,
} from '../src/utils/pedagogy';
import type { PlatformSetting } from '../src/types/management';

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

const SK = '11111111-2222-4333-8444-555555555555';
const CP = '22222222-2222-4333-8444-555555555555';
const kw = { id: 'k1', keyword: 'ngu', severity: 'block', isActive: true, createdAt: '2026-11-01T00:00:00Z', creator: 'Chuyên gia A' };

const cases: [string, () => void | Promise<void>][] = [
  ['Service: đúng method / path / body cho 11 endpoint (checkpoint-review, report-settings, keywords)', async () => {
    respond({ success: true, message: 'Success', data: [{ checkpointId: CP, status: 'pending', options: [] }], nextCursor: CP });
    const q = await pedagogyService.getCheckpointQueue({ status: 'pending', skillId: SK, subSkillId: 'all', templateId: 'all', cursor: CP });
    assert.deepEqual([last().method, path(last())], ['GET', `/checkpoint-review?status=pending&skillId=${SK}&cursor=${CP}&limit=20`]);
    assert.equal(q.nextCursor, CP); // nextCursor nằm NGOÀI data (envelope)
    assert.equal(q.items.length, 1);
    respond({ success: true, data: [], nextCursor: null });
    await pedagogyService.getCheckpointQueue({ status: 'all' });
    assert.equal(path(last()), '/checkpoint-review?limit=20'); // "Tất cả" không gửi status

    ok([{ templateId: 't', title: 'Mẫu', reviewed: 4, flagged: 1 }]);
    await pedagogyService.getCheckpointReviewStats();
    assert.deepEqual([last().method, path(last())], ['GET', '/checkpoint-review/stats']);
    ok({ checkpointId: CP, status: 'ok' });
    await pedagogyService.markCheckpointOk(CP);
    assert.deepEqual([last().method, path(last()), last().body], ['POST', `/checkpoint-review/${CP}/ok`, undefined]);
    ok({ checkpointId: CP, status: 'flagged' });
    await pedagogyService.flagCheckpoint(CP, '  Câu hỏi gán sai kỹ năng  ');
    assert.deepEqual([last().method, path(last()), last().body], ['POST', `/checkpoint-review/${CP}/flag`, { reason: 'Câu hỏi gán sai kỹ năng' }]);
    ok({ checkpointId: CP, status: 'pending' });
    await pedagogyService.unflagCheckpoint(CP);
    assert.deepEqual([last().method, path(last())], ['DELETE', `/checkpoint-review/${CP}/flag`]);

    ok({ window: 5, minItems: 3, developingFrom: 0.5, secureFrom: 0.8 });
    await pedagogyService.getReportSettings();
    assert.deepEqual([last().method, path(last())], ['GET', '/pedagogy/report-settings']);
    ok({ window: 6, minItems: 3, developingFrom: 0.5, secureFrom: 0.8 });
    await pedagogyService.updateReportSettings({ window: 6, minItems: 3, developingFrom: 0.5, secureFrom: 0.8 });
    assert.deepEqual([last().method, path(last()), last().body], ['PUT', '/pedagogy/report-settings', { window: 6, minItems: 3, developingFrom: 0.5, secureFrom: 0.8 }]);

    ok({ keywords: [kw] });
    await pedagogyService.getKeywords({ search: ' ng ', severity: 'all' });
    assert.deepEqual([last().method, path(last())], ['GET', '/moderation/keywords?search=ng']);
    ok({ keyword: kw }, 201);
    assert.deepEqual(await pedagogyService.addKeywords(['ngu'], 'block'), { count: 1 });
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/moderation/keywords', { keyword: 'ngu', severity: 'block' }]);
    ok({ count: 2 });
    await pedagogyService.addKeywords(['ngu', 'dốt'], 'warn');
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/moderation/keywords/bulk', { keywords: ['ngu', 'dốt'], severity: 'warn' }]);
    ok({ keyword: { ...kw, severity: 'warn' } });
    await pedagogyService.updateKeyword('k1', { severity: 'warn' });
    assert.deepEqual([last().method, path(last()), last().body], ['PUT', '/moderation/keywords/k1', { severity: 'warn' }]);
    ok({ deleted: true });
    await pedagogyService.deleteKeyword('k1');
    assert.deepEqual([last().method, path(last())], ['DELETE', '/moderation/keywords/k1']);
  }],

  ['Lỗi BE hiện câu BE (409 từ khoá đã có, 422 lý do gắn cờ); dữ liệu sai dạng → 502', async () => {
    respond({ success: false, message: 'Từ khoá đã có trong danh sách.' }, 409);
    await assert.rejects(pedagogyService.addKeywords(['ngu'], 'block'), (e: any) => e.status === 409 && e.message === 'Từ khoá đã có trong danh sách.');
    respond({ success: true, data: { items: [] } });
    await assert.rejects(pedagogyService.getCheckpointQueue(), (e: any) => e.status === 502);
    ok({ window: 5 });
    await assert.rejects(pedagogyService.getReportSettings(), (e: any) => e.status === 502);
  }],

  ['Soát câu hỏi: nút theo trạng thái như Web; lý do gắn cờ 5–500; tỉ lệ cờ', () => {
    assert.deepEqual(reviewActions('pending'), { unflag: false, flag: true, ok: true });
    assert.deepEqual(reviewActions('ok'), { unflag: false, flag: true, ok: false });
    assert.deepEqual(reviewActions('flagged'), { unflag: true, flag: false, ok: true });
    assert.equal(flagRate({ reviewed: 4, flagged: 1 }), '25%');
    assert.equal(flagRate({ reviewed: 0, flagged: 0 }), '—');
    const w = noComments(read('screens/specialist/CheckpointReviewScreen.tsx'));
    assert.match(w, /minLength=\{FLAG_REASON_MIN\}/);
    assert.match(w, /maxLength=\{FLAG_REASON_MAX\}/);
    assert.match(w, /load\(cursor\)/); // "Xem thêm" theo cursor của BE
  }],

  ['Tham số báo cáo: kiểm như BE, nhập %, gửi đủ 4 trường tỉ lệ 0..1', () => {
    const f = reportSettingsForm({ window: 5, minItems: 3, developingFrom: 0.5, secureFrom: 0.8 });
    assert.deepEqual(f, { window: '5', minItems: '3', developingFrom: '50', secureFrom: '80' });
    assert.equal(reportSettingsError(f), null);
    assert.match(reportSettingsError({ ...f, window: '21' }) ?? '', /1 đến 20/);
    assert.match(reportSettingsError({ ...f, window: '2.5' }) ?? '', /1 đến 20/);
    assert.match(reportSettingsError({ ...f, minItems: '6' }) ?? '', /không được lớn hơn/);
    assert.match(reportSettingsError({ ...f, developingFrom: '0' }) ?? '', /lớn hơn 0%/);
    assert.match(reportSettingsError({ ...f, secureFrom: '101' }) ?? '', /tối đa là 100%/);
    assert.match(reportSettingsError({ ...f, developingFrom: '80' }) ?? '', /phải lớn hơn ngưỡng/);
    assert.deepEqual(reportSettingsBody({ ...f, developingFrom: '45' }), { window: 5, minItems: 3, developingFrom: 0.45, secureFrom: 0.8 });
    assert.match(reportRules(f)[1], /50% đến dưới 80%/);
  }],

  ['Từ khoá: mỗi dòng một từ, bỏ trùng; ≤ 100 ký tự, ≤ 500 từ; Dialog nói rõ mức độ', () => {
    assert.deepEqual(parseKeywords(' ngu \n\nngu\n dốt '), ['ngu', 'dốt']);
    assert.ok(keywordsError([]));
    assert.ok(keywordsError(['a'.repeat(101)]));
    assert.ok(keywordsError(Array.from({ length: 501 }, (_, i) => `w${i}`)));
    assert.equal(keywordsError(['ngu']), null);
    assert.match(addKeywordsConfirm(['a', 'b'], 'warn').message, /Cảnh báo[\s\S]*cập nhật mức độ và bật lại/);
    assert.match(severityConfirm({ keyword: 'ngu', severity: 'block' }).title, /Cảnh báo/);
    // BE không cho sửa chữ của từ khoá: chỉ gửi severity / isActive
    assert.doesNotMatch(noComments(read('screens/specialist/KeywordsScreen.tsx')), /updateKeyword\([^)]*keyword:/);
  }],

  ['Dialog xác nhận TRƯỚC mọi thao tác ghi, chống bấm đúp', () => {
    const pairs: [string, string, string][] = [
      ['screens/specialist/CheckpointReviewScreen.tsx', 'dialog.confirm(okConfirm(', 'pedagogyService.markCheckpointOk('],
      ['screens/specialist/CheckpointReviewScreen.tsx', 'dialog.confirm(unflagConfirm)', 'pedagogyService.unflagCheckpoint('],
      ['screens/specialist/CheckpointReviewScreen.tsx', 'dialog.confirm(flagConfirm)', 'pedagogyService.flagCheckpoint('],
      ['screens/specialist/ReportSettingsScreen.tsx', 'dialog.confirm(reportSettingsConfirm(', 'pedagogyService.updateReportSettings('],
      ['screens/specialist/KeywordsScreen.tsx', 'dialog.confirm(addKeywordsConfirm(', 'pedagogyService.addKeywords('],
      ['screens/specialist/KeywordsScreen.tsx', 'dialog.confirm(severityConfirm(', 'pedagogyService.updateKeyword(k.id, { severity'],
      ['screens/specialist/KeywordsScreen.tsx', 'dialog.confirm(keywordToggleConfirm(', 'pedagogyService.updateKeyword(k.id, { isActive'],
      ['screens/specialist/KeywordsScreen.tsx', 'dialog.confirm(keywordDeleteConfirm(', 'pedagogyService.deleteKeyword('],
    ];
    for (const [f, confirm, call] of pairs) {
      const code = noComments(read(f));
      const a = code.indexOf(confirm);
      const b = code.indexOf(call, a);
      assert.ok(a > 0 && b > a, `${f}: "${confirm}" phải đứng trước "${call}"`);
      assert.match(code, /if \(\S*busy\) return;|if \(!form \|\| busy\) return;|if \(!flagging \|\| busy\) return;/, f);
    }
  }],

  ['Nhóm cài đặt moderation: chỉ 4 khoá, đặt ở khu ADMIN (BE /admin/settings chỉ cho admin), không ở khu Chuyên gia', () => {
    const s = (key: string, group: string): PlatformSetting => ({ key, group, label: key, hint: null, unit: '', type: 'int', min: 1, max: 50, value: 3, isDefault: true, updatedAt: null, updatedBy: null });
    const all = [s('ai_cost.scene_image', 'ai'), s('market.refund_window_days', 'market'), ...['report_threshold', 'strike_limit', 'strike_valid_days', 'audit_per_week'].map((k) => s(`moderation.${k}`, 'moderation'))];
    assert.deepEqual(settingsOfGroup(all, 'moderation').map((x) => x.key), ['moderation.report_threshold', 'moderation.strike_limit', 'moderation.strike_valid_days', 'moderation.audit_per_week']);
    assert.equal(settingInputError(all[2], '51', all), 'moderation.report_threshold: trong khoảng 1–50.');
    assert.match(noComments(read('screens/admin/PlansScreen.tsx')), /<SettingsGroup group="moderation" res=\{settings\}/);
    for (const f of ['navigation/SpecialistNavigator.tsx', 'screens/specialist/ReportSettingsScreen.tsx', 'screens/specialist/KeywordsScreen.tsx', 'screens/specialist/CheckpointReviewScreen.tsx'])
      assert.doesNotMatch(noComments(read(f)), /SettingsGroup|adminService\.(getSettings|updateSetting)/, f);
  }],

  ['Điều hướng: 3 màn con mở từ "Thêm", Back về menu; khu Chuyên gia không còn "Dùng trên Web"; không <Modal> / hex mới', () => {
    const atMenu = navigateManagement('SPECIALIST', [{ route: SPECIALIST_ROUTES.QUEUE }], SPECIALIST_ROUTES.MENU);
    for (const r of [SPECIALIST_ROUTES.CHECKPOINT_REVIEW, SPECIALIST_ROUTES.REPORT_SETTINGS, SPECIALIST_ROUTES.KEYWORDS]) {
      const st = navigateManagement('SPECIALIST', atMenu, r);
      assert.equal(st.length, 2, `${r} là màn con`);
      assert.deepEqual(backManagement('SPECIALIST', st), atMenu);
    }
    const nav = noComments(read('navigation/SpecialistNavigator.tsx'));
    assert.doesNotMatch(nav, /Dùng trên Web|webOnly|WEB_ONLY_NOTICE|web\(/);
    for (const r of ['CHECKPOINT_REVIEW', 'REPORT_SETTINGS', 'KEYWORDS']) assert.match(nav, new RegExp(`case SPECIALIST_ROUTES\\.${r}:`));
    for (const f of ['screens/specialist/CheckpointReviewScreen.tsx', 'screens/specialist/ReportSettingsScreen.tsx', 'screens/specialist/KeywordsScreen.tsx'])
      assert.doesNotMatch(noComments(read(f)), /<Modal\b|#[0-9a-fA-F]{3,8}\b/, f);
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
