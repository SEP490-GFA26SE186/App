// apps/mobile/tests/selling.test.ts
// GĐ D3 – Bán truyện: đúng method/path/body từng endpoint (fetch GIẢ, test.invalid — không gọi BE thật), màn đúng theo trạng
// thái người bán, kiểm form khớp BE, Dialog trước mọi thao tác ghi, báo cáo trùng (409) → "Đã báo cáo", nút Trả lời chỉ cho
// người bán, không còn màn / import scope-pending. Chạy: xem tests/README.md.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { sellingService } from '../src/services/sellingService';
import { marketService } from '../src/services/marketService';
import { reportOutcome } from '../src/utils/market';
import {
  bankBody,
  bankConfirm,
  bankFormErrors,
  canUpdateVersion,
  fieldErrorsFromBe,
  listingBody,
  listingFormErrors,
  listingStatusLabel,
  maskAccount,
  narrationLabel,
  needsNarrationPoll,
  priceError,
  sellerBody,
  sellerFormErrors,
  sellerView,
  versionForm,
  withdrawError,
} from '../src/utils/selling';
import type { MyListingDto } from '../src/types/selling';

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
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : /\.tsx?$/.test(n) ? [join(dir, n)] : []));

const L = '11111111-2222-4333-8444-555555555555';
const seller = (status: string) => ({ userId: 'u1', displayName: 'Nhà Mây', bio: null, expertise: null, status, reviewedAt: null, createdAt: '' });
const listing = (patch: Partial<MyListingDto> = {}): MyListingDto => ({
  id: 'l1', title: 'Bé Na', description: null, status: 'published', priceVnd: 20000, hasAiContent: true, hasNarration: false, cover: null,
  publishedStoryId: 'pub1', sourceStoryId: 'src1', previousListingId: null, submittedAt: null, publishedAt: null, lastDecision: null, narration: null, ...patch,
});
const narration = (patch = {}) => ({ enabled: true, total: 6, ready: 2, pending: 4, failed: 0, missing: 0, complete: false, ...patch });

const cases: [string, () => void | Promise<void>][] = [
  ['Service: đúng method / path / body cho 12 endpoint người bán + trả lời đánh giá', async () => {
    ok({ seller: null, planCanSell: true });
    await sellingService.getMySeller();
    assert.deepEqual([last().method, path(last())], ['GET', '/sellers/me']);
    ok({ seller: seller('pending') }, 201);
    await sellingService.applySeller({ displayName: 'Nhà Mây' });
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/sellers/apply', { displayName: 'Nhà Mây' }]);
    ok({ seller: seller('approved') });
    await sellingService.updateMySeller({ displayName: 'Nhà Mây', bio: '', expertise: '' });
    assert.deepEqual([last().method, path(last()), last().body], ['PUT', '/sellers/me', { displayName: 'Nhà Mây', bio: '', expertise: '' }]);
    ok({ listings: [] });
    await sellingService.getMyListings();
    assert.deepEqual([last().method, path(last())], ['GET', '/listings/mine']);
    const body = { storyId: 's1', title: 'Bé Na', priceVnd: 0, aliases: [{ token: '{NV1}', aliasName: 'Bé Mây' }] };
    ok({ listing: listing() }, 201);
    await sellingService.createListing(body);
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/listings', body]);
    ok({ listing: listing() }, 201);
    await sellingService.createListingVersion(L, body);
    assert.deepEqual([last().method, path(last()), last().body], ['POST', `/listings/${L}/versions`, body]);
    ok({ balance: { pendingVnd: 0, availableVnd: 0, lockedVnd: 0 }, withdrawals: [], minWithdrawalVnd: 50000, ledger: [], bank: null, holdDays: 3, sellerShareRate: 0.8 });
    await sellingService.getEarnings();
    assert.deepEqual([last().method, path(last())], ['GET', '/sellers/me/earnings']);
    const bank = { bankBin: '970436', bankName: 'Vietcombank', accountNumber: '0123456789', accountHolder: 'NGUYEN VAN A' };
    ok({ bank: { ...bank, accountNumber: '******6789', updatedAt: null } });
    await sellingService.updateBank(bank);
    assert.deepEqual([last().method, path(last()), last().body], ['PUT', '/sellers/me/bank', bank]);
    ok({ withdrawal: { id: 'w1' } }, 201);
    await sellingService.requestWithdrawal(100000);
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/sellers/me/withdrawals', { amountVnd: 100000 }]);
    ok({ withdrawal: { id: 'w1' } });
    await sellingService.cancelWithdrawal('w1');
    assert.deepEqual([last().method, path(last()), last().body], ['DELETE', '/sellers/me/withdrawals/w1', undefined]);
    ok({ sellerStatus: 'approved', strikeLimit: 3, activeStrikes: 0, strikes: [] });
    await sellingService.getMyStrikes();
    assert.deepEqual([last().method, path(last())], ['GET', '/sellers/me/strikes']);
    ok({ appealId: 'a1', status: 'pending' }, 201);
    await sellingService.appealStrike('k1', '  Truyện không có cảnh bạo lực như báo cáo  ');
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/sellers/me/strikes/k1/appeal', { reason: 'Truyện không có cảnh bạo lực như báo cáo' }]);
    ok({ review: { id: 'r1' } });
    await marketService.replyReview('r1', ' Cảm ơn ba mẹ ');
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/market/reviews/r1/reply', { reply: 'Cảm ơn ba mẹ' }]);
  }],

  ['Màn đúng theo trạng thái người bán (như Web SellingPage)', () => {
    assert.equal(sellerView({ seller: null, planCanSell: false }), 'need_plan');
    assert.equal(sellerView({ seller: null, planCanSell: true }), 'apply');
    assert.equal(sellerView({ seller: seller('rejected') as any, planCanSell: true }), 'reapply');
    assert.equal(sellerView({ seller: seller('pending') as any, planCanSell: true }), 'pending');
    assert.equal(sellerView({ seller: seller('approved') as any, planCanSell: false }), 'approved'); // đã duyệt: vẫn là người bán dù đổi gói
    assert.equal(sellerView({ seller: seller('suspended') as any, planCanSell: true }), 'suspended');
    const w = noComments(read('screens/parent/selling/SellingScreen.tsx'));
    assert.match(w, /view === 'need_plan'[\s\S]{0,300}onPress=\{onOpenWallet\}/);
    assert.match(w, /\{seller && <StrikesSection \/>\}/);
    assert.match(w, /\{seller && <EarningsSection \/>\}/);
    assert.match(w, /view === 'approved' && \(\s*<HeyButton title="Đăng truyện mới"/);
  }],

  ['Form khớp BE: hồ sơ bán, giá, tên chung, ngân hàng, rút tiền; lỗi 422 của BE về đúng ô', () => {
    assert.ok(sellerFormErrors({ displayName: ' A ', bio: '', expertise: '' }).displayName);
    assert.ok(sellerFormErrors({ displayName: 'Nhà Mây', bio: 'a'.repeat(2001), expertise: '' }).bio);
    assert.deepEqual(sellerFormErrors({ displayName: 'Nhà Mây', bio: '', expertise: '' }), {});
    assert.deepEqual(sellerBody({ displayName: ' Nhà Mây ', bio: ' ', expertise: '' }, false), { displayName: 'Nhà Mây' });
    assert.deepEqual(sellerBody({ displayName: 'Nhà Mây', bio: '', expertise: '' }, true), { displayName: 'Nhà Mây', bio: '', expertise: '' }); // sửa: rỗng = xoá
    assert.equal(priceError('5000'), null);
    assert.equal(priceError('500000'), null);
    assert.ok(priceError('4000'));
    assert.ok(priceError('5500'));
    assert.ok(priceError('600000'));
    assert.ok(priceError('abc'));
    const form = { storyId: 's1', title: 'Bé Na', description: '', free: false, price: '20000', aliases: { '{NV1}': 'Bé Mây' } };
    assert.deepEqual(listingFormErrors(form, ['{NV1}', '{NV2}']), { 'aliases.{NV2}': 'Đặt tên chung cho nhân vật {NV2}.' });
    assert.ok(listingFormErrors({ ...form, title: 'ab' }, ['{NV1}']).title);
    assert.equal(listingFormErrors({ ...form, free: true, price: '' }, ['{NV1}']).priceVnd, undefined);
    assert.deepEqual(listingBody({ ...form, free: true }, ['{NV1}']), { storyId: 's1', title: 'Bé Na', priceVnd: 0, aliases: [{ token: '{NV1}', aliasName: 'Bé Mây' }] });
    assert.deepEqual(fieldErrorsFromBe([{ path: 'aliases.{NV1}', message: 'Không dùng tên thật' }, { path: 'listing.title', message: 'x' }, { message: 'không path' }]), { 'aliases.{NV1}': 'Không dùng tên thật', title: 'x' });
    const v = versionForm(listing({ priceVnd: 0, title: 'Bản cũ' }), [{ token: '{NV1}', name: 'Bé Mây' }]);
    assert.deepEqual([v.storyId, v.title, v.free, v.aliases], ['src1', 'Bản cũ', true, { '{NV1}': 'Bé Mây' }]);
    assert.deepEqual(bankFormErrors({ bankBin: '970436', accountNumber: '0123456789', accountHolder: 'NGUYEN VAN A' }), {});
    assert.ok(bankFormErrors({ bankBin: '123', accountNumber: '01', accountHolder: 'A' }).accountNumber);
    assert.equal(bankBody({ bankBin: '970436', accountNumber: ' 0123456789 ', accountHolder: 'Nguyen Van A' }).bankName, 'Vietcombank');
    assert.equal(withdrawError('40000', 50000, 200000), 'Số tiền rút tối thiểu là 50.000đ.');
    assert.equal(withdrawError('300000', 50000, 200000), 'Số dư có thể rút không đủ.');
    assert.equal(withdrawError('100000', 50000, 200000), null);
  }],

  ['Số tài khoản không hiện đầy đủ ngoài ô đang nhập', () => {
    assert.equal(maskAccount('0123456789'), '•••• 6789');
    const c = bankConfirm({ bankBin: '970436', bankName: 'Vietcombank', accountNumber: '0123456789', accountHolder: 'a' }, true);
    assert.doesNotMatch(c.message, /0123456789/);
    assert.match(c.message, /24 giờ/);
    const e = noComments(read('components/selling/EarningsSection.tsx'));
    assert.match(e, /accountNumber: ''/); // không điền lại số cũ vào ô
    assert.match(e, /d\.bank\.accountNumber/); // chỉ hiện số BE đã che
  }],

  ['Dialog xác nhận TRƯỚC mọi thao tác ghi, chống bấm đúp (run)', () => {
    const pairs: [string, string, string][] = [
      ['screens/parent/selling/SellingScreen.tsx', 'dialog.confirm(sellerConfirm(', 'sellingService.updateMySeller('],
      ['screens/parent/selling/SellingScreen.tsx', 'dialog.confirm(listingConfirm(', 'sellingService.createListingVersion('],
      ['screens/parent/selling/SellingScreen.tsx', "title: 'Tạo lại giọng đọc?'", 'storyService.retryNarration('],
      ['components/selling/EarningsSection.tsx', 'dialog.confirm(bankConfirm(', 'sellingService.updateBank('],
      ['components/selling/EarningsSection.tsx', 'dialog.confirm(withdrawConfirm(', 'sellingService.requestWithdrawal('],
      ['components/selling/EarningsSection.tsx', 'dialog.confirm(cancelWithdrawConfirm(', 'sellingService.cancelWithdrawal('],
      ['components/selling/StrikesSection.tsx', 'dialog.confirm(appealConfirm)', 'sellingService.appealStrike('],
      ['components/market/ListingReviews.tsx', 'dialog.confirm(replyConfirm(', 'marketService.replyReview('],
    ];
    for (const [f, confirm, call] of pairs) {
      const code = noComments(read(f));
      const a = code.indexOf(confirm);
      const b = code.indexOf(call);
      assert.ok(a > 0 && b > a, `${f}: ${confirm} phải đứng trước ${call}`);
      assert.match(code, /await run\(/, f);
    }
    assert.match(noComments(read('components/selling/StrikesSection.tsx')), /minLength=\{APPEAL_REASON_MIN\}/);
  }],

  ['Báo cáo trùng (409) coi như đã gửi: không lỗi đỏ, hiện "Đã báo cáo"', async () => {
    assert.equal(await reportOutcome(Promise.resolve({ reportId: 'r' })), 'sent');
    respond({ success: false, message: 'Ba mẹ đã báo cáo truyện này rồi.' }, 409);
    assert.equal(await reportOutcome(marketService.reportListing(L, { category: 'other' })), 'duplicate');
    respond({ success: false, message: 'Không báo cáo truyện của chính ba mẹ.' }, 422);
    await assert.rejects(reportOutcome(marketService.reportListing(L, { category: 'other' })), (e: any) => e.status === 422);
    const d = noComments(read('screens/parent/market/ListingDetailScreen.tsx'));
    assert.match(d, /reportOutcome\(marketService\.reportListing\(/);
    const r = noComments(read('components/market/ListingReviews.tsx'));
    assert.match(r, /reportOutcome\(marketService\.reportReview\(/);
    assert.match(r, /reported\.includes\(r\.id\) && <Text style=\{styles\.muted\}>Đã báo cáo<\/Text>/);
  }],

  ['Nút "Trả lời" chỉ cho người bán của truyện, chỉ dưới đánh giá chưa trả lời', () => {
    const r = noComments(read('components/market/ListingReviews.tsx'));
    assert.match(r, /\{d\.isSeller && !r\.sellerReply && \(\s*<HeyButton\s+title="Trả lời"/);
    assert.match(r, /minLength=\{REPLY_MIN\}/);
    assert.match(r, /maxLength=\{REPLY_MAX\}/);
  }],

  ['Truyện đã đăng: nhãn trạng thái, phiên bản, giọng đọc; polling có trần', () => {
    const live = listing({ id: 'a' });
    const next = listing({ id: 'b', status: 'submitted', previousListingId: 'a' });
    assert.equal(canUpdateVersion(live, [live, next]), false); // đang có phiên bản chờ duyệt
    assert.equal(canUpdateVersion(live, [live]), true);
    assert.equal(canUpdateVersion(listing({ sourceStoryId: null }), []), false);
    const old = listing({ id: 'a', status: 'archived' });
    assert.equal(listingStatusLabel(old, [old, listing({ id: 'b', previousListingId: 'a' })]).label, 'Đã thay bằng phiên bản mới');
    assert.equal(listingStatusLabel(listing({ status: 'changes_requested' }), []).label, 'Cần sửa');
    assert.equal(narrationLabel(listing()).text, 'Chỉ có chữ (không giọng đọc)');
    assert.equal(narrationLabel(listing({ hasNarration: true, narration: narration({ failed: 1 }) })).canRetry, true);
    assert.equal(needsNarrationPoll([listing({ hasNarration: true, narration: narration() })]), true);
    assert.equal(needsNarrationPoll([listing({ hasNarration: true, narration: narration({ failed: 1 }) })]), false);
    const w = noComments(read('screens/parent/selling/SellingScreen.tsx'));
    assert.match(w, /polls\.current >= NARRATION_POLL_MAX/);
    assert.match(w, /return \(\) => clearTimeout\(t\)/);
    assert.doesNotMatch(w, /setInterval/);
  }],

  ['Không còn màn / import scope-pending; không <Modal> / hex mới; Role không còn SELLER', () => {
    assert.equal(existsSync(join(src, 'screens/scope-pending')), false);
    for (const f of walk(src)) assert.doesNotMatch(readFileSync(f, 'utf8'), /scope-pending|SellerDashboard/, f);
    assert.doesNotMatch(read('types/domain.ts'), /'SELLER'/);
    const tabs = noComments(read('navigation/ParentTabs.tsx'));
    assert.match(tabs, /case ROUTES\.SELLING:/);
    assert.doesNotMatch(tabs, /activeRole === 'SELLER'/);
    for (const f of [
      'screens/parent/selling/SellingScreen.tsx',
      'components/selling/EarningsSection.tsx',
      'components/selling/StrikesSection.tsx',
      'components/selling/ListingSheet.tsx',
    ])
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
