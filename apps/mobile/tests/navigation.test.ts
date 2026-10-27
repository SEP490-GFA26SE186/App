// apps/mobile/tests/navigation.test.ts
// R3: logic điều hướng thuần (navigation/routes.ts) và các ràng buộc khung điều hướng. Không render, không dependency.
// Chạy từ apps/mobile: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTES, TAB_ROUTES, NavState, activeTabFor, backStack, navigateStack } from '../src/navigation/routes';

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log('PASS', name);
};
const home: NavState[] = [{ route: ROUTES.HOME }];
const routesOf = (s: NavState[]) => s.map((n) => n.route).join('>');

test('Thanh tab: Trang chủ, Tủ truyện, Sáng tác, Tiến độ, Hồ sơ; Credit/Ví không còn là tab', () => {
  assert.ok(!(TAB_ROUTES as string[]).includes(ROUTES.WALLET));
  assert.deepEqual(TAB_ROUTES, [ROUTES.HOME, ROUTES.LIBRARY, ROUTES.CREATE, ROUTES.EQ, ROUTES.MORE]);
});

test('Chọn tab làm mới ngăn xếp', () => {
  const deep = navigateStack(navigateStack(home, ROUTES.CHILDREN), ROUTES.SETTINGS);
  assert.equal(routesOf(deep), 'HOME>CHILDREN>SETTINGS');
  assert.equal(routesOf(navigateStack(deep, ROUTES.LIBRARY)), 'LIBRARY');
});

test('Ví mở từ header (pill credit) là màn con: đẩy lên ngăn xếp, quay lại về đúng chỗ cũ', () => {
  const s = navigateStack([{ route: ROUTES.LIBRARY }], ROUTES.WALLET);
  assert.equal(routesOf(s), 'LIBRARY>WALLET');
  assert.equal(routesOf(s.slice(0, -1)), 'LIBRARY');
});

test('Chạm lặp vào pill credit khi đang ở Ví không đẩy thêm màn', () => {
  const once = navigateStack(home, ROUTES.WALLET);
  assert.equal(navigateStack(once, ROUTES.WALLET), once);
});

test('Hai truyện khác nhau vẫn đẩy được; chạm đúp cùng một truyện thì không nhân đôi', () => {
  const a = navigateStack(home, ROUTES.STORY, { storyId: 'a' });
  assert.equal(routesOf(navigateStack(a, ROUTES.STORY, { storyId: 'b' })), 'HOME>STORY>STORY');
  assert.equal(navigateStack(a, ROUTES.STORY, { storyId: 'a' }), a);
});

test('Tab được tô sáng: Ví thuộc Hồ sơ; còn lại theo tab gốc', () => {
  assert.equal(activeTabFor(home), ROUTES.HOME);
  assert.equal(activeTabFor(navigateStack(home, ROUTES.WALLET)), ROUTES.MORE);
  assert.equal(activeTabFor(navigateStack([{ route: ROUTES.MORE }], ROUTES.WALLET)), ROUTES.MORE);
  assert.equal(activeTabFor(navigateStack([{ route: ROUTES.LIBRARY }], ROUTES.STORY, { storyId: 'a' })), ROUTES.LIBRARY);
});

test('Back: màn con → màn trước; tab khác Trang chủ → Trang chủ; Trang chủ → hệ thống xử lý (thoát app)', () => {
  const wallet = navigateStack([{ route: ROUTES.MORE }], ROUTES.WALLET);
  assert.equal(routesOf(backStack(wallet)!), 'MORE'); // Ví mở từ Hồ sơ → Back về Hồ sơ
  assert.equal(routesOf(backStack([{ route: ROUTES.MORE }])!), 'HOME'); // Hồ sơ là tab: Back về Trang chủ
  assert.equal(routesOf(backStack([{ route: ROUTES.LIBRARY }])!), 'HOME');
  assert.equal(backStack(home), null);
});

const read = (rel: string) => readFileSync(join(process.cwd(), 'src', rel), 'utf8');

test('Ví & Credit vẫn truy cập được: pill credit ở header và mục trong Hồ sơ', () => {
  const tabs = read('navigation/ParentTabs.tsx');
  assert.match(tabs, /onOpenWallet=\{openWallet\}/);
  assert.match(tabs, /key: 'wallet'.*onPress: openWallet/);
  assert.doesNotMatch(read('components/parent/HeyTabBar.tsx'), /ROUTES\.WALLET/);
});

test('Header: số dư lấy từ currentUser.creditBalance (thiếu thì "—"), không hard-code', () => {
  const bar = read('components/parent/HeyTopBar.tsx');
  assert.match(bar, /currentUser\?\.creditBalance/);
  assert.match(bar, /balance == null \? '—'/);
  assert.match(bar, /\{balance == null \? '—' : String\(balance\)\}/); // chỉ hiển thị đúng giá trị BE trả
});

test('Tab bar & header không dùng emoji/hex cứng làm icon điều hướng', () => {
  for (const f of ['components/parent/HeyTabBar.tsx', 'components/parent/HeyTopBar.tsx']) {
    const src = read(f);
    assert.doesNotMatch(src, /#[0-9A-Fa-f]{6}\b/, `${f} còn mã hex cứng`);
    assert.doesNotMatch(src, /[\u{1F300}-\u{1FAFF}]/u, `${f} còn emoji`);
  }
});

test('Toast nằm ở đáy (không che header) và chừa chỗ cho thanh tab', () => {
  const toast = read('components/ui/Toast.tsx');
  const host = toast.match(/host: \{[^}]*\}/)?.[0] ?? '';
  assert.match(host, /bottom: 0/);
  assert.doesNotMatch(host, /top: 0/);
  assert.match(read('navigation/ParentTabs.tsx'), /useToastBottomInset\(/);
  // Khoảng chừa phải dời host (bottom), không dùng margin: vùng margin nằm trong phần tử nhận chạm và sẽ chặn thanh tab
  assert.match(toast, /styles\.host, \{ bottom: Spacing\.sm \+ bottomInset \}/);
  assert.doesNotMatch(toast, /marginBottom: Spacing\.sm \+ bottomInset/);
});

console.log(`OK ${passed}/${passed}`);
