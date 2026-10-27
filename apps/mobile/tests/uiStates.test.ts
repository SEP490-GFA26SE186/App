// apps/mobile/tests/uiStates.test.ts
// Chặn tái diễn QA_R2 MED-1 / MED-2 bằng cách quét mã nguồn (không render, không cần dependency). Chạy: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Chạy từ apps/mobile (như tests/README.md)
const root = join(process.cwd(), 'src');

const tsxFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? tsxFiles(p) : p.endsWith('.tsx') ? [p] : [];
  });

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log('PASS', name);
};

test('MED-1: StateView có tiêu đề báo lỗi tải phải dùng variant="error"', () => {
  const wrong: string[] = [];
  let errorCount = 0;
  for (const file of tsxFiles(join(root, 'screens')).concat(tsxFiles(join(root, 'components')))) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/<StateView\b([\s\S]*?)\/>/g)) {
      const variant = m[1].match(/variant="(\w+)"/)?.[1];
      const title = m[1].match(/title="([^"]*)"/)?.[1] ?? '';
      if (/tải được|không tải|lỗi/i.test(title)) {
        if (variant === 'error') errorCount += 1;
        else wrong.push(`${file.slice(root.length)}: "${title}" dùng variant="${variant}"`);
      }
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
  assert.ok(errorCount >= 6, `chỉ thấy ${errorCount} trạng thái lỗi dùng variant="error" (mong đợi >= 6)`);
});

test('MED-2: Toast có vùng live mount sẵn (status/polite + alert/assertive), bản nhìn thấy không phải live region', () => {
  const src = readFileSync(join(root, 'components', 'ui', 'Toast.tsx'), 'utf8');
  assert.match(src, /<View role="status" aria-live="polite"/);
  assert.match(src, /<View role="alert" aria-live="assertive"/);
  // Hai vùng nằm ngoài điều kiện `toast &&` (chỉ nội dung bên trong mới phụ thuộc toast)
  const regionsBlock = src.slice(src.indexOf("Platform.OS === 'web' && ("));
  assert.ok(regionsBlock.indexOf('role="status"') < regionsBlock.indexOf('{toast &&'), 'vùng status phải tồn tại trước nội dung');
  // Không còn live region trên toast nhìn thấy → không đọc hai lần
  assert.doesNotMatch(src, /accessibilityLiveRegion=/);
});

console.log(`OK ${passed}/2`);
