// apps/mobile/tests/webParity.test.ts
// Đợt khớp Web 2026-11-27 (#3–#5): giọng đọc của bé, "Tạo truyện" từ gợi ý Hành trình EQ, giới hạn nhân vật theo gói.
// Quét mã nguồn + hàm thuần; không render, không gọi BE.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { VOICES, voiceLabel } from '../src/constants/voices';

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log('PASS', name);
};

test('#3 Giọng đọc: danh sách khớp Web, nhãn tiếng Việt, giá trị lạ hiện nguyên văn', () => {
  assert.deepEqual(VOICES.map((v) => v.value), ['vi-north-female', 'vi-north-male', 'vi-south-female', 'vi-south-male']);
  assert.equal(voiceLabel('vi-south-male'), 'Giọng nam miền Nam');
  assert.equal(voiceLabel('vi-new'), 'vi-new');
  assert.equal(voiceLabel(null), null);
  const form = read('components/parent/ChildFormSheet.tsx');
  assert.match(form, /voiceChanged && \{ preferredVoice: voice \|\| null \}/, 'chỉ gửi khi đổi; về mặc định = null');
  assert.match(read('services/childService.ts'), /preferredVoice: raw\.preferredVoice \?\? undefined/);
});

test('#4 Hành trình EQ: "Tạo truyện" mở Wizard lối Chuyện mẫu đã chọn sẵn', () => {
  assert.match(read('screens/parent/EqReportScreen.tsx'), /onPress=\{\(\) => onCreateFromTopic\(r\.id\)\}/);
  const tabs = read('navigation/ParentTabs.tsx');
  assert.match(tabs, /navigate\(ROUTES\.CREATE, \{ topicId \}\)/);
  assert.match(tabs, /key=\{nav\.current\.params\?\.topicId \?\? 'new'\}/, 'đổi chuyện mẫu thì Wizard mới');
  const w = read('screens/parent/StoryWizard.tsx');
  assert.match(w, /useState<StoryEntry \| null>\(initialTopicId \? 'topic' : null\)/);
});

test('#5 Nhân vật: giới hạn theo gói từ GET /subscriptions/me, đủ thì khoá nút + lối nâng gói', () => {
  const c = read('screens/parent/CharactersScreen.tsx');
  assert.match(c, /billingService\.getSubscription\(\)/);
  assert.match(c, /const full = limit != null && characters\.length >= limit;/);
  assert.match(c, /disabled=\{full\}/);
  assert.match(c, /onPress=\{onOpenWallet\}/);
});

console.log(`OK ${passed}/${passed}`);
