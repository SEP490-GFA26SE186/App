// apps/mobile/tests/manage.test.ts
// R8: ràng buộc của EQ, Ví/Credit, Bé nhà mình, Nhân vật, Cài đặt, Trợ giúp — kiểm bằng quét mã nguồn (không render, không gọi BE, không thanh toán).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const screens = ['EqReportScreen', 'WalletScreen', 'ChildrenScreen', 'CharactersScreen', 'SettingsScreen', 'HelpScreen'].map((n) => `screens/parent/${n}.tsx`);
const files = [...screens, 'components/parent/ChildFormSheet.tsx', 'components/parent/CharacterFormSheet.tsx', 'constants/eq.ts'];

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log('PASS', name);
};

test('Không hex cứng, không emoji/ký tự làm icon chức năng, không TouchableOpacity', () => {
  for (const f of files) {
    const code = noComments(read(f));
    assert.doesNotMatch(code, /#[0-9A-Fa-f]{6}\b/, `${f} còn mã hex cứng`);
    assert.doesNotMatch(code, /TouchableOpacity/, `${f} còn TouchableOpacity`);
    assert.doesNotMatch(code, /⚠|⏳|🔑|🔒|🚪|✓|➕|✏️|🗑️|👶|👨|💎|🔄|▾|▸/, `${f} còn emoji/ký tự làm icon chức năng`);
  }
});

test('Giữ nguyên lời gọi BE: xóa/sửa bé và nhân vật, báo cáo EQ, gói/credit, đổi mật khẩu, PIN qua BE', () => {
  const must: Record<string, string[]> = {
    'screens/parent/ChildrenScreen.tsx': ['childService.deleteChild(', 'onOpenKidMode(c)', 'onSelect(c.id)', 'dialog.confirm('],
    'screens/parent/CharactersScreen.tsx': ['characterService.deleteCharacter(', '!c.childId', 'dialog.confirm('],
    'screens/parent/EqReportScreen.tsx': ['childService.getChildEqReport('],
    'screens/parent/WalletScreen.tsx': ['billingService.getSubscription()', 'billingService.getPlans()', 'billingService.getCreditHistory('],
    'screens/parent/SettingsScreen.tsx': ['authService.changePassword(', 'authService.changeKidPin(', 'authService.setKidPin(', "kidModePinHash: '****'"],
  };
  for (const [f, calls] of Object.entries(must)) {
    const code = noComments(read(f));
    for (const c of calls) assert.ok(code.includes(c), `${f} thiếu ${c}`);
  }
});

test('Ví chỉ xem: không gọi thanh toán/nạp/nâng gói; EQ không tự tính điểm/số liệu', () => {
  const w = noComments(read('screens/parent/WalletScreen.tsx'));
  assert.doesNotMatch(w, /billingService\.(create|pay|purchase|checkout|topup|upgrade|subscribe)/i);
  const eq = noComments(read('screens/parent/EqReportScreen.tsx'));
  assert.doesNotMatch(eq, /Math\.random|\bscore\b|%/, 'EQ chỉ hiện mức BE trả');
  assert.match(eq, /competencies\.filter\(\(c\) => c\.level != null\)\.length/); // chỉ đếm từ dữ liệu BE
});

test('Cài đặt (J1): địa chỉ máy chủ chỉ hiện khi __DEV__; PIN không lưu ở client', () => {
  const s = noComments(read('screens/parent/SettingsScreen.tsx'));
  assert.match(s, /: __DEV__\s*\?/);
  assert.equal([...s.matchAll(/\$\{apiBaseUrl\}/g)].length, 1, 'apiBaseUrl chỉ render đúng một chỗ (nhánh __DEV__)');
  assert.doesNotMatch(s, /AsyncStorage|localStorage|setItem\(/);
});

test('A11y: thanh mức EQ là progressbar có nhãn; hàng FAQ có expanded; nút trong thẻ có nhãn theo tên; vùng chạm ≥ 44pt', () => {
  assert.match(read('screens/parent/EqReportScreen.tsx'), /accessibilityRole="progressbar"/);
  assert.match(read('screens/parent/EqReportScreen.tsx'), /mức \$\{filled\} trên 3/);
  const h = read('screens/parent/HelpScreen.tsx');
  assert.match(h, /accessibilityState=\{\{ expanded: open \}\}/);
  assert.match(h, /minHeight: Touch\.min/);
  assert.match(read('screens/parent/CharactersScreen.tsx'), /accessibilityLabel=\{`Xóa nhân vật \$\{c\.name\}`\}/);
  assert.match(read('screens/parent/ChildrenScreen.tsx'), /accessibilityLabel=\{`Vào Chế độ Bé của \$\{c\.name\}`\}/);
});

test('Ví: số âm/dương có dấu (không chỉ dựa vào màu) và lịch sử nhóm theo ngày; Nhân vật: lưới theo bề ngang', () => {
  const w = read('screens/parent/WalletScreen.tsx');
  assert.match(w, /e\.amount > 0 \? `\+\$\{e\.amount\}` : e\.amount/);
  assert.match(w, /groups/);
  assert.match(read('screens/parent/CharactersScreen.tsx'), /useWindowDimensions/);
});

test('Không có <Modal> mới; Kid PIN overlay không bị đụng', () => {
  for (const f of screens) assert.doesNotMatch(noComments(read(f)), /<Modal\b/, `${f} dùng Modal`);
});

console.log(`OK ${passed}/${passed}`);
