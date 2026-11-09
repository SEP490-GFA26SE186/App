// apps/mobile/tests/storyEditor.test.ts
// GĐ B1 – Sửa truyện + "Tự viết": đúng method/path/body cho các endpoint editor (fetch GIẢ, địa chỉ test.invalid — không gọi BE
// thật, không tốn credit), map lỗi 422 của review, luật điểm dừng phía client (theo BE editorRules), điểm dừng khoá không gửi PUT,
// "Tự viết" gửi length custom không có entry. Chạy: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { storyService } from '../src/services/storyService';
import { ApiError } from '../src/services/apiClient';
import {
  checkpointBody,
  checkpointFormError,
  checkpointTypesAfter,
  coverScenes,
  fillNames,
  firstGapPath,
  gapsByPath,
  initialCheckpointForm,
  isCheckpointLocked,
  isUnwrittenAiStory,
  reviewFailureSummary,
  warningsByPath,
} from '../src/utils/storyEditor';
import type { StoryCharacterRefDto, StoryCheckpointDto } from '../src/types/api';

type Call = { url: string; method: string; body: any };
let calls: Call[] = [];
const respond = (body: unknown, status = 200) => {
  calls = [];
  (globalThis as any).fetch = async (url: string, init: RequestInit = {}) => {
    calls.push({ url, method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  };
};
const last = () => calls[calls.length - 1];
const path = (c: Call) => c.url.replace(/^http:\/\/test\.invalid\/api\/v1/, '');
const storyBody = { success: true, data: { story: { id: 's1', title: 'T', status: 'draft', length: 'custom', pages: [], checkpoints: [] } } };

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const chars: StoryCharacterRefDto[] = [
  { token: '{NV1}', characterId: 'c1', name: 'Bin', isMain: true },
  { token: '{NV2}', characterId: 'c2', name: 'Mẹ', isMain: false },
];
const cp = (patch: Partial<StoryCheckpointDto>): StoryCheckpointDto => ({
  id: 'cp1', afterPageId: 'p2', afterPageOrder: 2, type: 'emotion_self', question: null, locked: false, options: [], ...patch,
});

const cases: [string, () => void | Promise<void>][] = [
  ['8 endpoint editor + review: đúng method / path / body, trả DTO truyện', async () => {
    const expect = async (run: () => Promise<unknown>, method: string, p: string, body?: unknown) => {
      respond(storyBody);
      const out: any = await run();
      assert.equal(out.id, 's1');
      assert.deepEqual([last().method, path(last()), last().body], [method, p, body]);
    };
    await expect(() => storyService.createPage('s1'), 'POST', '/stories/s1/pages', {});
    await expect(() => storyService.createPage('s1', 'Chữ'), 'POST', '/stories/s1/pages', { contentText: 'Chữ' });
    await expect(() => storyService.updatePage('s1', 'p1', 'Bin đi học'), 'PUT', '/stories/s1/pages/p1', { contentText: 'Bin đi học' });
    await expect(() => storyService.updatePage('s1', 'p1', null), 'PUT', '/stories/s1/pages/p1', { contentText: null });
    await expect(() => storyService.deletePage('s1', 'p1'), 'DELETE', '/stories/s1/pages/p1', undefined);
    await expect(() => storyService.createCheckpoint('s1', { type: 'perspective', afterPageId: 'p2', targetToken: '{NV2}' }), 'POST', '/stories/s1/checkpoints', { type: 'perspective', afterPageId: 'p2', targetToken: '{NV2}' });
    await expect(() => storyService.updateCheckpoint('s1', 'cp1', { question: 'Q', hint: 'H', answerEmotion: 'sad' }), 'PUT', '/stories/s1/checkpoints/cp1', { question: 'Q', hint: 'H', answerEmotion: 'sad' });
    await expect(() => storyService.deleteCheckpoint('s1', 'cp1'), 'DELETE', '/stories/s1/checkpoints/cp1', undefined);
    await expect(() => storyService.setCover('s1', 'sc1'), 'PUT', '/stories/s1/cover', { sceneId: 'sc1' });
    await expect(() => storyService.setCover('s1', null), 'PUT', '/stories/s1/cover', { sceneId: null });
    await expect(() => storyService.reviewStoryDetail('s1'), 'POST', '/stories/s1/review', undefined);
    await expect(() => storyService.getStoryDetail('s1'), 'GET', '/stories/s1', undefined);
  }],
  ['DELETE /stories/:id: BE không trả data vẫn là thành công; response editor sai hình dạng → lỗi, không thành công giả', async () => {
    respond({ success: true, message: 'Đã xoá truyện' });
    assert.equal(await storyService.deleteStory('s1'), true);
    assert.deepEqual([last().method, path(last())], ['DELETE', '/stories/s1']);
    respond({ success: true, data: {} });
    await assert.rejects(storyService.updatePage('s1', 'p1', 'x'), (e: unknown) => e instanceof ApiError);
  }],
  ['Review 422: errors[] → lỗi theo trang/điểm dừng, cuộn tới chỗ đầu tiên, câu tóm tắt', async () => {
    const errors = [
      { path: 'pages.p3', message: 'Trang 3 chưa có chữ' },
      { path: 'checkpoints.cp1', message: 'Điểm dừng sau trang 2 còn thiếu: question, hint' },
    ];
    respond({ success: false, message: 'Truyện còn chỗ chưa viết xong.', errors }, 422);
    let err: any;
    try {
      await storyService.reviewStoryDetail('s1');
    } catch (e) {
      err = e;
    }
    assert.ok(err instanceof ApiError && err.status === 422);
    assert.deepEqual(gapsByPath(err.errors), { 'pages.p3': 'Trang 3 chưa có chữ', 'checkpoints.cp1': 'Điểm dừng sau trang 2 còn thiếu: question, hint' });
    assert.equal(firstGapPath(err.errors), 'pages.p3');
    assert.equal(reviewFailureSummary(err.errors), 'Còn 2 chỗ chưa viết xong');
  }],
  ['Lỗi "Có từ không phù hợp" báo riêng; từ `warn` thành lời nhắc theo vị trí', () => {
    const errors = [
      { path: 'pages.p1', message: 'Có từ không phù hợp cho bé: “đánh”. Hãy diễn đạt khác.' },
      { path: 'pages.p2', message: 'Trang 2 chưa có chữ' },
    ];
    assert.equal(reviewFailureSummary(errors), 'Còn 1 chỗ có từ không phù hợp cho bé, ba mẹ sửa giúp nhé');
    assert.match(warningsByPath([{ path: 'pages.p1', keyword: 'ma', severity: 'warn' }])['pages.p1'], /Có từ nên cân nhắc với bé: “ma”/);
  }],
  ['Luật điểm dừng phía client giống BE checkCheckpointEdit', () => {
    const empty = { question: '', hint: '', answerEmotion: '', options: [] };
    assert.equal(checkpointFormError('emotion_self', { ...empty, question: 'Bin thấy sao?' }), 'Cần chọn cảm xúc đúng khi viết câu hỏi cảm xúc');
    assert.equal(checkpointFormError('emotion_other', { ...empty, question: 'Mẹ thấy sao?', answerEmotion: 'sad' }), '');
    assert.equal(checkpointFormError('emotion_self', empty), ''); // lưu nháp chữ trống được
    const three = (correct: boolean[]) => ({ ...empty, options: correct.map((isCorrect) => ({ text: 'x', isCorrect })) });
    assert.equal(checkpointFormError('perspective', three([false, false, false])), 'Cần đánh dấu đúng một phương án đúng');
    assert.equal(checkpointFormError('perspective', three([true, true, false])), 'Cần đánh dấu đúng một phương án đúng');
    assert.equal(checkpointFormError('perspective', three([false, true, false])), '');
    const roles = (r: any[]) => ({ ...empty, options: r.map((role) => ({ text: 'x', role, feedback: 'y' })) });
    assert.match(checkpointFormError('problem_solving', roles(['constructive', 'constructive', 'impulsive'])), /đủ ba vai/);
    assert.equal(checkpointFormError('problem_solving', roles(['constructive', 'avoidant', 'impulsive'])), '');
  }],
  ['Body gửi đúng trường theo kiểu (BE từ chối trường lạ)', () => {
    const form = { question: 'Q', hint: 'H', answerEmotion: 'happy', options: [] };
    assert.deepEqual(checkpointBody('emotion_self', form), { question: 'Q', hint: 'H', answerEmotion: 'happy' });
    assert.deepEqual(checkpointBody('emotion_self', { ...form, answerEmotion: '' }), { question: 'Q', hint: 'H' });
    assert.deepEqual(checkpointBody('reflection', form), { question: 'Q' });
    const p = checkpointBody('perspective', { ...form, options: [{ text: 'a', isCorrect: true }, { text: 'b', isCorrect: false }, { text: 'c' }] });
    assert.deepEqual(p, { question: 'Q', hint: 'H', options: [{ text: 'a', isCorrect: true }, { text: 'b', isCorrect: false }, { text: 'c', isCorrect: false }] });
    assert.ok(!('answerEmotion' in p));
    const s = checkpointBody('problem_solving', { ...form, options: [{ text: 'a', role: 'constructive', feedback: 'f' }] });
    assert.deepEqual(s, { question: 'Q', options: [{ text: 'a', role: 'constructive', feedback: 'f' }] });
    assert.ok(!('hint' in s));
  }],
  ['Form từ BE: token → tên, problem_solving đủ 3 vai theo thứ tự, perspective đủ 3 phương án', () => {
    assert.equal(fillNames('{NV1} chào {NV2}. {NV9}', chars), 'Bin chào Mẹ. {NV9}');
    const ps = initialCheckpointForm(cp({ type: 'problem_solving', question: '{NV1} làm gì?', options: [{ id: 'o', optionOrder: 1, text: '{NV1} xin lỗi', role: 'impulsive' }] }), chars);
    assert.deepEqual(ps.options.map((o) => o.role), ['constructive', 'avoidant', 'impulsive']);
    assert.equal(ps.options[2].text, 'Bin xin lỗi');
    assert.equal(ps.question, 'Bin làm gì?');
    assert.equal(initialCheckpointForm(cp({ type: 'perspective' }), chars).options.length, 3);
    // answerEmotion 'neutral' tạm của BE khi câu hỏi còn trống → coi như chưa chọn
    assert.equal(initialCheckpointForm(cp({ answerEmotion: 'neutral' }), chars).answerEmotion, '');
    assert.equal(initialCheckpointForm(cp({ question: 'Q', answerEmotion: 'neutral' }), chars).answerEmotion, 'neutral');
  }],
  ['Điểm dừng khoá (truyện AI / Kể chuyện nhà mình) chỉ xem: không có nút Sửa → không gửi PUT', () => {
    assert.equal(isCheckpointLocked({ locked: true }, { entry: 'topic' }), true);
    assert.equal(isCheckpointLocked({ locked: false }, { entry: 'family' }), true);
    assert.equal(isCheckpointLocked({ locked: false }, { entry: 'handwritten' }), false);
    const screen = noComments(read('screens/parent/StoryEditorScreen.tsx'));
    // updateCheckpoint chỉ gọi từ saveCheckpoint (sheet), sheet chỉ mở qua onEdit, nút onEdit chỉ hiện khi !locked
    assert.equal(screen.match(/storyService\.updateCheckpoint\(/g)?.length, 1);
    assert.match(screen, /const saveCheckpoint = async/);
    assert.match(screen, /\{!locked && <HeyButton title="Sửa điểm dừng"[^>]*onPress=\{onEdit\}/);
    assert.match(screen, /onDelete && !locked/);
  }],
  ['Kiểu điểm dừng thêm được: reflection chỉ sau trang cuối, cần nhân vật phụ cho kiểu hỏi nhân vật khác', () => {
    assert.deepEqual(checkpointTypesAfter(2, 4, chars), ['emotion_self', 'emotion_other', 'perspective', 'problem_solving']);
    assert.ok(checkpointTypesAfter(4, 4, chars).includes('reflection'));
    assert.deepEqual(checkpointTypesAfter(4, 4, [chars[0]]), ['emotion_self', 'problem_solving', 'reflection']);
  }],
  ['Ảnh bìa chỉ chọn cảnh đã vẽ xong; truyện AI chưa có chữ chưa hiện editor', () => {
    const scenes = [
      { id: 'b', sceneOrder: 2, imageUrl: 'u2', imageStatus: 'ready' },
      { id: 'a', sceneOrder: 1, imageUrl: 'u1', imageStatus: 'ready' },
      { id: 'c', sceneOrder: 3, imageUrl: 'u3', imageStatus: 'generating' },
      { id: 'd', sceneOrder: 4, imageUrl: null, imageStatus: 'none' },
    ];
    assert.deepEqual(coverScenes(scenes).map((s) => s.id), ['a', 'b']);
    assert.equal(isUnwrittenAiStory({ length: 'short', pages: [{ id: 'p', pageOrder: 1, contentText: null }] }), true);
    assert.equal(isUnwrittenAiStory({ length: 'custom', pages: [{ id: 'p', pageOrder: 1, contentText: null }] }), false);
  }],
  ['"Tự viết": POST /stories length custom, useAiImage false, KHÔNG entry/analysisToken, mở editor; 2 lối AI giữ nguyên', () => {
    const w = noComments(read('screens/parent/StoryWizard.tsx'));
    const block = w.slice(w.indexOf("entry === 'handwritten') {"), w.indexOf("} else if (entry === 'family')"));
    assert.ok(block.includes('storyService.createStory({'));
    assert.match(block, /length: 'custom'/);
    assert.match(block, /useAiImage: false/);
    assert.doesNotMatch(block, /entry:|analysisToken|startGeneration|generate/);
    assert.match(block, /onOpenEditor\(story\.id\)/);
    assert.ok(w.includes("entry: 'topic'") && w.includes("entry: 'family'") && w.includes('analysisToken: analysis.analysisToken'));
  }],
  ['Editor không tự gọi API AI; tranh / giọng đọc (B2) chỉ đi qua StoryMediaPanel, chân dung (B3) không có ở đây', () => {
    const screen = noComments(read('screens/parent/StoryEditorScreen.tsx'));
    assert.doesNotMatch(screen, /startGeneration|\/generate|\/images|\/narration|analyze\(|portrait|drawImages|redrawScene|retryNarration/);
    assert.match(screen, /<StoryMediaPanel /);
  }],
];

(async () => {
  let failed = 0;
  for (const [name, run] of cases) {
    try {
      await run();
      console.log(`PASS  ${name}`);
    } catch (e) {
      failed += 1;
      console.error(`FAIL  ${name}\n      ${(e as Error).message}`);
    }
  }
  console.log(`\n${cases.length - failed}/${cases.length} PASS`);
  process.exit(failed ? 1 : 0);
})();
