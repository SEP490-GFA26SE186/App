// apps/mobile/tests/homeAuth.test.ts
// R5: ràng buộc của Parent Home, mascot và Đăng nhập/Đăng ký, kiểm bằng quét mã nguồn (không render, không dependency).
// Chạy từ apps/mobile: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log('PASS', name);
};

test('A2: lời gợi ý của mascot không còn số liệu bịa hay nút không tồn tại', () => {
  const tips = noComments(read('components/CuteMascot.tsx'));
  assert.doesNotMatch(tips, /12 ⭐|Sáng Tác AI/);
  assert.doesNotMatch(tips, /\d+\s*(⭐|sao)/); // không có con số thành tích nào
});

test('A3: chạm cú không phát tiếng cún; không còn huy hiệu cấp độ bịa', () => {
  for (const f of ['components/OwlMascot.tsx', 'components/CuteMascot.tsx', 'screens/parent/ParentHomeScreen.tsx']) {
    assert.doesNotMatch(noComments(read(f)), /playPuppy/, `${f} còn playPuppy`);
  }
  assert.doesNotMatch(noComments(read('components/OwlMascot.tsx')), /Lv\.\s*1/);
});

test('J1: địa chỉ máy chủ trên màn Đăng nhập chỉ hiện khi __DEV__', () => {
  const login = read('screens/auth/LoginScreen.tsx');
  assert.match(login, /__DEV__ && !!apiBaseUrl/);
  const shown = [...login.matchAll(/\{apiBaseUrl\}/g)].length;
  assert.equal(shown, 1, 'apiBaseUrl chỉ được render đúng một chỗ (trong nhánh __DEV__)');
});

test('Home/Đăng nhập/Đăng ký không còn hex cứng; link và nút >= 44pt, có focus ring', () => {
  for (const f of [
    'screens/parent/ParentHomeScreen.tsx',
    'components/parent/ChildHeroCard.tsx',
    'components/CuteMascot.tsx',
    'components/OwlMascot.tsx',
    'screens/auth/LoginScreen.tsx',
    'screens/auth/RegisterScreen.tsx',
    'screens/auth/BootScreen.tsx',
  ]) {
    assert.doesNotMatch(noComments(read(f)), /#[0-9A-Fa-f]{6}\b/, `${f} còn mã hex cứng`);
  }
  for (const f of ['screens/auth/LoginScreen.tsx', 'screens/auth/RegisterScreen.tsx']) {
    const code = read(f);
    assert.doesNotMatch(code, /TouchableOpacity/, `${f} còn TouchableOpacity`);
    assert.match(code, /focusRing\(/);
    assert.match(code, /minHeight: Touch\.min/);
  }
});

test('Đăng nhập/Đăng ký gửi bằng Enter ở ô cuối', () => {
  assert.match(read('screens/auth/LoginScreen.tsx'), /onSubmitEditing=\{handleLogin\}/);
  assert.match(read('screens/auth/RegisterScreen.tsx'), /onSubmitEditing=\{handleRegister\}/);
});

test('Parent Home: số liệu hero lấy từ overview BE, giữ đủ lối vào (Kid Mode, Tủ truyện, EQ, Sáng tác)', () => {
  const home = read('screens/parent/ParentHomeScreen.tsx');
  assert.match(home, /childService\.getChildOverview/);
  for (const cb of ['onOpenKidMode', 'onOpenLibrary', 'onOpenEq', 'onStartStoryWizard', 'onOpenChildren', 'onOpenStory', 'onSelectChild']) {
    assert.match(home, new RegExp(`\\b${cb}\\b`), `thiếu ${cb}`);
  }
  assert.match(read('components/parent/ChildHeroCard.tsx'), /todayUsage\.usedMinutes/);
});

console.log(`OK ${passed}/${passed}`);
