// apps/mobile/tests/phase1.test.ts
// Phase 1 (Child Profile & Bookshelf): mỗi endpoint có lời gọi thật từ màn đang dùng, đúng method/path; hàm ngày giờ VN.
// Quét mã nguồn + hàm thuần — không render, không gọi BE, không chạm luồng AI/trả phí.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readingTimeLabel, vnDateDaysAgo } from '../src/utils/child';

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log('PASS', name);
};

test('Service: đúng path/method của 7 endpoint (avatar chưa nối)', () => {
  const child = noComments(read('services/childService.ts'));
  assert.match(child, /`\/children\/\$\{childId\}`\)/);
  assert.match(child, /`\/children\/\$\{childId\}\/usage\$\{query\}`/);
  assert.match(child, /`\/children\/\$\{childId\}\/eq-journey\?weeks=\$\{weeks\}`/);
  assert.match(child, /`\/children\/\$\{childId\}\/bookshelf\?\$\{query\}`/);
  assert.doesNotMatch(child, /\/avatar/, 'PUT /children/:id/avatar đang BLOCKED');
  const story = noComments(read('services/storyService.ts'));
  assert.match(story, /`\/bookshelf\?\$\{query\}`, \{ raw: true \}/);
  assert.match(story, /`\/bookshelf\/check\/\$\{storyId\}`/);
  assert.match(story, /`\/bookshelf\/\$\{storyId\}\?childId=\$\{childId\}`, \{ method: 'DELETE' \}/);
});

test('Màn hình: mỗi endpoint có lời gọi từ UI đang dùng', () => {
  const must: Record<string, string[]> = {
    'screens/parent/ChildDetailScreen.tsx': ['childService.getChild(', 'childService.getChildUsage(', 'childService.getChildBookshelf('],
    'screens/parent/EqReportScreen.tsx': ['childService.getChildEqJourney(', 'childService.getChildEqReport('],
    'components/parent/ChildShelfPanel.tsx': ['storyService.getBookshelf(', 'storyService.removeFromShelf(', 'dialog.confirm('],
    'screens/parent/StoryDetailScreen.tsx': ['storyService.checkShelf(', 'storyService.removeFromShelf(', 'storyService.addToShelf(', 'dialog.confirm('],
    'screens/parent/LibraryScreen.tsx': ['<ChildShelfPanel'],
    'screens/parent/ChildrenScreen.tsx': ['onOpenDetail(c)'],
    'navigation/ParentTabs.tsx': ['<ChildDetailScreen', 'ROUTES.CHILD_DETAIL', "view: 'shelf'"],
  };
  for (const [f, calls] of Object.entries(must)) {
    const code = noComments(read(f));
    for (const c of calls) assert.ok(code.includes(c), `${f} thiếu ${c}`);
  }
});

test('Phase 1 không đụng luồng AI/trả phí', () => {
  for (const f of ['screens/parent/ChildDetailScreen.tsx', 'components/parent/ChildShelfPanel.tsx', 'components/parent/ShelfItemRow.tsx']) {
    assert.doesNotMatch(noComments(read(f)), /generat|portrait\w*\(|narration|billingService|createStory|analyze/i, f);
  }
});

test('Ngày giờ VN cho /usage: UTC+7, lùi theo ngày', () => {
  const t = Date.parse('2026-10-28T18:30:00Z'); // 01:30 ngày 29/10 giờ VN
  assert.equal(vnDateDaysAgo(0, t), '2026-10-29');
  assert.equal(vnDateDaysAgo(1, t), '2026-10-28');
  assert.equal(vnDateDaysAgo(6, t), '2026-10-23');
  assert.equal(readingTimeLabel(0), '0 phút');
  assert.equal(readingTimeLabel(30), 'Dưới 1 phút');
  assert.equal(readingTimeLabel(150), '3 phút');
});

console.log(`OK ${passed}/${passed}`);
