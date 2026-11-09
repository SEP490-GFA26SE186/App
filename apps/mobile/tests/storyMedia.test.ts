// apps/mobile/tests/storyMedia.test.ts
// GĐ B2 – tranh AI + giọng đọc: đúng method/path 3 endpoint (fetch GIẢ, test.invalid — không gọi BE thật, không tốn credit),
// lỗi 402/409/503 không thành công giả, công thức chi phí tranh + 3 mức cảnh báo, payload Wizard (useAiImage/useTts từng lối),
// polling dừng khi xong / lỗi / quá trần / rời màn, tải lại credit sau khi vẽ. Chạy: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { storyService } from '../src/services/storyService';
import { ApiError } from '../src/services/apiClient';
import {
  canOfferAiImages,
  createStoryPoller,
  drawAndRefresh,
  imagePlan,
  imagePlanTitle,
  missingPortraitCount,
  missingScenes,
  narrationState,
  sceneState,
  shouldPollStory,
} from '../src/utils/storyMedia';
import type { StoryDto } from '../src/types/api';

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
const drawResult = { portraits: 1, scenes: 3, waiting: 0, insufficientCredit: false };

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const story = (patch: Partial<StoryDto> = {}): StoryDto => ({ id: 's1', title: 'T', status: 'ready', ...patch });
const narr = (p: Partial<NonNullable<StoryDto['narration']>>) => ({ enabled: true, total: 10, ready: 0, pending: 0, failed: 0, missing: 0, complete: false, ...p });

/** Bộ hẹn giờ giả: giữ hàm chờ, test tự chạy từng nhịp */
const fakeTimers = () => {
  const queue: (() => void)[] = [];
  return {
    schedule: (fn: () => void) => {
      queue.push(fn);
      return queue.length;
    },
    cancel: () => {
      queue.length = 0;
    },
    pending: () => queue.length,
    step: async () => {
      const fn = queue.shift();
      fn?.();
      await new Promise((r) => setTimeout(r, 0));
    },
  };
};

const cases: [string, () => void | Promise<void>][] = [
  ['3 endpoint: đúng method / path, không body; đọc đúng data BE trả', async () => {
    respond({ success: true, message: 'Đang vẽ tranh cho truyện', data: drawResult }, 202);
    assert.deepEqual(await storyService.drawImages('s1'), drawResult);
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/stories/s1/images', undefined]);
    respond({ success: true, data: drawResult }, 202);
    await storyService.redrawScene('s1', 'sc2');
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/stories/s1/scenes/sc2/image', undefined]);
    respond({ success: true, data: { story: { id: 's1', title: 'T', status: 'ready', narration: narr({ pending: 3 }) } } }, 202);
    const dto = await storyService.retryNarration('s1');
    assert.equal(dto.narration?.pending, 3);
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/stories/s1/narration/retry', undefined]);
  }],
  ['402 / 409 / 503 / sai hình dạng → ApiError với câu BE, không thành công giả', async () => {
    const cases: [number, string, () => Promise<unknown>][] = [
      [402, 'Ba mẹ không đủ credit để vẽ tranh.', () => storyService.drawImages('s1')],
      [409, 'Cảnh này đang được vẽ.', () => storyService.redrawScene('s1', 'sc1')],
      [503, 'Hệ thống giọng đọc đang tạm gián đoạn. Vui lòng thử lại sau ít phút.', () => storyService.retryNarration('s1')],
    ];
    for (const [status, message, run] of cases) {
      respond({ success: false, message }, status);
      await assert.rejects(run(), (e: unknown) => e instanceof ApiError && e.status === status && e.message === message);
    }
    respond({ success: true, data: {} }, 202);
    await assert.rejects(storyService.drawImages('s1'), (e: unknown) => e instanceof ApiError);
  }],
  ['Chi phí tranh tối đa = maxScenes × scene + chân dung còn thiếu × characterPortrait (chỉ lối AI, chỉ khi bật)', () => {
    const images = { characterPortrait: 1, scene: 1, maxScenes: 4 };
    assert.equal(imagePlan({ isAi: true, useAiImage: true, images, missingPortraits: 2, creditBalance: 50, textCost: 2 }).imagesMax, 6);
    assert.equal(imagePlan({ isAi: true, useAiImage: false, images, missingPortraits: 2, creditBalance: 50, textCost: 2 }).imagesMax, 0);
    assert.equal(imagePlan({ isAi: false, useAiImage: true, images, missingPortraits: 0, creditBalance: 50, textCost: 0 }).imagesMax, 0);
    const chars = [
      { id: 'a', portraitStatus: 'none' },
      { id: 'b', portraitStatus: 'none', photoReferenceUrl: 'u' },
      { id: 'c', portraitStatus: 'ready' },
      { id: 'd', portraitStatus: 'none' },
    ];
    assert.equal(missingPortraitCount(chars, ['a', 'b', 'c']), 1);
  }],
  ['3 mức cảnh báo credit: đủ / chỉ đủ n cảnh / không có tranh (theo số dư sau khi viết chữ)', () => {
    const images = { characterPortrait: 2, scene: 3, maxScenes: 4 };
    const base = { isAi: true, useAiImage: true, images, missingPortraits: 1, textCost: 2 };
    // imagesMax = 4×3 + 1×2 = 14
    const full = imagePlan({ ...base, creditBalance: 16 }); // còn 14
    assert.deepEqual(full.plan, { scenes: 4, full: true, none: false });
    assert.equal(imagePlanTitle(full.plan!, 4), 'Đủ credit vẽ cả 4 cảnh');
    const partial = imagePlan({ ...base, creditBalance: 10 }); // còn 8 → (8−2)/3 = 2 cảnh
    assert.deepEqual(partial.plan, { scenes: 2, full: false, none: false });
    assert.equal(imagePlanTitle(partial.plan!, 4), 'Chỉ đủ credit vẽ 2/4 cảnh');
    const none = imagePlan({ ...base, creditBalance: 3 }); // còn 1 < giá chân dung 2
    assert.deepEqual(none.plan, { scenes: 0, full: false, none: true });
    assert.equal(imagePlanTitle(none.plan!, 4), 'Truyện sẽ không có tranh');
    assert.equal(imagePlan({ ...base, creditBalance: null }).plan, null); // chưa biết số dư → không đoán
    assert.equal(imagePlan({ ...base, creditBalance: 1 }).plan, null); // không đủ viết chữ → Wizard đã chặn bằng `missing`
  }],
  ['Payload Wizard: 2 lối AI gửi useAiImage + useTts; "Tự viết" useAiImage false + useTts; công tắc giọng đọc cho mọi lối', () => {
    const w = noComments(read('screens/parent/StoryWizard.tsx'));
    const topic = w.slice(w.indexOf("entry: 'topic',"), w.indexOf("} else if (entry === 'handwritten')"));
    assert.match(topic, /useTts,\s*useAiImage,/);
    const family = w.slice(w.indexOf("entry: 'family',"), w.indexOf('if (generating)'));
    assert.match(family, /scored: true,\s*useAiImage,/);
    const hand = w.slice(w.indexOf("entry === 'handwritten') {"), w.indexOf("} else if (entry === 'family')"));
    assert.match(hand, /useAiImage: false/);
    assert.match(hand, /useTts,/);
    assert.match(w, /const \[useAiImage, setUseAiImage\] = useState\(false\)/);
    // Công tắc giọng đọc không còn nằm trong `isAi &&`; công tắc tranh chỉ cho lối AI
    assert.doesNotMatch(w, /\{isAi && \(\s*<View style=\{styles\.switchRow\}>\s*<Text style=\{styles\.switchLabel\}>Có giọng đọc/);
    assert.match(w, /\{isAi && \(\s*<>\s*<View style=\{styles\.switchRow\}>[\s\S]*?Tranh minh hoạ bằng AI/);
    // Luồng analyze / generate giữ nguyên
    assert.ok(w.includes('storyService.analyze(') && w.includes('analysisToken: analysis.analysisToken'));
  }],
  ['Poller: hỏi lại khi đang vẽ, dừng khi xong; số cảnh đang vẽ giảm → tải lại credit', async () => {
    const t = fakeTimers();
    let drawn = 0;
    const stops: string[] = [];
    const seen: StoryDto[] = [];
    const responses = [
      story({ scenes: [{ id: 'a', imageStatus: 'generating' }, { id: 'b', imageStatus: 'queued' }] }),
      story({ scenes: [{ id: 'a', imageStatus: 'ready', imageUrl: 'u' }, { id: 'b', imageStatus: 'generating' }] }),
      story({ scenes: [{ id: 'a', imageStatus: 'ready', imageUrl: 'u' }, { id: 'b', imageStatus: 'failed' }] }),
    ];
    const poller = createStoryPoller({
      load: async () => responses.shift() as StoryDto,
      onData: (s) => seen.push(s),
      onDrawn: () => (drawn += 1),
      onStop: (r) => stops.push(r),
      schedule: t.schedule,
      cancel: t.cancel,
    });
    poller.start(story({ scenes: [{ id: 'a', imageStatus: 'generating' }, { id: 'b', imageStatus: 'queued' }] }));
    assert.equal(t.pending(), 1);
    await t.step(); // vẫn 2 cảnh đang vẽ
    assert.equal(drawn, 0);
    await t.step(); // còn 1 → refresh credit
    assert.equal(drawn, 1);
    await t.step(); // còn 0 (1 cảnh lỗi: BE hoàn credit) → refresh credit, dừng
    assert.equal(drawn, 2);
    assert.deepEqual(stops, ['done']);
    assert.equal(t.pending(), 0);
    assert.equal(seen.length, 3);
  }],
  ['Poller: dừng khi rời màn (stop), khi lỗi liên tiếp, khi quá trần; không chạy nếu không có việc', async () => {
    const busyStory = story({ narration: narr({ pending: 2 }) });
    // Rời màn giữa chừng
    let t = fakeTimers();
    let loads = 0;
    const stops: string[] = [];
    let p = createStoryPoller({ load: async () => { loads += 1; return busyStory; }, onData: () => {}, onDrawn: () => {}, onStop: (r) => stops.push(r), schedule: t.schedule, cancel: t.cancel });
    p.start(busyStory);
    await t.step();
    p.stop();
    assert.equal(t.pending(), 0);
    await t.step();
    assert.equal(loads, 1);
    assert.deepEqual(stops, ['cancelled']);
    // Lỗi liên tiếp
    t = fakeTimers();
    stops.length = 0;
    p = createStoryPoller({ load: async () => { throw new Error('mạng'); }, onData: () => {}, onDrawn: () => {}, onStop: (r) => stops.push(r), maxFailures: 2, schedule: t.schedule, cancel: t.cancel });
    p.start(busyStory);
    await t.step();
    await t.step();
    assert.deepEqual(stops, ['error']);
    assert.equal(t.pending(), 0);
    // Quá trần số lần
    t = fakeTimers();
    stops.length = 0;
    p = createStoryPoller({ load: async () => busyStory, onData: () => {}, onDrawn: () => {}, onStop: (r) => stops.push(r), maxPolls: 3, schedule: t.schedule, cancel: t.cancel });
    p.start(busyStory);
    for (let i = 0; i < 5; i += 1) await t.step();
    assert.deepEqual(stops, ['limit']);
    // Không có việc chạy nền → không hẹn giờ
    t = fakeTimers();
    p = createStoryPoller({ load: async () => busyStory, onData: () => {}, onDrawn: () => {}, schedule: t.schedule, cancel: t.cancel });
    p.start(story({ narration: narr({ complete: true, ready: 10 }) }));
    assert.equal(t.pending(), 0);
  }],
  ['Sau khi vẽ: tải lại credit rồi tải lại truyện; lỗi BE thì không refresh giả', async () => {
    const order: string[] = [];
    const out = await drawAndRefresh(async () => { order.push('draw'); return drawResult; }, {
      onCreditsChanged: () => order.push('credit'),
      reload: async () => { order.push('reload'); },
    });
    assert.deepEqual(out, drawResult);
    assert.deepEqual(order, ['draw', 'credit', 'reload']);
    order.length = 0;
    await assert.rejects(drawAndRefresh(async () => { throw new ApiError('Ba mẹ không đủ credit để vẽ tranh.', 402); }, {
      onCreditsChanged: () => order.push('credit'),
      reload: async () => { order.push('reload'); },
    }));
    assert.deepEqual(order, []);
  }],
  ['Panel dùng poller trong useEffect (dọn khi rời màn) và drawAndRefresh cho vẽ tranh / vẽ lại; màn cha truyền refreshCredit', () => {
    const panel = noComments(read('components/parent/StoryMediaPanel.tsx'));
    assert.match(panel, /const poller = createStoryPoller\(/);
    assert.match(panel, /return \(\) => poller\.stop\(\);/);
    assert.match(panel, /onDrawn: \(\) => creditsRef\.current\(\)/);
    assert.equal(panel.match(/drawAndRefresh\(/g)?.length, 2);
    assert.match(panel, /storyService\.retryNarration\(storyId\)/);
    const tabs = noComments(read('navigation/ParentTabs.tsx'));
    assert.match(tabs, /onCreditsChanged=\{refreshCredit\}/);
    assert.match(tabs, /creditBalance=\{currentUser\.creditBalance\}/);
  }],
  ['Trạng thái giọng đọc, cảnh, khung "Vẽ tiếp" / "Thêm tranh" giống Web', () => {
    assert.equal(narrationState(story({ narration: narr({ pending: 1 }) })), null); // chưa hoàn tất
    const reviewed = { reviewedAt: '2026-11-09' };
    assert.equal(narrationState(story({ ...reviewed, narration: narr({ pending: 4, ready: 6 }) }))?.phase, 'working');
    assert.equal(narrationState(story({ ...reviewed, narration: narr({ pending: 4, ready: 6 }) }))?.percent, 60);
    assert.equal(narrationState(story({ ...reviewed, narration: narr({ failed: 2, ready: 8 }) }))?.phase, 'failed');
    assert.equal(narrationState(story({ ...reviewed, narration: narr({ missing: 2, ready: 8 }) }))?.phase, 'stale');
    assert.equal(narrationState(story({ ...reviewed, narration: narr({ ready: 10, complete: true }) }))?.phase, 'ready');
    assert.equal(narrationState(story({ ...reviewed, narration: narr({ enabled: false }) })), null);
    assert.equal(sceneState({ id: 'a', imageStatus: 'queued' }), 'waiting');
    assert.equal(sceneState({ id: 'a', imageStatus: 'ready', imageUrl: 'u' }), 'ready');
    const scenes = [
      { id: 'a', description: 'x', imageStatus: 'none' },
      { id: 'b', description: 'y', imageStatus: 'ready', imageUrl: 'u' },
      { id: 'c', description: '', imageStatus: 'none' },
    ];
    assert.deepEqual(missingScenes({ useAiImage: true, scenes }).map((s) => s.id), ['a']);
    assert.deepEqual(missingScenes({ useAiImage: true, scenes: [...scenes, { id: 'd', description: 'z', imageStatus: 'generating' }] }), []);
    assert.equal(canOfferAiImages({ length: 'short', useAiImage: false, scenes, kind: 'private' }), true);
    assert.equal(canOfferAiImages({ length: 'custom', useAiImage: false, scenes, kind: 'private' }), false);
    assert.equal(shouldPollStory(story({ scenes: [{ id: 'a', imageStatus: 'queued' }] })), true);
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
