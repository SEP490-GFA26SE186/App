// apps/mobile/tests/wizard.test.ts
// R6: ràng buộc của Story Wizard, kiểm bằng quét mã nguồn (không render, không gọi BE, không tốn credit). Chạy từ apps/mobile: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const files = ['screens/parent/StoryWizard.tsx', 'components/parent/GenerationPanel.tsx', 'components/parent/GenerationRunner.tsx', 'components/parent/CharacterFormSheet.tsx'];

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log('PASS', name);
};

test('Không hex cứng, không emoji làm icon chức năng, không TouchableOpacity trong Wizard', () => {
  for (const f of files) {
    const code = noComments(read(f));
    assert.doesNotMatch(code, /#[0-9A-Fa-f]{6}\b/, `${f} còn mã hex cứng`);
    assert.doesNotMatch(code, /TouchableOpacity/, `${f} còn TouchableOpacity`);
    assert.doesNotMatch(code, /⚠|⏳|🪄|🔎|☑|☐|⭐|➕|←/, `${f} còn emoji/ký tự làm icon chức năng`);
  }
});

test('Giữ nguyên lời gọi BE và payload: pricing, analyze, createStory (analysisToken, scored), generate/poll', () => {
  const w = noComments(read('screens/parent/StoryWizard.tsx'));
  for (const call of ['.getAiPricing()', 'storyService.analyze(', 'storyService.createStory(', 'analysisToken: analysis.analysisToken', 'scored: true', "entry: 'topic'", "entry: 'family'"]) {
    assert.ok(w.includes(call), `thiếu ${call}`);
  }
  const r = noComments(read('components/parent/GenerationRunner.tsx'));
  assert.ok(r.includes('storyService.startGeneration(') && r.includes('storyService.getGeneration('));
});

test('Quy tắc kiểm tra `missing` vẫn đủ (thứ tự nhân vật chính đứng đầu, 402/429 giữ nguyên)', () => {
  const w = read('screens/parent/StoryWizard.tsx');
  for (const msg of ['Ba mẹ chọn một lối vào nhé', 'Ba mẹ chọn một chuyện mẫu nhé', 'Ba mẹ chọn ít nhất một nhân vật nhé', 'Ba mẹ đặt tên cho truyện nhé', 'Tên truyện tối đa 200 ký tự']) assert.ok(w.includes(msg), msg);
  assert.match(w, /\[mainId as string, \.\.\.selected\.filter/);
  assert.match(w, /err\?\.status === 429/);
  assert.match(read('components/parent/GenerationRunner.tsx'), /e\?\.status === 402/);
});

test('Chi phí lấy từ BE (pricing), không hard-code số credit; không có tiến độ/timer giả khi AI viết', () => {
  const w = noComments(read('screens/parent/StoryWizard.tsx'));
  assert.match(w, /pricing\?\.lengths\.find/);
  assert.doesNotMatch(w, /\b(credits?|credit)\s*[:=]\s*\d+/i);
  const panel = noComments(read('components/parent/GenerationPanel.tsx'));
  assert.doesNotMatch(panel, /setInterval|HeyProgressBar|\d+\s*%/);
  assert.match(panel, /state="thinking"/);
});

test('Stepper: thanh tiến độ có nhãn "Bước n trên N", chân trang cố định, lựa chọn là radio/checkbox ≥ 44pt', () => {
  const w = read('screens/parent/StoryWizard.tsx');
  assert.match(w, /Bước \$\{step \+ 1\} trên \$\{STEPS\.length\}/);
  assert.match(w, /accessibilityRole="progressbar"/);
  assert.match(w, /styles\.footer/);
  assert.match(w, /accessibilityRole="radio"/);
  assert.match(w, /accessibilityRole="checkbox"/);
  assert.match(w, /minHeight: Touch\.min/);
  assert.match(w, /star: \{ width: Touch\.min, height: Touch\.min/);
});

test('Android Back ở bước 2–3 quay về bước trước (BackHandler), bước 1/đang viết để điều hướng chung xử lý', () => {
  const w = noComments(read('screens/parent/StoryWizard.tsx'));
  assert.match(w, /BackHandler\.addEventListener\('hardwareBackPress'/);
  assert.match(w, /if \(step === 0 \|\| generating\) return;/);
});

console.log(`OK ${passed}/${passed}`);
