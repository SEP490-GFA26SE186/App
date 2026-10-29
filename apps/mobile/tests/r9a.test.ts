// apps/mobile/tests/r9a.test.ts
// R9-A: ràng buộc hồi quy cho các lỗi đã sửa ở đợt hoàn thiện (hộp thoại Web, vùng chạm Web, Space cho radio, giới hạn bề rộng, J1 còn sót). Quét mã nguồn.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') || p.endsWith('.ts') ? [p] : [];
  });

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log('PASS', name);
};

test('Không còn Alert.alert ngoài Dialog.tsx (react-native-web cài Alert.alert rỗng → im lặng trên Web)', () => {
  for (const f of walk(src)) {
    if (f.endsWith('Dialog.tsx')) continue;
    assert.doesNotMatch(noComments(readFileSync(f, 'utf8')), /\bAlert\.alert\(/, `${f} còn Alert.alert`);
  }
});

test('Dialog: Web dùng lớp phủ trong cây (không <Modal>), Esc = Hủy, giữ focus, inert nền, resolve đúng một lần; native dùng Alert', () => {
  const d = noComments(read('components/ui/Dialog.tsx'));
  assert.doesNotMatch(d, /<Modal\b/);
  assert.match(d, /e\.key === 'Escape'\) finish\(false\)/);
  assert.match(d, /setAttribute\('inert', ''\)/);
  assert.match(d, /if \(done\.current\) return;/);
  assert.match(d, /Platform\.OS === 'web'/);
  assert.match(d, /Alert\.alert\(/);
  assert.match(d, /onDismiss: \(\) => resolve\(false\)/); // Back/chạm ngoài trên Android = Hủy
  assert.match(d, /<WebDialog key=\{current\.id\}/); // hộp kế tiếp trong hàng đợi mount mới, không kẹt cờ `done` của hộp trước
  assert.match(read('../App.tsx'), /<DialogProvider>/);
});

test('Xóa bé/nhân vật chỉ gọi BE sau khi xác nhận (confirm → if (!ok) return) và vẫn chặn bấm đúp', () => {
  for (const [f, call] of [['screens/parent/ChildrenScreen.tsx', 'childService.deleteChild('], ['screens/parent/CharactersScreen.tsx', 'characterService.deleteCharacter(']] as const) {
    const code = noComments(read(f));
    const iConfirm = code.indexOf('dialog.confirm(');
    const iReturn = code.indexOf('if (!ok) return;');
    const iDelete = code.indexOf(call);
    assert.ok(iConfirm > -1 && iConfirm < iReturn && iReturn < iDelete, `${f}: thứ tự confirm → return → delete sai`);
    assert.match(code, /destructive: true/);
    assert.match(code, /if \(deletingId\) return;/);
  }
});

test('Vùng chạm Web: nút sm và chip cao 44 trên Web (hitSlop không có tác dụng trên Web)', () => {
  assert.match(read('components/ui/HeyButton.tsx'), /sm: \{ minHeight: Platform\.OS === 'web' \? Touch\.min : 36/);
  assert.match(read('components/ui/HeyChip.tsx'), /CHIP_HEIGHT = Platform\.OS === 'web' \? 44 : 36/);
});

test('Space kích hoạt radio/checkbox trên Web: chip, segmented Tủ truyện, lựa chọn/segment/nhân vật ở Wizard', () => {
  assert.match(read('utils/keyboard.ts'), /e\.key === ' '/);
  assert.match(read('components/ui/HeyChip.tsx'), /spaceActivates\(onPress\)/);
  assert.match(read('screens/parent/LibraryScreen.tsx'), /spaceActivates\(\(\) => setFilter/);
  const w = read('screens/parent/StoryWizard.tsx');
  assert.ok([...w.matchAll(/spaceActivates\(/g)].length >= 4, 'Wizard thiếu spaceActivates');
});

test('Bề rộng nội dung Parent giới hạn 720 (Layout.maxContentWidth) và số cột theo bề rộng nội dung', () => {
  assert.match(read('navigation/ParentTabs.tsx'), /main: \{[^}]*maxWidth: Layout\.maxContentWidth/);
  assert.match(read('screens/parent/LibraryScreen.tsx'), /columnsFor\(Math\.min\(width, Layout\.maxContentWidth\)\)/);
  assert.match(read('screens/parent/CharactersScreen.tsx'), /Math\.min\(windowWidth, Layout\.maxContentWidth\)/);
});

test('J1: AuthModal (legacy, không được mount) đã xóa — không còn file nào import', () => {
  assert.ok(!existsSync(join(src, 'components/auth/AuthModal.tsx')));
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
  for (const f of walk(src).filter((p) => /\.tsx?$/.test(p))) assert.doesNotMatch(readFileSync(f, 'utf8'), /AuthModal/, f);
});

console.log(`OK ${passed}/${passed}`);
