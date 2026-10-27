// apps/mobile/tests/library.test.ts
// R7: ràng buộc của Tủ truyện, Chi tiết truyện và Trình đọc phụ huynh, kiểm bằng quét mã nguồn (không render, không gọi BE).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const files = ['screens/parent/LibraryScreen.tsx', 'screens/parent/StoryDetailScreen.tsx', 'components/parent/StoryReaderModal.tsx'];

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log('PASS', name);
};

// Tương phản WCAG từ chính giá trị token trong theme/colors.ts
const colors = read('theme/colors.ts');
const hex = (name: string): string => {
  const direct = colors.match(new RegExp(String.raw`\b${name}:\s*'(#[0-9A-Fa-f]{6})'`));
  if (direct) return direct[1];
  const alias = colors.match(new RegExp(String.raw`\b${name}:\s*Palette\.(\w+)`));
  assert.ok(alias, `không tìm thấy token ${name}`);
  return hex(alias![1]);
};
const lum = (h: string) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

test('Không hex cứng, không emoji/ký tự làm icon, không TouchableOpacity trong Tủ truyện, Chi tiết, Trình đọc', () => {
  for (const f of files) {
    const code = noComments(read(f));
    assert.doesNotMatch(code, /#[0-9A-Fa-f]{6}\b/, `${f} còn mã hex cứng`);
    assert.doesNotMatch(code, /TouchableOpacity/, `${f} còn TouchableOpacity`);
    assert.doesNotMatch(code, /⭐|🪄|📖|✏️|✅|⏳|📚|ℹ️|🔒|🔊|⏹|🌟|✕|←|→/, `${f} còn emoji/ký tự làm icon chức năng`);
  }
});

test('Trình đọc không dùng <Modal> (CRIT-1), Android Back đóng trình đọc, không ghi tiến độ lên BE', () => {
  const code = noComments(read('components/parent/StoryReaderModal.tsx'));
  assert.doesNotMatch(code, /<Modal\b|import[^;]*\bModal\b[^;]*from 'react-native'/);
  assert.match(code, /BackHandler\.addEventListener\('hardwareBackPress'/);
  assert.doesNotMatch(code, /Service|apiFetch|fetch\(/, 'Trình đọc phụ huynh không được gọi API');
});

test('Khi đọc, thanh tab ẩn và lớp phủ nổi trên Android (elevation) để nút trang/nghe đọc không bị che', () => {
  const tabs = read('navigation/ParentTabs.tsx');
  assert.match(tabs, /const tabBarVisible = [^;]*!selectedStoryToRead;/);
  assert.match(read('components/parent/StoryReaderModal.tsx'), /overlay: \{[^}]*elevation: 24/);
});

test('B1: tương phản thật của các cặp màu trong Trình đọc ≥ 4.5:1 (nút "Dừng đọc", nhãn chủ đề, chữ trên giấy)', () => {
  assert.ok(ratio(hex('onStrong'), hex('brandStrong')) >= 4.5, 'chữ trắng trên brandStrong');
  assert.ok(ratio(hex('brandStrong'), hex('surfaceWarm')) >= 4.5, 'brandStrong trên giấy');
  assert.ok(ratio(hex('text'), hex('surfaceWarm')) >= 4.5, 'chữ navy trên giấy');
  assert.ok(ratio(hex('onStrong'), hex('tealStrong')) >= 4.5, 'mũi tên trắng trên tealStrong');
  // Cặp cũ bị audit B1 chê: trắng trên primary (cam) < 3:1
  assert.ok(ratio('#FFFFFF', hex('primary')) < 3);
  const reader = read('components/parent/StoryReaderModal.tsx');
  assert.match(reader, /audioBtnActive: \{ backgroundColor: Colors\.brandStrong/);
  assert.match(reader, /audioTextActive: \{ color: Colors\.onStrong/);
});

test('Trình đọc: chỉnh cỡ chữ, điều khiển ẩn/hiện (trình đọc màn hình luôn thấy), nút trang ≥ 44pt, tranh 4:3', () => {
  const r = read('components/parent/StoryReaderModal.tsx');
  assert.match(r, /FONT_SIZES = \[18, 20, 24, 28\]/);
  assert.match(r, /screenReaderChanged/);
  assert.match(r, /controlsShown \|\| screenReader/);
  assert.match(r, /navBtn: \{ width: 56, height: 56/);
  assert.match(r, /iconBtn: \{ width: Touch\.min, height: Touch\.min/);
  assert.match(r, /aspectRatio: 4 \/ 3/);
});

test('Tủ truyện: lưới theo bề ngang, bộ lọc segmented dùng STORY_FILTERS, "Thêm vào tủ sách" nằm trong menu thẻ và vẫn gọi onAddToShelf', () => {
  const l = noComments(read('screens/parent/LibraryScreen.tsx'));
  assert.match(l, /useWindowDimensions/);
  assert.match(l, /STORY_FILTERS\.map/);
  assert.match(l, /accessibilityRole="radiogroup"/);
  assert.match(l, /onAddToShelf\(s\)/);
  assert.match(l, /onOpenStory\(item\)/);
  assert.match(l, /<Sheet\b/);
  assert.doesNotMatch(l, /<HeyButton title="Thêm vào tủ sách bé"/, 'không lặp nút trên mọi thẻ');
  assert.match(l, /moreBtn: \{ width: Touch\.min, height: Touch\.min/);
});

test('Chi tiết truyện: giữ nguyên hành động và lời gọi BE (xem lại, thêm vào tủ sách, đọc thử, cho AI viết)', () => {
  const d = noComments(read('screens/parent/StoryDetailScreen.tsx'));
  for (const call of ['storyService.getStory(', 'storyService.reviewStory(', 'storyService.addToShelf(', 'onRead(story)', "setRunner('start')", "onUnsupported('Chỉnh sửa chữ từng trang')", 'e?.status === 422']) {
    assert.ok(d.includes(call), `thiếu ${call}`);
  }
});

console.log(`OK ${passed}/${passed}`);
