// apps/mobile/tests/authRace.test.ts
// Kiểm tra race "đã rời màn nhưng response muộn vẫn đăng nhập". Dùng fetch GIẢ chỉ trong test (deferred),
// KHÔNG có trong runtime. Chạy: xem tests/README.md.
import assert from 'node:assert/strict';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { authService } from '../src/services/authService';
import { safeStorage, STORAGE_KEYS } from '../src/services/storage';

type Deferred = { resolve: (r: Response) => void; reject: (e: unknown) => void; signal?: AbortSignal | null };

const okBody = {
  success: true,
  data: {
    user: { id: 'u1', email: 'a@b.com', username: 'tester_1', role: 'parent' },
    tokens: { accessToken: 'AT', refreshToken: 'RT' },
  },
};
const okResponse = () => new Response(JSON.stringify(okBody), { status: 201, headers: { 'Content-Type': 'application/json' } });

/** honorSignal=false mô phỏng trường hợp xấu nhất: response về sau khi đã hủy mà fetch không tự reject */
const installFetch = (honorSignal: boolean): Deferred => {
  const d = {} as Deferred;
  (globalThis as any).fetch = (_url: string, init: RequestInit) =>
    new Promise<Response>((resolve, reject) => {
      d.resolve = resolve;
      d.reject = reject;
      d.signal = init.signal;
      if (honorSignal && init.signal?.aborted) reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      else if (honorSignal) init.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    });
  return d;
};

const payload = { username: 'tester_1', email: 'a@b.com', password: 'Passw0rd1' };
const tokenStored = () => safeStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) !== null;
const tick = () => new Promise((r) => setTimeout(r, 0));

const cases: [string, () => Promise<void>][] = [
  ['register hoàn tất bình thường: ghi token, trả user', async () => {
    safeStorage.clear();
    const d = installFetch(true);
    const p = authService.register(payload, new AbortController().signal);
    await tick();
    d.resolve(okResponse());
    const user = await p;
    assert.equal(user.id, 'u1');
    assert.ok(tokenStored());
  }],
  ['Back khi đang gửi (fetch tôn trọng signal): reject, KHÔNG ghi token', async () => {
    safeStorage.clear();
    const d = installFetch(true);
    const c = new AbortController();
    const p = authService.register(payload, c.signal);
    await tick();
    c.abort();
    await assert.rejects(p);
    d.resolve?.(okResponse()); // response muộn không còn ai nghe
    await tick();
    assert.ok(!tokenStored());
  }],
  ['response về sau khi hủy (fetch KHÔNG reject): service vẫn không ghi token', async () => {
    safeStorage.clear();
    const d = installFetch(false);
    const c = new AbortController();
    const p = authService.register(payload, c.signal);
    await tick();
    c.abort();
    d.resolve(okResponse());
    await assert.rejects(p);
    assert.ok(!tokenStored());
  }],
  ['login: cùng bảo đảm khi hủy', async () => {
    safeStorage.clear();
    const d = installFetch(false);
    const c = new AbortController();
    const p = authService.login('a@b.com', 'Passw0rd1', c.signal);
    await tick();
    c.abort();
    d.resolve(okResponse());
    await assert.rejects(p);
    assert.ok(!tokenStored());
  }],
  ['signal đã hủy sẵn: không gọi mạng tới đích, không ghi token', async () => {
    safeStorage.clear();
    installFetch(true);
    const c = new AbortController();
    c.abort();
    await assert.rejects(authService.register(payload, c.signal));
    assert.ok(!tokenStored());
  }],
];

(async () => {
  let failed = 0;
  const watchdog = setTimeout(() => { console.log('FAIL treo: một case không kết thúc'); process.exit(2); }, 10000);
  for (const [name, fn] of cases) {
    try {
      await fn();
      console.log('PASS', name);
    } catch (e) {
      failed++;
      console.log('FAIL', name, '\n  ', (e as Error).message);
    }
  }
  clearTimeout(watchdog);
  if (failed) process.exit(1);
  console.log(`OK ${cases.length}/${cases.length}`);
})();
