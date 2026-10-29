// apps/mobile/tests/phase2.test.ts
// Phase 2: đúng method/path/body/token cho 13 endpoint (fetch GIẢ ghi lại request, địa chỉ test.invalid — không gọi BE thật,
// không gửi email) + mỗi endpoint có lời gọi từ màn đang dùng + không đụng luồng AI/trả phí.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { authService } from '../src/services/authService';
import { characterService } from '../src/services/characterService';
import { billingService } from '../src/services/billingService';
import { kidService } from '../src/services/kidService';
import { eqSkillService } from '../src/services/eqSkillService';
import { safeStorage, STORAGE_KEYS } from '../src/services/storage';

type Call = { url: string; method: string; auth: string | null; body: any };
let calls: Call[] = [];
const respond = (body: unknown, status = 200) => {
  calls = [];
  (globalThis as any).fetch = async (url: string, init: RequestInit = {}) => {
    const h = (init.headers ?? {}) as Record<string, string>;
    calls.push({ url, method: init.method ?? 'GET', auth: h.Authorization ?? null, body: init.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  };
};
const last = () => calls[calls.length - 1];
const path = (c: Call) => c.url.replace(/^http:\/\/test\.invalid\/api\/v1/, '');

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
  safeStorage.clear();
  safeStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'PARENT_AT');

  await test('Auth: quên/đặt lại mật khẩu không gửi token; xác thực email dùng token Parent', async () => {
    respond({ success: true, message: 'Nếu email đã đăng ký, mã khôi phục sẽ được gửi trong ít phút.' });
    assert.equal(await authService.forgotPassword(' a@b.com '), 'Nếu email đã đăng ký, mã khôi phục sẽ được gửi trong ít phút.');
    assert.deepEqual([last().method, path(last()), last().auth, last().body], ['POST', '/auth/forgot-password', null, { email: 'a@b.com' }]);

    respond({ success: true, message: 'Đã đặt lại mật khẩu.' });
    await authService.resetPassword(' code1 ', 'NewPass123');
    assert.deepEqual([last().method, path(last()), last().auth, last().body], ['POST', '/auth/reset-password', null, { token: 'code1', newPassword: 'NewPass123' }]);

    respond({ success: true, data: { retryAfterSeconds: 60 } });
    assert.deepEqual(await authService.sendVerificationEmail(), { retryAfterSeconds: 60 });
    assert.deepEqual([last().method, path(last()), last().auth], ['POST', '/auth/send-verification-email', 'Bearer PARENT_AT']);

    respond({ success: true, data: { id: 'u1', emailVerifiedAt: '2026-10-29T00:00:00.000Z' } });
    assert.deepEqual(await authService.verifyEmail(' abc '), { emailVerifiedAt: '2026-10-29T00:00:00.000Z' });
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/auth/verify-email', { token: 'abc' }]);

    respond({ success: false, message: 'Mã xác thực không hợp lệ hoặc đã được sử dụng' }, 400);
    await assert.rejects(authService.verifyEmail('x'), /Mã xác thực không hợp lệ/);
  });

  await test('Chi tiết nhân vật / gói / năng lực / kỹ năng con: GET đúng path', async () => {
    respond({ success: true, data: { character: { id: 'c1', name: 'Bà', appearance: 'tóc bạc', child: null, createdAt: '', updatedAt: '' } } });
    assert.equal((await characterService.getCharacter('c1')).id, 'c1');
    assert.deepEqual([last().method, path(last())], ['GET', '/characters/c1']);

    respond({ success: true, data: { plan: { id: 'p1', code: 'free', name: 'Miễn phí', priceVnd: '0', creditsPerMonth: 0, maxChildren: 2, maxCharacters: 5, isActive: true } } });
    assert.equal((await billingService.getPlan('p1')).code, 'free');
    assert.deepEqual([last().method, path(last()), last().auth], ['GET', '/plans/p1', null]);

    respond({ success: true, data: { skills: [] } });
    assert.deepEqual(await eqSkillService.getSkills(), []);
    assert.equal(path(last()), '/eq-skills');

    respond({ success: true, data: { skill: { id: 's1', caselCode: 'self_awareness', topics: [] } } });
    await eqSkillService.getSkill('self_awareness');
    assert.equal(path(last()), '/eq-skills/self_awareness');

    respond({ success: true, data: [] });
    await eqSkillService.getSubSkills('s1');
    assert.equal(path(last()), '/sub-skills?skillId=s1');

  });

  await test('Kid: /kid/me, /kid/ui-audio, /kid/sessions/:id chỉ dùng token kid_session, không bao giờ token Parent', async () => {
    safeStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    safeStorage.setItem(STORAGE_KEYS.KID_SESSION_TOKEN, 'KID_T');
    respond({ success: true, data: { child: { id: 'k1', name: 'Na', birthDate: null, preferredVoice: null } } });
    assert.equal((await kidService.getMe()).child.id, 'k1');
    assert.deepEqual([path(last()), last().auth], ['/kid/me', 'Bearer KID_T']);

    respond({ success: true, data: { session: { id: 's9' }, story: { id: 'st', pages: [], checkpoints: [] } } });
    assert.equal((await kidService.getSession('s9')).session.id, 's9');
    assert.deepEqual([last().method, path(last()), last().auth], ['GET', '/kid/sessions/s9', 'Bearer KID_T']);

    respond({ success: true, data: { assets: {} } });
    await kidService.getUiAudio();
    assert.deepEqual([path(last()), last().auth], ['/kid/ui-audio', 'Bearer KID_T']);
    for (const c of calls) assert.notEqual(c.auth, 'Bearer PARENT_AT');
  });

  await test('Màn hình: mỗi endpoint đã nối có lời gọi từ UI đang dùng', () => {
    const must: Record<string, string[]> = {
      'components/auth/ForgotPasswordSheet.tsx': ['authService.forgotPassword(', 'authService.resetPassword('],
      'screens/auth/LoginScreen.tsx': ['<ForgotPasswordSheet', 'setForgotOpen(true)'],
      'screens/parent/SettingsScreen.tsx': ['authService.sendVerificationEmail()', 'authService.verifyEmail(', 'authService.changePassword(', 'authService.setKidPin('],
      'screens/parent/CharactersScreen.tsx': ['characterService.getCharacter(', '<CharacterDetailSheet'],
      'screens/parent/EqSkillsScreen.tsx': ['eqSkillService.getSkills()', 'eqSkillService.getSkill(', 'eqSkillService.getSubSkills('],
      'screens/parent/EqReportScreen.tsx': ['onOpenSkills'],
      'navigation/ParentTabs.tsx': ['<EqSkillsScreen', 'ROUTES.EQ_SKILLS'],
      'screens/parent/WalletScreen.tsx': ['billingService.getPlan(', '<PlanDetailSheet'],
      'screens/kid/KidModeScreen.tsx': ['!source.getMe', '.getMe()', 'me.child.id !== child?.id'],
      'screens/kid/useKidReader.ts': ['source.getSession(play.session.id)'],
      'components/kid/KidReader.tsx': ['reader.resync()'],
    };
    for (const [f, calls_] of Object.entries(must)) {
      const code = noComments(read(f));
      for (const c of calls_) assert.ok(code.includes(c), `${f} thiếu ${c}`);
    }
    // Khu "Máy chủ" và nút kiểm tra /health đã gỡ khỏi Cài đặt; không còn service health trên Mobile
    assert.doesNotMatch(noComments(read('screens/parent/SettingsScreen.tsx')), /checkHealth|\/health/);
    assert.doesNotMatch(noComments(read('services/index.ts')), /systemService/);
  });

  await test('Phase 2 không đụng luồng AI / trả phí / phát âm thanh', () => {
    for (const f of [
      'components/auth/ForgotPasswordSheet.tsx',
      'screens/parent/EqSkillsScreen.tsx',
      'services/eqSkillService.ts',
    ]) {
      assert.doesNotMatch(noComments(read(f)), /generat|portrait\w*\(|narration|checkout|createStory|analyze|Speech|expo-av|expo-audio/i, f);
    }
    assert.doesNotMatch(noComments(read('services/billingService.ts')), /method: 'POST'|checkout|purchase/i);
    assert.doesNotMatch(noComments(read('screens/parent/CharactersScreen.tsx')), /generatePortrait|\/portrait/);
  });

  console.log(`OK ${passed}/${passed}`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
