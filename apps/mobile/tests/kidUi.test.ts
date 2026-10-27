// apps/mobile/tests/kidUi.test.ts
// R4: ràng buộc của giao diện Kid Mode, kiểm bằng quét mã nguồn (không render, không dependency). Chạy từ apps/mobile: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const kidFiles = [
  'screens/kid/KidModeScreen.tsx',
  ...readdirSync(join(src, 'components/kid')).filter((f) => f.endsWith('.tsx')).map((f) => `components/kid/${f}`),
];

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log('PASS', name);
};

test('Kid Mode không dùng <Modal> (CRIT-1: Modal bị kẹt 0×0 trên Android New Arch) và không dùng Reanimated', () => {
  for (const f of kidFiles) {
    const code = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); // bỏ comment (khối và dòng)
    assert.doesNotMatch(code, /<Modal\b|\bModal,|import[^;]*\bModal\b[^;]*from 'react-native'/, `${f} dùng Modal`);
    assert.doesNotMatch(code, /react-native-reanimated/, `${f} dùng Reanimated`);
  }
});

test('Không còn mã hex cứng trong giao diện Kid (dùng token theme)', () => {
  for (const f of kidFiles) assert.doesNotMatch(read(f), /#[0-9A-Fa-f]{6}\b/, `${f} còn mã hex cứng`);
});

test('Khoá PIN: phím có nhãn trợ năng; nhãn không bao giờ chứa mã PIN đã nhập; logic PIN không nằm trong component hiển thị', () => {
  const overlay = read('components/kid/KidPinOverlay.tsx');
  for (const label of ['Xóa hết', 'Xóa số vừa nhập', 'Số 0', '`Số ${d}`', '`Đã nhập ${pin.length} số`']) assert.ok(overlay.includes(label), `thiếu nhãn ${label}`);
  assert.doesNotMatch(overlay, /accessibilityLabel=\{[^}]*\bpin\b(?!\.length)/, 'nhãn trợ năng không được chứa chính mã PIN');
  assert.doesNotMatch(overlay, /onExitKidMode|authService|apiFetch|kidService/, 'overlay chỉ hiển thị, không gọi BE');
  const screen = read('screens/kid/KidModeScreen.tsx');
  assert.match(screen, /await onExitKidMode\(pin\)/); // PIN chỉ được xác minh qua BE (onExitKidMode)
  assert.match(screen, /<KidPinOverlay/);
});

test('Nút thoát Kid Mode và Back của Android vẫn đi qua khoá PIN', () => {
  const screen = read('screens/kid/KidModeScreen.tsx');
  assert.match(screen, /setShowPinModal\(true\)/);
  assert.match(screen, /BackHandler\.addEventListener\('hardwareBackPress'/);
  assert.match(screen, /if \(preview\) return;/); // chỉ UI Preview (dev) mới bỏ qua khoá
});

test('Nút/vùng chạm của Kid dùng kích thước Kid (>= 56pt): nút trang, "Bỏ qua", phím cảm xúc', () => {
  assert.match(read('components/kid/KidReader.tsx'), /navBtn: \{ minHeight: Touch\.kidLarge \}/);
  assert.match(read('components/kid/KidCheckpointCard.tsx'), /skip: \{[^}]*minHeight: Touch\.kid/);
  assert.match(read('components/kid/KidCheckpointCard.tsx'), /emotionBtn: \{[^}]*minHeight: 88/);
});

console.log(`OK ${passed}/${passed}`);
