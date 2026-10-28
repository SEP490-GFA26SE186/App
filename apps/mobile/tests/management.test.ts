// apps/mobile/tests/management.test.ts
// Admin / Chuyên gia sư phạm: định tuyến theo role, điều hướng ngăn xếp, luật nghiệp vụ khớp BE, gọi đúng endpoint,
// và ràng buộc mã nguồn (không dữ liệu mẫu, thao tác nhạy cảm có xác nhận). fetch GIẢ chỉ nằm trong test.
// Chạy từ apps/mobile: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false;
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { ADMIN_ROUTES, MANAGEMENT_TABS, SPECIALIST_ROUTES, backManagement, navigateManagement, shellForRole } from '../src/navigation/managementRoutes';
import { briefState, canToggleAccount, decisionError, refundDecisionError, reviewGate, transferNote, validateSpecialistForm } from '../src/utils/managementRules';
import { listingPrice, money, since, withNames } from '../src/utils/format';
import { authService } from '../src/services/authService';
import { adminService, toQuery } from '../src/services/adminService';
import { moderationService } from '../src/services/moderationService';
import { safeStorage, STORAGE_KEYS } from '../src/services/storage';
import type { ReviewDetail } from '../src/types/management';

let passed = 0;
const tests: [string, () => void | Promise<void>][] = [];
const test = (name: string, fn: () => void | Promise<void>) => tests.push([name, fn]);
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

// ---------- Role ----------
test('BE role (chữ thường) → khung giao diện; role lạ không rơi vào Phụ huynh', () => {
  const role = (r: string) => authService.formatUser({ id: 'u', email: 'a@b.c', role: r } as any).role;
  assert.equal(shellForRole(role('parent')), 'PARENT');
  assert.equal(shellForRole(role('admin')), 'ADMIN');
  assert.equal(shellForRole(role('specialist')), 'SPECIALIST');
  assert.equal(shellForRole(role('seller')), 'UNSUPPORTED');
  assert.equal(shellForRole('MODERATOR'), 'UNSUPPORTED');
});

test('Role thiếu/rỗng/không phải chuỗi → lỗi dữ liệu (không mặc định PARENT); role lạ → Unsupported; role hợp lệ chuẩn hoá', () => {
  const fmt = (role: unknown) => authService.formatUser({ id: 'u', email: 'a@b.c', ...(role === undefined ? {} : { role }) } as any);
  for (const bad of [undefined, null, '', '   ', 42]) {
    assert.throws(() => fmt(bad), (e: any) => e?.status === 502, `role=${JSON.stringify(bad)}`);
  }
  assert.equal(shellForRole(fmt('teacher').role), 'UNSUPPORTED');
  assert.equal(fmt(' Parent ').role, 'PARENT');
  assert.equal(fmt('SPECIALIST').role, 'SPECIALIST');
});

test('AppNavigator chọn khung theo role; dữ liệu Phụ huynh chỉ nạp cho PARENT', () => {
  const nav = read('src/navigation/AppNavigator.tsx');
  assert.match(nav, /switch \(shellForRole\(auth\.currentUser\.role\)\)/);
  assert.match(nav, /<AdminNavigator /);
  assert.match(nav, /<SpecialistNavigator /);
  const sp = read('src/stores/SessionProvider.tsx');
  assert.equal((sp.match(/role === 'PARENT'\) void loadData/g) || []).length, 2, 'cả bootstrap và startSession đều chặn theo role');
});

// ---------- Điều hướng ----------
test('Thanh tab mỗi vai trò tối đa 4 mục, mục cuối là Thêm', () => {
  for (const tabs of Object.values(MANAGEMENT_TABS)) {
    assert.ok(tabs.length <= 4);
    assert.equal(tabs[tabs.length - 1].label, 'Thêm');
  }
});

test('Admin: tab làm mới ngăn xếp, màn con đẩy thêm, Back về tab đầu rồi thoát', () => {
  let s = navigateManagement('ADMIN', [{ route: ADMIN_ROUTES.DASHBOARD }], ADMIN_ROUTES.WITHDRAWALS);
  assert.deepEqual(s.map((x) => x.route), [ADMIN_ROUTES.DASHBOARD, ADMIN_ROUTES.WITHDRAWALS]);
  assert.equal(navigateManagement('ADMIN', s, ADMIN_ROUTES.WITHDRAWALS), s, 'chạm lặp không nhân đôi');
  s = navigateManagement('ADMIN', s, ADMIN_ROUTES.ACCOUNTS);
  assert.deepEqual(s.map((x) => x.route), [ADMIN_ROUTES.ACCOUNTS]);
  assert.deepEqual(backManagement('ADMIN', s), [{ route: ADMIN_ROUTES.DASHBOARD }]);
  assert.equal(backManagement('ADMIN', [{ route: ADMIN_ROUTES.DASHBOARD }]), null);
});

test('Specialist: hai lượt duyệt khác nhau vẫn đẩy được, cùng lượt thì không', () => {
  const base = [{ route: SPECIALIST_ROUTES.QUEUE }];
  const a = navigateManagement('SPECIALIST', base, SPECIALIST_ROUTES.REVIEW, { reviewId: 'r1' });
  assert.equal(navigateManagement('SPECIALIST', a, SPECIALIST_ROUTES.REVIEW, { reviewId: 'r1' }), a);
  assert.equal(navigateManagement('SPECIALIST', a, SPECIALIST_ROUTES.REVIEW, { reviewId: 'r2' }).length, 3);
  assert.deepEqual(backManagement('SPECIALIST', a), base);
});

// ---------- Luật nghiệp vụ (khớp BE) ----------
test('Hoàn tiền: duyệt cần mã giao dịch, từ chối cần ghi chú', () => {
  assert.ok(refundDecisionError(true, '  ', 'x'));
  assert.equal(refundDecisionError(true, 'FT123', ''), null);
  assert.ok(refundDecisionError(false, 'FT123', ' '));
  assert.equal(refundDecisionError(false, '', 'Quá hạn'), null);
});

test('Tạo Chuyên gia: email, tên đăng nhập, mật khẩu theo zod của BE', () => {
  assert.deepEqual(validateSpecialistForm({ fullName: 'Lan Anh', email: 'lan@x.vn', username: 'lan.anh_1', password: '12345678' }), {});
  const e = validateSpecialistForm({ fullName: 'L', email: 'bad', username: 'a b', password: '1234567' });
  assert.deepEqual(Object.keys(e).sort(), ['email', 'fullName', 'password', 'username']);
});

test('Khoá tài khoản: không tự khoá, không khoá Admin đang hoạt động', () => {
  assert.equal(canToggleAccount({ id: 'me', role: 'parent', isActive: true }, 'me'), false);
  assert.equal(canToggleAccount({ id: 'x', role: 'admin', isActive: true }, 'me'), false);
  assert.equal(canToggleAccount({ id: 'x', role: 'admin', isActive: false }, 'me'), true);
  assert.equal(canToggleAccount({ id: 'x', role: 'specialist', isActive: true }, 'me'), true);
});

const detail = (over: Partial<ReviewDetail['review']> = {}, viewed: string[] = []): ReviewDetail => ({
  review: { id: 'r', reviewType: 'submission', allowedDecisions: ['approved', 'changes_requested', 'rejected'], decision: null, comment: null, decidedAt: null, claimedByMe: true, claimExpiresAt: null, ...over },
  listing: { id: 'l', title: 'T', status: 'in_review', priceVnd: 0 },
  seller: 'S',
  story: { pages: [{ id: 'p1', pageOrder: 1, contentText: '' }, { id: 'p2', pageOrder: 2, contentText: '' }], checkpoints: [], characters: [] },
  pageViews: viewed.map((pageId) => ({ pageId, viewedAt: '', comment: null })),
});

test('Lượt duyệt: Duyệt chỉ bật khi xem 100% trang và đủ checklist; chưa nhận bài thì không thao tác', () => {
  assert.equal(reviewGate(detail({}, ['p1']), 7, 7).canApprove, false);
  assert.equal(reviewGate(detail({}, ['p1', 'p2']), 6, 7).canApprove, false);
  assert.equal(reviewGate(detail({}, ['p1', 'p2']), 7, 7).canApprove, true);
  assert.equal(reviewGate(detail({ claimedByMe: false }), 0, 7).canAct, false);
  assert.equal(reviewGate(detail({ decidedAt: '2026-01-01' }), 0, 7).canAct, false);
  assert.equal(reviewGate(detail({ reviewType: 'random_audit' }), 0, 7).isFollowup, true);
});

test('Lượt duyệt: quyết định khác Duyệt bắt buộc nhận xét; quyết định ngoài allowedDecisions bị chặn', () => {
  const d = detail();
  assert.ok(decisionError(d, 'rejected', ' '));
  assert.equal(decisionError(d, 'rejected', 'Có giảng đạo lý'), null);
  assert.equal(decisionError(d, 'approved', ''), null);
  assert.ok(decisionError(d, 'taken_down', 'x'));
});

test('Định dạng: tiền không bịa số 0, giá truyện, tên chung, thời gian', () => {
  assert.equal(money(null), '—');
  assert.match(money(1234567), /^1\.234\.567 đ$/);
  assert.equal(listingPrice(0), 'Miễn phí');
  assert.equal(withNames('{NV1} và {NV2}', [{ token: '{NV1}', name: 'Thỏ' }]), 'Thỏ và {NV2}');
  assert.equal(since(new Date(Date.now() - 5 * 3_600_000).toISOString()), '5 giờ trước');
  assert.equal(transferNote({ id: 'abcdef1234' }), 'StoryWeaver rut tien abcdef12');
  assert.equal(briefState({ isActive: false }), 'isActive: false');
});

// ---------- Endpoint (fetch giả) ----------
type Call = { url: string; method: string; body: any };
const calls: Call[] = [];
const respond = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
(globalThis as any).fetch = async (url: string, init: RequestInit) => {
  calls.push({ url, method: init.method || 'GET', body: init.body ? JSON.parse(String(init.body)) : undefined });
  if (url.includes('/moderation/submissions/')) return respond(detail());
  if (url.includes('/admin/withdrawals?')) return respond({ withdrawals: [] });
  if (url.includes('/moderation/reports')) return respond({ groups: [] });
  if (url.includes('/admin/accounts?') || url.endsWith('/admin/accounts')) return respond({ accounts: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } });
  return respond({});
};
const last = () => calls[calls.length - 1];

test('Query bỏ giá trị rỗng/"all" (BE mặc định all)', () => {
  assert.equal(toQuery({ role: 'all', status: 'active', search: '', page: 2 }), '?status=active&page=2');
});

test('Gọi đúng endpoint + body của BE', async () => {
  safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'AT');
  await adminService.getAccounts({ role: 'all', status: 'all', search: '  lan ', page: 1 });
  assert.equal(last().url, 'http://test.invalid/api/v1/admin/accounts?search=lan&page=1');
  await adminService.markWithdrawalPaid('w1');
  assert.deepEqual([last().method, last().url, last().body], ['POST', 'http://test.invalid/api/v1/admin/withdrawals/w1/mark-paid', {}]);
  await adminService.rejectWithdrawal('w1', 'Sai STK');
  assert.deepEqual(last().body, { reason: 'Sai STK' });
  await adminService.decideRefund('rf', { approve: true, bankTransactionRef: 'FT1' });
  assert.equal(last().url, 'http://test.invalid/api/v1/admin/refunds/rf/decision');
  await moderationService.getReportGroups('all');
  assert.equal(last().url, 'http://test.invalid/api/v1/moderation/reports?status=all', 'status all phải gửi lên vì BE mặc định open');
  await moderationService.decide('r', { decision: 'rejected', comment: 'x', issueStrike: true });
  assert.deepEqual(Object.keys(last().body).sort(), ['comment', 'decision', 'issueStrike'], 'không gửi checklist (BE strict)');
  await moderationService.viewPage('r', 'p1');
  assert.deepEqual(last().body, {}, 'không gửi comment khi không có');
  await adminService.setAccountActive('u1', false);
  assert.deepEqual([last().method, last().body], ['PATCH', { isActive: false }]);
});

test('Phản hồi sai hình dạng → lỗi, không coi là thành công', async () => {
  (globalThis as any).fetch = async () => respond({ nothing: true });
  await assert.rejects(() => adminService.getWithdrawals('requested'));
  await assert.rejects(() => moderationService.getReview('r'));
});

// ---------- Mã nguồn ----------
const files = (dir: string): string[] =>
  readdirSync(join(process.cwd(), dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
const mgmt = [...files('src/screens/admin'), ...files('src/screens/specialist'), ...files('src/components/management'), 'src/navigation/AdminNavigator.tsx', 'src/navigation/SpecialistNavigator.tsx', 'src/navigation/ManagementShell.tsx'];

test('Màn quản trị: không hex cứng, không dữ liệu mẫu/ảnh stock, không Alert.alert', () => {
  for (const f of mgmt) {
    const s = read(f);
    assert.doesNotMatch(s, /#[0-9a-fA-F]{3,8}\b/, `${f}: hex`);
    assert.doesNotMatch(s, /unsplash|sample|demoData|mock/i, `${f}: dữ liệu mẫu`);
    assert.doesNotMatch(s, /Alert\.alert/, `${f}: Alert rỗng trên Web`);
  }
});

test('Thao tác nhạy cảm có hộp xác nhận hoặc sheet nhập lý do', () => {
  for (const f of ['WithdrawalsScreen', 'RefundsScreen', 'AppealsScreen', 'AccountsScreen'].map((n) => `src/screens/admin/${n}.tsx`)) {
    assert.match(read(f), /dialog\.confirm|ReasonSheet/, f);
  }
  for (const f of ['ReviewWorkspaceScreen', 'SellerApplicationsScreen', 'ReportsScreen'].map((n) => `src/screens/specialist/${n}.tsx`)) {
    assert.match(read(f), /dialog\.confirm/, f);
  }
});

test('404/409 khi thao tác (đã có người xử lý, hết hạn giữ bài) → nạp lại dữ liệu, 422 thì giữ nguyên', () => {
  const ui = read('src/components/management/ManagementUi.tsx');
  assert.match(ui, /e\.status === 404 \|\| e\.status === 409\)\) void onStale\?\.\(\)/);
  for (const f of ['admin/WithdrawalsScreen', 'admin/RefundsScreen', 'admin/AppealsScreen', 'admin/AccountsScreen', 'specialist/ReviewWorkspaceScreen', 'specialist/SellerApplicationsScreen', 'specialist/ReportsScreen']) {
    assert.match(read(`src/screens/${f}.tsx`), /useMutationRunner\((list\.reload|\(\) => (list\.)?reload\(\))\)/, f);
  }
});

test('ReasonSheet mở lại không mang lý do của yêu cầu trước', () => {
  assert.match(read('src/components/management/ManagementUi.tsx'), /if \(visible\) \{\s*setText\(''\);/);
});

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log('PASS', name);
  }
  console.log(`${passed}/${tests.length} passed`);
})().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
