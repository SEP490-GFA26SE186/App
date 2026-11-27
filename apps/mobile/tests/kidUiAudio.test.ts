// apps/mobile/tests/kidUiAudio.test.ts
// Kid Audio: ánh xạ response GET /kid/ui-audio, chỉ token kid_session, nút "Nghe" không gửi câu trả lời, không gọi AI;
// trang tự đọc khi lật (như Web), có tắt tiếng; không phát được file BE → giọng máy đọc chữ (quyết định 2026-11-27). Fetch GIẢ (http://test.invalid), không gọi BE thật, không phát âm thanh thật.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false;
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { kidService } from '../src/services/kidService';
import { safeStorage, STORAGE_KEYS } from '../src/services/storage';
import { pickSource, playableUrl, UI_AUDIO_KEYS } from '../src/utils/kidUiAudio';
import { speechTTS } from '../src/utils/speech-tts';
// Chỉ lấy kiểu (để tsc biên dịch kèm file hook); module được nạp bằng require trong ca hotfix, sau khi chặn expo-audio
import type * as HookModule from '../src/screens/kid/useKidUiAudio';

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

let passed = 0;
const test = async (name: string, fn: () => Promise<void> | void) => {
  await fn();
  passed += 1;
  console.log('PASS', name);
};

const run = async () => {
  await test('Service: GET /kid/ui-audio chỉ gửi token kid_session, trả nguyên assets của BE', async () => {
    safeStorage.clear();
    safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'PARENT_AT');
    safeStorage.setItem(STORAGE_KEYS.KID_SESSION_TOKEN, 'KID_T');
    const calls: { url: string; method: string; auth: string | null }[] = [];
    const assets = {
      'prompt.correct': { text: 'Đúng rồi! Con giỏi quá!', audioUrl: 'https://res.cloudinary.com/x/video/authenticated/s--ab--/v1/ui-audio/vi/a.mp3' },
      'emotion.happy': { text: 'Vui', audioUrl: null },
    };
    (globalThis as any).fetch = async (url: string, init: RequestInit = {}) => {
      calls.push({ url, method: init.method ?? 'GET', auth: (init.headers as Record<string, string>)?.Authorization ?? null });
      return new Response(JSON.stringify({ success: true, data: { assets } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
    assert.deepEqual(await kidService.getUiAudio(), assets);
    assert.deepEqual(calls, [{ url: 'http://test.invalid/api/v1/kid/ui-audio', method: 'GET', auth: 'Bearer KID_T' }]);

    (globalThis as any).fetch = async () => new Response(JSON.stringify({ success: true, data: {} }), { status: 200 });
    await assert.rejects(kidService.getUiAudio(), 'response thiếu assets phải báo lỗi (hook bỏ qua, Kid Mode vẫn dùng được)');
  });

  await test('playableUrl: chỉ URL http(s) BE trả; thiếu khóa / null / rỗng / sai dạng → không phát', () => {
    const assets = {
      a: { text: 'x', audioUrl: 'https://cdn/x.mp3' },
      b: { text: 'x', audioUrl: null },
      c: { text: 'x', audioUrl: '' },
      d: { text: 'x', audioUrl: 'javascript:alert(1)' },
    };
    assert.equal(playableUrl(assets, 'a'), 'https://cdn/x.mp3');
    for (const k of ['b', 'c', 'd', 'missing']) assert.equal(playableUrl(assets, k), null, k);
    assert.equal(playableUrl(null, 'a'), null);
    assert.equal(playableUrl({}, UI_AUDIO_KEYS.correct), null);
  });

  await test('Khóa dùng trên UI khớp khóa BE seed (không bịa khóa)', () => {
    // Cần workspace SEP có BE nằm cạnh App; clone riêng repo App thì bỏ qua (không fail giả)
    const seedPath = join(process.cwd(), '../../../BE/api/scripts/seed-ui-audio.js');
    if (!existsSync(seedPath)) return console.log('  (bỏ qua: không thấy BE/api/scripts/seed-ui-audio.js)');
    const seed = readFileSync(seedPath, 'utf8');
    for (const k of Object.values(UI_AUDIO_KEYS)) assert.ok(seed.includes(`'${k}'`), `BE không có khóa ${k}`);
  });

  await test('Nối vào Kid Mode thật: KidModeScreen → useKidUiAudio(source) → KidReader → KidCheckpointCard', () => {
    const screen = noComments(read('screens/kid/KidModeScreen.tsx'));
    assert.match(screen, /useKidUiAudio\(source, !preview\)/);
    assert.match(screen, /audio=\{uiAudio\}/);
    assert.match(screen, /if \(showPinModal\) stopAudio\(\)/);
    const hook = noComments(read('screens/kid/useKidUiAudio.ts'));
    assert.match(hook, /source\s*\.getUiAudio\(\)/);
    assert.match(hook, /player\.current\?\.remove\(\)/, 'rời Kid Mode phải giải phóng player');
    assert.match(hook, /silence\(\);[\s\S]*player\.current\.replace\(src\.url\)/, 'một player dùng chung, dừng câu cũ trước');
    assert.match(hook, /speechTTS\.stop\(\)/, 'dừng / rời Kid Mode phải dừng cả giọng máy');
    assert.match(noComments(read('components/kid/KidReader.tsx')), /audio=\{audio\}/);
    const kid = noComments(read('services/kidService.ts'));
    assert.match(kid, /await kidFetch<[\s\S]{0,120}?>\('\/kid\/ui-audio'\)/);
    assert.doesNotMatch(kid, /apiFetch/, 'kidService không dùng client Parent');
  });

  await test('pickSource: file BE khi có trình phát → giọng máy đọc chữ → không phát', () => {
    assert.deepEqual(pickSource('https://cdn/p.mp3', 'Chữ', true, true), { kind: 'audio', url: 'https://cdn/p.mp3' });
    assert.deepEqual(pickSource('https://cdn/p.mp3', ' Chữ ', false, true), { kind: 'tts', text: 'Chữ' }, 'Expo Go thiếu expo-audio');
    assert.deepEqual(pickSource(null, 'Chữ', true, true), { kind: 'tts', text: 'Chữ' }, 'truyện tắt giọng đọc');
    assert.deepEqual(pickSource('ftp://x', 'Chữ', true, true), { kind: 'tts', text: 'Chữ' });
    assert.equal(pickSource(null, '   ', true, true), null);
    assert.equal(pickSource(null, 'Chữ', true, false), null, 'không có giọng máy');
  });

  await test('Trình đọc: tự đọc trang khi lật, có "Nghe lại trang này", tắt tiếng, câu hết truyện', () => {
    const reader = noComments(read('components/kid/KidReader.tsx'));
    assert.match(reader, /speak\(`page:\$\{page\.id\}`, page\.audioUrl, page\.text\)/);
    assert.match(reader, /mutedRef\.current\) return/, 'tắt tiếng thì không tự đọc');
    assert.match(reader, /\[pageId, speak\]/, 'chỉ tự đọc khi đổi trang');
    assert.match(reader, /Nghe lại trang này/);
    assert.match(reader, /UI_AUDIO_KEYS\.storyEnd/);
    const screen = noComments(read('screens/kid/KidModeScreen.tsx'));
    assert.match(screen, /muted=\{muted\}/);
    assert.match(screen, /if \(!muted\) uiAudio\.stop\(\)/, 'bấm tắt tiếng dừng ngay câu đang đọc');
  });

  await test('Nút "Nghe" chỉ phát âm thanh: không gửi câu trả lời, không tạo giọng đọc / gọi AI', () => {
    const card = noComments(read('components/kid/KidCheckpointCard.tsx'));
    const listen = card.slice(card.indexOf('const Listen'), card.indexOf('export const KidCheckpointCard'));
    assert.ok(listen.length > 0);
    assert.doesNotMatch(listen, /onChoose|onSkip|onContinue|submit|complete/);
    assert.match(listen, /audio\.play\(audioKey\)/);
    for (const f of ['screens/kid/useKidUiAudio.ts', 'utils/kidUiAudio.ts', 'components/kid/KidCheckpointCard.tsx']) {
      assert.doesNotMatch(noComments(read(f)), /narration|generate|synthesize|apiFetch|\/stories\//i, f);
    }
    assert.doesNotMatch(noComments(read('screens/kid/useKidUiAudio.ts')), /useEffect\([^)]*\.play\(/, 'không tự phát');
  });

  await test('Hotfix Expo Go SDK 52: require("expo-audio") ném lỗi → hook không crash, chỉ còn giọng máy', async () => {
    // Chặn require: expo-audio ném lỗi như Expo Go; react thay bằng hook giả chạy đồng bộ (không cần renderer)
    const Module = require('node:module') as any;
    const origLoad = Module._load;
    const effects: (() => void | (() => void))[] = [];
    const fakeReact = {
      useState: (init: unknown) => [typeof init === 'function' ? (init as () => unknown)() : init, () => {}],
      useRef: (current: unknown) => ({ current }),
      useCallback: (fn: unknown) => fn,
      useEffect: (fn: () => void | (() => void)) => {
        effects.push(fn);
      },
    };
    Module._load = function (request: string, ...rest: unknown[]) {
      if (request === 'expo-audio') throw new Error("Cannot find native module 'ExpoAudio'");
      if (request === 'react') return fakeReact;
      return origLoad.call(this, request, ...rest);
    };
    try {
      const hookPath = require.resolve('../src/screens/kid/useKidUiAudio');
      delete require.cache[hookPath];
      const { useKidUiAudio } = require(hookPath) as typeof HookModule; // nạp module KHÔNG được ném lỗi
      let loads = 0;
      const source = {
        getUiAudio: async () => {
          loads += 1;
          return { 'prompt.correct': { text: 'Đúng rồi!', audioUrl: 'https://cdn/x.mp3' } };
        },
      };
      const controls = useKidUiAudio(source as any, true);
      const cleanups = effects.map((run) => run());
      await new Promise((r) => setTimeout(r, 0));
      assert.equal(loads, 1, 'vẫn tải câu đọc (để giọng máy đọc chữ)');
      // Hook giả không cập nhật state → assets chưa có; trang có chữ thì nghe được nếu thiết bị có giọng máy
      assert.equal(controls.canSpeak('https://cdn/p.mp3', 'Chữ trang'), speechTTS.isAvailable(), 'không phát file khi thiếu module');
      assert.doesNotThrow(() => controls.speak('page:1', 'https://cdn/p.mp3', 'Chữ trang'));
      assert.doesNotThrow(() => controls.play(UI_AUDIO_KEYS.correct));
      assert.doesNotThrow(() => controls.stop());
      assert.equal(controls.playingKey, null);
      for (const c of cleanups) if (typeof c === 'function') assert.doesNotThrow(c); // rời Kid Mode không crash
    } finally {
      Module._load = origLoad;
    }
  });

  console.log(`OK ${passed}/${passed}`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
