// apps/mobile/tests/marketplace.test.ts
// GĐ D2 – Chợ truyện: đúng method/path/query/body 9 hàm (fetch GIẢ, test.invalid — không gọi BE thật), nút Mua/Đọc theo trạng
// thái sở hữu, mua 0đ không mở trình duyệt / > 0đ qua checkoutAndOpen (Linking GIẢ), kiểm tra đánh giá / báo cáo khớp BE,
// nhóm cài đặt `market` chỉ hiện đúng khoá. Chạy: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { marketService } from '../src/services/marketService';
import { checkoutAndOpen } from '../src/utils/billing';
import {
  DEFAULT_MARKET_FILTERS,
  REPORT_OPTIONS,
  buyConfirm,
  distributionRows,
  listingAction,
  listingQuery,
  purchaseView,
  reportBody,
  reportError,
  reviewBody,
  reviewFormError,
  reviewHint,
} from '../src/utils/market';
import { settingInputError, settingsOfGroup } from '../src/utils/adminConfig';
import { ROUTES, navigateStack } from '../src/navigation/routes';
import type { PlatformSetting } from '../src/types/management';
import type { ListingDetailDto } from '../src/types/market';

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

const L = '11111111-2222-4333-8444-555555555555';
const S = '22222222-2222-4333-8444-555555555555';
const R = '33333333-2222-4333-8444-555555555555';
const listing = (patch: Partial<ListingDetailDto> = {}): ListingDetailDto => ({
  id: L, title: 'Bé Na dũng cảm', description: null, topic: { title: 'Dũng cảm', competency: 'self_management', ageMin: 5, ageMax: 7 }, cover: null,
  totalPages: 6, checkpointCount: 2, priceVnd: 25000, seller: { id: S, displayName: 'Nhà Mây', ratingAvg: 4.5, totalSales: 10 }, purchaseCount: 3,
  ratingAvg: 4, ratingCount: 2, hasAiContent: true, hasNarration: false, publishedAt: '2026-11-01T00:00:00.000Z', publishedStoryId: 'st1', owned: false,
  preview: 'Ngày xưa…', isMine: false, ...patch,
});
const order = (status = 'pending') => ({ id: 'o1', status, totalVnd: 25000, payosOrderCode: 1, paidAt: null, expiresAt: null, createdAt: '', items: [] });
const setting = (key: string, group: string, value: number, patch: Partial<PlatformSetting> = {}): PlatformSetting => ({
  key, group, label: key, hint: null, unit: 'ngày', type: 'int', min: 1, max: 30, value, isDefault: true, updatedAt: null, updatedBy: null, ...patch,
});

const cases: [string, () => void | Promise<void>][] = [
  ['Service: đúng method / path / query / body cho 9 hàm', async () => {
    ok({ items: [], pagination: { page: 2, limit: 8, total: 0, totalPages: 1 } });
    await marketService.listListings(listingQuery({ ...DEFAULT_MARKET_FILTERS, search: '  mèo ', price: 'under20', narration: 'with', sort: 'rating' }, 2));
    assert.equal(last().method, 'GET');
    assert.equal(path(last()), '/market/listings?search=m%C3%A8o&competency=all&age=all&priceMin=1&priceMax=19999&narration=with&sort=rating&page=2&limit=8');

    ok({ listing: listing() });
    await marketService.getListing(L);
    assert.deepEqual([last().method, path(last())], ['GET', `/market/listings/${L}`]);

    ok({ seller: { id: S }, items: [] });
    await marketService.getSellerProfile(S);
    assert.deepEqual([last().method, path(last())], ['GET', `/market/sellers/${S}`]);

    ok({ items: [] });
    await marketService.listOwned();
    assert.deepEqual([last().method, path(last())], ['GET', '/market/owned']);

    ok({ order: order(), checkoutUrl: 'https://pay.payos.vn/web/x' }, 201);
    await marketService.checkoutListing(L);
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/market/checkout', { listingId: L }]);

    ok({ reviews: [], distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, pagination: {}, myReview: null, canReview: false, reason: 'not_owned', isSeller: false, tags: [] });
    await marketService.getReviews(L);
    assert.deepEqual([last().method, path(last())], ['GET', `/market/listings/${L}/reviews?page=1`]);

    ok({ review: { id: R }, created: true });
    await marketService.saveReview(L, { rating: 5, tags: ['child_liked'] });
    assert.deepEqual([last().method, path(last()), last().body], ['PUT', `/market/listings/${L}/review`, { rating: 5, tags: ['child_liked'] }]);

    ok({ reportId: 'rp1', suspended: false }, 201);
    await marketService.reportListing(L, { category: 'scary', description: 'Có cảnh làm bé sợ' });
    assert.deepEqual([last().method, path(last()), last().body], ['POST', `/market/listings/${L}/reports`, { category: 'scary', description: 'Có cảnh làm bé sợ' }]);

    ok({ reportId: 'rp2' }, 201);
    await marketService.reportReview(R, { category: 'other' });
    assert.deepEqual([last().method, path(last()), last().body], ['POST', `/market/reviews/${R}/reports`, { category: 'other' }]);
  }],

  ['Query: "Tất cả" không gửi giá; "Miễn phí" gửi 0–0; tìm rỗng bị bỏ; dữ liệu sai dạng → 502; lỗi BE giữ câu BE', async () => {
    ok({ items: [], pagination: { page: 1, limit: 8, total: 0, totalPages: 1 } });
    await marketService.listListings(listingQuery(DEFAULT_MARKET_FILTERS, 1));
    assert.doesNotMatch(path(last()), /priceMin|priceMax|search=/);
    await marketService.listListings(listingQuery({ ...DEFAULT_MARKET_FILTERS, price: 'free' }, 1));
    assert.match(path(last()), /priceMin=0&priceMax=0/);
    ok({ items: [] });
    await assert.rejects(marketService.listListings(), (e: any) => e.status === 502);
    respond({ success: false, message: 'Ba mẹ đã có truyện này.' }, 409);
    await assert.rejects(marketService.checkoutListing(L), (e: any) => e.status === 409 && e.message === 'Ba mẹ đã có truyện này.');
  }],

  ['Nút theo trạng thái sở hữu: của mình / đã có → Đọc trong Chế độ Bé / 0đ → Nhận miễn phí / > 0đ → Mua', () => {
    assert.equal(listingAction(listing({ isMine: true, owned: true })).kind, 'mine');
    assert.deepEqual(listingAction(listing({ owned: true })), { kind: 'owned', label: 'Đọc trong Chế độ Bé' });
    assert.deepEqual(listingAction(listing({ priceVnd: 0 })), { kind: 'claim', label: 'Nhận miễn phí' });
    assert.deepEqual(listingAction(listing()), { kind: 'buy', label: 'Mua 25.000đ' });
    const w = noComments(read('screens/parent/market/ListingDetailScreen.tsx'));
    assert.match(w, /action\.kind === 'owned'[\s\S]{0,400}<OwnedShelf storyId=\{l\.publishedStoryId\}/);
    assert.match(w, /\(action\.kind === 'buy' \|\| action\.kind === 'claim'\)/);
  }],

  ['Mua 0đ không mở trình duyệt; > 0đ mở đúng checkoutUrl qua checkoutAndOpen; Dialog trước khi tạo đơn', async () => {
    const opened: string[] = [];
    const linking = { openURL: async (u: string) => void opened.push(u) };
    ok({ order: order('paid'), checkoutUrl: null }, 201);
    assert.equal((await checkoutAndOpen(L, marketService.checkoutListing, linking)).opened, false);
    assert.deepEqual(opened, []);
    ok({ order: order(), checkoutUrl: 'https://pay.payos.vn/web/abc' }, 201);
    assert.equal((await checkoutAndOpen(L, marketService.checkoutListing, linking)).opened, true);
    assert.deepEqual(opened, ['https://pay.payos.vn/web/abc']);

    assert.match(buyConfirm(listing()).message, /25\.000đ • người bán Nhà Mây[\s\S]*payOS/);
    assert.equal(buyConfirm(listing({ priceVnd: 0 })).confirmLabel, 'Nhận miễn phí');
    const w = noComments(read('screens/parent/market/ListingDetailScreen.tsx'));
    const confirmAt = w.indexOf('dialog.confirm(buyConfirm(listing))');
    assert.ok(confirmAt > 0 && w.indexOf('checkoutAndOpen(listing.id, marketService.checkoutListing, Linking)') > confirmAt);
    assert.match(w, /watchAppReturn\(AppState, \(\) => void checkRef\.current\(\)\)/);
    assert.match(w, /billingService\.getOrder\(orderId\)/);
    assert.doesNotMatch(w, /setInterval|setTimeout/);
    assert.equal(purchaseView('paid').title, 'Mua truyện thành công');
    assert.equal(purchaseView('expired').title, 'Đơn đã hết hạn');
  }],

  ['Đánh giá: 1–5 sao bắt buộc, nhận xét ≤ 1000, thẻ chỉ trong danh sách BE; gợi ý khi chưa đánh giá được', () => {
    assert.ok(reviewFormError({ rating: 0, comment: '', tags: [] }));
    assert.ok(reviewFormError({ rating: 6, comment: '', tags: [] }));
    assert.ok(reviewFormError({ rating: 4, comment: 'a'.repeat(1001), tags: [] }));
    assert.equal(reviewFormError({ rating: 4, comment: '  hay  ', tags: [] }), null);
    assert.deepEqual(reviewBody({ rating: 4, comment: '   ', tags: ['child_liked', 'child_liked', 'good_narration'] }, ['child_liked', 'clear_lesson']), { rating: 4, tags: ['child_liked'] });
    assert.deepEqual(reviewBody({ rating: 5, comment: ' Bé thích ', tags: [] }, []), { rating: 5, comment: 'Bé thích', tags: [] });
    assert.match(reviewHint({ canReview: false, isSeller: false, myReview: null }, true) ?? '', /Khi bé đọc hết truyện/);
    assert.match(reviewHint({ canReview: true, isSeller: false, myReview: { hidden: true } }, true) ?? '', /bị ẩn/);
    assert.equal(reviewHint({ canReview: false, isSeller: false, myReview: null }, false), null);
    assert.deepEqual(distributionRows({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 }).map((r) => r.ratio), [0.5, 0.25, 0.25, 0, 0]);
  }],

  ['Báo cáo: đúng 6 loại của BE, mô tả ≤ 2000 tuỳ chọn; gửi đánh giá / báo cáo LUÔN qua Dialog, chống bấm đúp', () => {
    assert.deepEqual(REPORT_OPTIONS.map((o) => o.value), ['scary', 'violent', 'inappropriate_lesson', 'personal_info', 'technical_error', 'other']);
    assert.ok(reportError('', ''));
    assert.ok(reportError('spam', ''));
    assert.ok(reportError('other', 'a'.repeat(2001)));
    assert.equal(reportError('violent', ''), null);
    assert.deepEqual(reportBody('violent', '   '), { category: 'violent' });
    const d = noComments(read('screens/parent/market/ListingDetailScreen.tsx'));
    assert.ok(d.indexOf("dialog.confirm(reportConfirm('listing', category))") < d.indexOf('marketService.reportListing('));
    const r = noComments(read('components/market/ListingReviews.tsx'));
    assert.ok(r.indexOf('dialog.confirm(reviewConfirm(') > 0 && r.indexOf('dialog.confirm(reviewConfirm(') < r.indexOf('marketService.saveReview('));
    assert.ok(r.indexOf("dialog.confirm(reportConfirm('review', category))") < r.indexOf('marketService.reportReview('));
    assert.match(r, /run\('review'/);
    assert.match(r, /run\(`report:\$\{target\.id\}`/); // GĐ D3: giữ đánh giá đang báo cáo trong `target` để đánh dấu "Đã báo cáo"
  }],

  ['Admin nhóm market: chỉ 4 khoá market; hạn hoàn tiền ≤ ngày giữ doanh thu như BE; Gói & định giá hiện nhóm market', () => {
    const all = [
      setting('ai_cost.scene_image', 'ai', 1, { min: 0, max: 100, unit: 'credit' }),
      setting('market.seller_share_rate', 'market', 0.8, { type: 'rate', min: 0.5, max: 0.95, unit: '%' }),
      setting('market.earning_hold_days', 'market', 3),
      setting('market.refund_window_days', 'market', 3),
      setting('market.min_withdrawal_vnd', 'market', 50000, { min: 10000, max: 10000000, unit: 'đ' }),
      setting('moderation.strike_limit', 'moderation', 3),
    ];
    assert.deepEqual(settingsOfGroup(all, 'market').map((s) => s.key), ['market.seller_share_rate', 'market.earning_hold_days', 'market.refund_window_days', 'market.min_withdrawal_vnd']);
    assert.match(settingInputError(all[3], '5', all) ?? '', /không được dài hơn số ngày giữ doanh thu/);
    assert.match(settingInputError(all[2], '2', all) ?? '', /không được dài hơn số ngày giữ doanh thu/);
    assert.equal(settingInputError(all[3], '2', all), null);
    assert.equal(settingInputError(all[1], '96', all), 'market.seller_share_rate: trong khoảng 50%–95%.');
    const plans = noComments(read('screens/admin/PlansScreen.tsx'));
    assert.match(plans, /<SettingsGroup group="market" res=\{settings\}/);
    const g = noComments(read('components/admin/SettingsGroup.tsx'));
    assert.match(g, /settingInputError\(setting, raw, all\)/);
  }],

  ['Điều hướng + lối vào: mục Chợ truyện hiện ở bản thật; chi tiết / người bán là màn con; không <Modal> / hex mới', () => {
    const s1 = navigateStack([{ route: ROUTES.MARKET }], ROUTES.MARKET_LISTING, { listingId: 'a' });
    assert.equal(s1.length, 2);
    assert.equal(navigateStack(s1, ROUTES.MARKET_LISTING, { listingId: 'a' }), s1); // chạm lặp bị bỏ qua
    assert.equal(navigateStack(s1, ROUTES.MARKET_LISTING, { listingId: 'b' }).length, 3);
    const tabs = noComments(read('navigation/ParentTabs.tsx'));
    assert.doesNotMatch(tabs, /__DEV__ \|\| item\.key !== 'market'/);
    assert.doesNotMatch(tabs, /scope-pending\/MarketplaceScreen/);
    assert.match(tabs, /onOpenListing=\{\(listingId\) => navigate\(ROUTES\.MARKET_LISTING, \{ listingId \}\)\}/);
    for (const f of [
      'screens/parent/market/MarketplaceScreen.tsx',
      'screens/parent/market/ListingDetailScreen.tsx',
      'screens/parent/market/SellerProfileScreen.tsx',
      'components/market/MarketUi.tsx',
      'components/market/ListingReviews.tsx',
      'components/market/OwnedListingsPanel.tsx',
      'components/admin/SettingsGroup.tsx',
    ]) {
      const code = noComments(read(f));
      assert.doesNotMatch(code, /<Modal\b|#[0-9a-fA-F]{3,8}\b/, f);
    }
    assert.match(noComments(read('components/parent/ShelfItemRow.tsx')), /item\.kind !== 'private' && <Badge label="Mua từ chợ"/);
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
