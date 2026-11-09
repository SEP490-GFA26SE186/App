// apps/mobile/tests/characterPortrait.test.ts
// GĐ B3 – chân dung nhân vật AI: đúng method/path (fetch GIẢ, test.invalid — không gọi BE thật, không tốn credit),
// khoá nút khi thiếu mô tả / thiếu credit / chưa biết giá / đang vẽ, câu lỗi 402/409/422, polling dừng đúng điều kiện,
// tải lại credit sau khi bắt đầu vẽ và khi vẽ xong / lỗi, gợi ý mô tả ngoại hình. Chạy: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { characterService } from '../src/services/characterService';
import { ApiError } from '../src/services/apiClient';
import {
  APPEARANCE_TIP,
  appearanceRisks,
  countDrawingPortraits,
  createPortraitPoller,
  portraitAction,
  portraitConfirmMessage,
  portraitErrorMessage,
} from '../src/utils/characterPortrait';

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

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

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
      queue.shift()?.();
      await new Promise((r) => setTimeout(r, 0));
    },
  };
};

const cases: [string, () => void | Promise<void>][] = [
  ['POST /characters/:id/portrait: đúng method / path, không body; map nhân vật BE trả qua mapper có sẵn', async () => {
    respond({ success: true, message: 'Đang vẽ chân dung nhân vật', data: { aiRequestId: 'r1', character: { id: 'c1', name: 'Bà', appearance: 'tóc bạc', portraitStatus: 'queued', portraitFailure: null, portraitImageUrl: null } } }, 202);
    const c = await characterService.generatePortrait('c1');
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/characters/c1/portrait', undefined]);
    assert.equal(c.id, 'c1');
    assert.equal(c.portraitStatus, 'queued');
    assert.equal(c.portraitFailure, null);
    assert.equal(c.appearanceDescription, 'tóc bạc');
    respond({ success: true, data: {} }, 202);
    await assert.rejects(characterService.generatePortrait('c1'), (e: unknown) => e instanceof ApiError);
  }],
  ['Lỗi 402 / 409 / 422 / 503: không thành công giả, câu báo đúng', async () => {
    const cases: [number, string, string][] = [
      [402, 'Không đủ credit', 'Ba mẹ không đủ credit để vẽ chân dung'],
      [409, 'Chân dung nhân vật này đang được vẽ.', 'Chân dung nhân vật này đang được vẽ.'],
      [422, 'Hãy mô tả ngoại hình nhân vật trước khi tạo chân dung.', 'Hãy mô tả ngoại hình nhân vật trước khi tạo chân dung.'],
      [503, 'Hàng đợi tạm lỗi, ba mẹ thử lại sau ít phút nhé.', 'Hàng đợi tạm lỗi, ba mẹ thử lại sau ít phút nhé.'],
    ];
    for (const [status, beMessage, shown] of cases) {
      respond({ success: false, message: beMessage }, status);
      let err: any;
      await assert.rejects(characterService.generatePortrait('c1'), (e: unknown) => ((err = e), e instanceof ApiError && (e as ApiError).status === status));
      assert.equal(portraitErrorMessage(err), shown);
    }
  }],
  ['Nút: khoá khi chưa có mô tả / chưa biết giá / thiếu credit; ẩn khi đang vẽ; nhãn + chi phí như Web', () => {
    const ok = { appearance: 'tóc đen', imageUrl: null, portraitStatus: 'none' };
    assert.deepEqual(portraitAction(ok, 1, 10), { visible: true, label: 'Vẽ chân dung AI · 1 credit', disabled: false, reason: null });
    assert.equal(portraitAction({ ...ok, imageUrl: 'u', portraitStatus: 'ready' }, 1, 10).label, 'Vẽ lại · 1 credit');
    assert.equal(portraitAction({ ...ok, portraitStatus: 'failed' }, 1, 10).label, 'Vẽ lại · 1 credit');
    const noAppearance = portraitAction({ ...ok, appearance: '  ' }, 1, 10);
    assert.equal(noAppearance.disabled, true);
    assert.match(noAppearance.reason!, /mô tả ngoại hình/);
    const noPrice = portraitAction(ok, null, 10);
    assert.equal(noPrice.disabled, true);
    assert.match(noPrice.reason!, /giá credit/);
    const poor = portraitAction(ok, 3, 2);
    assert.equal(poor.disabled, true);
    assert.equal(poor.reason, 'Không đủ credit: cần 3, ba mẹ còn 2.');
    assert.equal(portraitAction(ok, 3, null).disabled, false); // chưa biết số dư: BE vẫn chặn bằng 402
    for (const st of ['queued', 'generating']) assert.equal(portraitAction({ ...ok, portraitStatus: st }, 1, 10).visible, false);
    assert.equal(portraitConfirmMessage('Bà', 2), 'AI sẽ vẽ chân dung của Bà và trừ 2 credit. Nếu vẽ lỗi, credit được hoàn lại.');
  }],
  ['Bấm vẽ: Dialog xác nhận "trừ N credit" TRƯỚC khi gọi BE; xong thì tải lại credit; lỗi dùng portraitErrorMessage', () => {
    const comp = noComments(read('components/parent/CharacterPortraitAction.tsx'));
    const start = comp.slice(comp.indexOf('const start = async'), comp.indexOf('if (isPortraitDrawing(character))'));
    assert.ok(start.indexOf('dialog.confirm(') < start.indexOf('characterService.generatePortrait('), 'phải xác nhận trước khi gọi BE');
    assert.match(start, /confirmLabel: `Vẽ · trừ \$\{cost\} credit`/);
    assert.match(start, /if \(!ok\) return;/);
    assert.match(start, /onStarted\(await characterService\.generatePortrait\(characterId\)\);\s*onCreditsChanged\(\);/);
    assert.match(start, /portraitErrorMessage\(e\)/);
    assert.match(start, /action\.disabled/);
  }],
  ['Polling: hỏi lại khi đang vẽ, dừng khi xong; số đang vẽ giảm (xong / lỗi) → tải lại credit', async () => {
    const t = fakeTimers();
    let drawn = 0;
    const stops: string[] = [];
    const responses = [
      [{ portraitStatus: 'generating' }, { portraitStatus: 'queued' }],
      [{ portraitStatus: 'ready' }, { portraitStatus: 'generating' }],
      [{ portraitStatus: 'ready' }, { portraitStatus: 'failed' }],
    ];
    const seen: unknown[] = [];
    const p = createPortraitPoller({
      load: async () => responses.shift()!,
      drawingCount: countDrawingPortraits,
      onData: (d) => seen.push(d),
      onDrawn: () => (drawn += 1),
      onStop: (r) => stops.push(r),
      schedule: t.schedule,
      cancel: t.cancel,
    });
    p.start(2);
    await t.step();
    assert.equal(drawn, 0);
    await t.step();
    assert.equal(drawn, 1);
    await t.step();
    assert.equal(drawn, 2);
    assert.deepEqual(stops, ['done']);
    assert.equal(t.pending(), 0);
    assert.equal(seen.length, 3);
  }],
  ['Polling: dừng khi rời màn, khi lỗi liên tiếp, khi quá trần; không chạy khi không có gì đang vẽ', async () => {
    const busy = [{ portraitStatus: 'generating' }];
    const stops: string[] = [];
    let t = fakeTimers();
    let loads = 0;
    let p = createPortraitPoller({ load: async () => { loads += 1; return busy; }, drawingCount: countDrawingPortraits, onData: () => {}, onDrawn: () => {}, onStop: (r) => stops.push(r), schedule: t.schedule, cancel: t.cancel });
    p.start(1);
    await t.step();
    p.stop();
    await t.step();
    assert.equal(loads, 1);
    assert.deepEqual(stops, ['cancelled']);
    t = fakeTimers();
    stops.length = 0;
    p = createPortraitPoller({ load: async () => { throw new Error('mạng'); }, drawingCount: countDrawingPortraits, onData: () => {}, onDrawn: () => {}, onStop: (r) => stops.push(r), maxFailures: 2, schedule: t.schedule, cancel: t.cancel });
    p.start(1);
    await t.step();
    await t.step();
    assert.deepEqual(stops, ['error']);
    t = fakeTimers();
    stops.length = 0;
    p = createPortraitPoller({ load: async () => busy, drawingCount: countDrawingPortraits, onData: () => {}, onDrawn: () => {}, onStop: (r) => stops.push(r), maxPolls: 3, schedule: t.schedule, cancel: t.cancel });
    p.start(1);
    for (let i = 0; i < 5; i += 1) await t.step();
    assert.deepEqual(stops, ['limit']);
    t = fakeTimers();
    p = createPortraitPoller({ load: async () => busy, drawingCount: countDrawingPortraits, onData: () => {}, onDrawn: () => {}, schedule: t.schedule, cancel: t.cancel });
    p.start(0);
    assert.equal(t.pending(), 0);
  }],
  ['Nối vào màn: Nhân vật + Chi tiết bé có nút, polling 4 s dọn khi rời màn, ParentTabs truyền refreshCredit', () => {
    const comp = noComments(read('components/parent/CharacterPortraitAction.tsx'));
    assert.match(comp, /const poller = createPortraitPoller</);
    assert.match(comp, /return \(\) => poller\.stop\(\);/);
    assert.match(noComments(read('utils/characterPortrait.ts')), /opts\.intervalMs \?\? 4000/);
    const chars = noComments(read('screens/parent/CharactersScreen.tsx'));
    assert.match(chars, /<CharacterPortraitAction/);
    assert.match(chars, /load: \(\) => characterService\.getCharacters\(\)/);
    assert.match(chars, /onDrawn: onCreditsChanged/);
    const child = noComments(read('screens/parent/ChildDetailScreen.tsx'));
    assert.match(child, /<CharacterPortraitAction/);
    assert.match(child, /load: \(\) => childService\.getChild\(childId\)/);
    assert.match(child, /onDrawn: onCreditsChanged/);
    const tabs = noComments(read('navigation/ParentTabs.tsx'));
    assert.ok((tabs.match(/onCreditsChanged=\{refreshCredit\}/g)?.length ?? 0) >= 4, 'Nhân vật + Chi tiết bé (+ B2) nhận refreshCredit');
  }],
  ['Gợi ý mô tả ngoại hình (Web AppearanceHints): luôn có câu gợi ý, nhắc chi tiết dễ bị chặn, không chặn lưu', () => {
    assert.match(APPEARANCE_TIP, /Tả những gì nhìn thấy/);
    assert.deepEqual(appearanceRisks(''), []);
    assert.deepEqual(appearanceRisks('tóc đen, mặc áo thun xanh'), []);
    assert.equal(appearanceRisks('Bé thích mặc đồ Elsa').length, 1);
    assert.match(appearanceRisks('cầm kiếm gỗ')[0], /Vũ khí/);
    assert.match(appearanceRisks('dáng hơi ốm')[0], /bị bệnh/);
    assert.deepEqual(appearanceRisks('mặc áo marionette'), [], 'chỉ khớp nguyên từ');
    assert.equal(appearanceRisks('siêu nhân, cầm súng, mặc đồ bơi').length, 3);
    const form = noComments(read('components/parent/CharacterFormSheet.tsx'));
    assert.match(form, /<AppearanceHints value=\{appearance\} \/>/);
    // Chặn lưu chỉ theo độ dài như cũ, không theo gợi ý
    assert.doesNotMatch(form.slice(form.indexOf('const submit'), form.indexOf('return (')), /appearanceRisks/);
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
