// apps/mobile/tests/specialistContent.test.ts
// GĐ E2a – Chuyên gia: Chuyện mẫu, Kỹ năng con, Mẫu câu hỏi. Đúng method/path/body từng endpoint (fetch GIẢ, test.invalid —
// không gọi BE thật), kiểm form khớp BE, Dialog trước mọi thao tác ghi, luồng nháp → ban hành, điều hướng màn con.
// Chạy: xem tests/README.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

(globalThis as any).__DEV__ = false; // global của React Native, không có trong Node
process.env.EXPO_PUBLIC_API_URL = 'http://test.invalid';

import { pedagogyService } from '../src/services/pedagogyService';
import { SPECIALIST_ROUTES, backManagement, navigateManagement } from '../src/navigation/managementRoutes';
import {
  SUGGESTED_FORMATS,
  autoTitle,
  draftErrors,
  publishMissing,
  subSkillFormError,
  subSkillSelectable,
  subSkillUpdateBody,
  templateForm,
  templatePayload,
  topicBody,
  topicDeleteConfirm,
  topicForm,
  topicFormError,
  topicUpdateBody,
} from '../src/utils/pedagogy';
import type { ManagedSubSkill, ManagedTopic, QuestionTemplate } from '../src/types/pedagogy';

type Call = { url: string; method: string; body: any };
let calls: Call[] = [];
const respond = (body: unknown, status = 200) => {
  calls = [];
  (globalThis as any).fetch = async (url: string, init: RequestInit = {}) => {
    calls.push({ url, method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  };
};
const ok = (data: unknown, status = 200) => respond({ success: true, data }, status);
const last = () => calls[calls.length - 1];
const path = (c: Call) => c.url.replace(/^http:\/\/test\.invalid\/api\/v1/, '');

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const SK = '11111111-2222-4333-8444-555555555555';
const topic = (patch: Partial<ManagedTopic> = {}): ManagedTopic => ({
  id: 't1', title: 'Chia sẻ đồ chơi', guidance: 'Bé và bạn cùng muốn một món đồ chơi ở lớp.', ageMin: 5, ageMax: 8, displayOrder: 0, isActive: true,
  skillId: SK, skill: { id: SK, caselCode: 'relationship_skills', nameVi: 'Kỹ năng quan hệ' }, creator: null,
  subSkills: [{ id: 's1', nameVi: 'Chia sẻ', caselTextEn: null }], storiesCount: 0, createdAt: '', updatedAt: '', ...patch,
});
const sub = (patch: Partial<ManagedSubSkill> = {}): ManagedSubSkill => ({
  id: 's1', skillId: SK, skill: { id: SK, caselCode: 'relationship_skills', nameVi: 'Kỹ năng quan hệ' }, code: 'RS1', nameVi: 'Chia sẻ',
  descriptionVi: 'Bé biết chia sẻ với bạn bè.', caselTextEn: 'Sharing', ageMin: 5, ageMax: 8, isActive: true, displayOrder: 0,
  templatesCount: 2, publishedTemplatesCount: 1, topicsCount: 1, checkpointsCount: 3, ...patch,
});
const tpl = (patch: Partial<QuestionTemplate> = {}): QuestionTemplate => ({
  id: 'q1', title: 'Hỏi cách xử lý', answerFormat: 'role_choice', isActive: true, subSkillId: 's1', subSkill: { id: 's1', nameVi: 'Chia sẻ', skillId: SK },
  latestPublished: null, draft: { id: 'v1', version: 1, status: 'draft' }, ...patch,
});

const cases: [string, () => void | Promise<void>][] = [
  ['Service: đúng method / path / body cho 13 endpoint (topics, sub-skills, question-templates)', async () => {
    ok([topic()]);
    await pedagogyService.getTopics({ skillId: SK, search: '  chia ', isActive: 'all' });
    assert.deepEqual([last().method, path(last())], ['GET', `/topics?skillId=${SK}&search=chia`]);
    const body = topicBody(topicForm(topic()));
    ok(topic(), 201);
    await pedagogyService.createTopic(body);
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/topics', body]);
    ok(topic());
    await pedagogyService.updateTopic('t1', { isActive: false });
    assert.deepEqual([last().method, path(last()), last().body], ['PUT', '/topics/t1', { isActive: false }]);
    ok({ deleted: false, deactivated: true, message: 'Bài học đang có 2 truyện dùng nên đã chuyển sang ngưng dùng thay vì xoá.' });
    assert.match((await pedagogyService.deleteTopic('t1')).message, /ngưng dùng/);
    assert.deepEqual([last().method, path(last())], ['DELETE', '/topics/t1']);

    ok([sub()]);
    await pedagogyService.getSubSkills({ skillId: SK, isActive: 'true' });
    assert.deepEqual([last().method, path(last())], ['GET', `/sub-skills?skillId=${SK}&isActive=true`]);
    ok(sub());
    await pedagogyService.updateSubSkill('s1', { ageMin: 6 });
    assert.deepEqual([last().method, path(last()), last().body], ['PUT', '/sub-skills/s1', { ageMin: 6 }]);

    ok([tpl()]);
    await pedagogyService.getTemplates({ skillId: SK, isActive: 'false' });
    assert.deepEqual([last().method, path(last())], ['GET', `/question-templates?skillId=${SK}&isActive=false`]);
    ok(tpl(), 201);
    await pedagogyService.createTemplate({ subSkillId: 's1', title: 'Hỏi cách xử lý', answerFormat: 'role_choice' });
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/question-templates', { subSkillId: 's1', title: 'Hỏi cách xử lý', answerFormat: 'role_choice' }]);
    ok(tpl());
    await pedagogyService.updateTemplate('q1', { title: 'Tên mới' });
    assert.deepEqual([last().method, path(last()), last().body], ['PUT', '/question-templates/q1', { title: 'Tên mới' }]);
    ok(tpl());
    await pedagogyService.saveDraft('q1', { questionFrame: 'Bé chọn cách' });
    assert.deepEqual([last().method, path(last()), last().body], ['PUT', '/question-templates/q1/draft', { questionFrame: 'Bé chọn cách' }]);
    ok(tpl({ draft: null, latestPublished: { id: 'v1', version: 1, status: 'published' } }));
    await pedagogyService.publishTemplate('q1');
    assert.deepEqual([last().method, path(last()), last().body], ['POST', '/question-templates/q1/publish', undefined]);
    ok(tpl({ id: 'q2' }), 201);
    await pedagogyService.duplicateTemplate('q1');
    assert.deepEqual([last().method, path(last())], ['POST', '/question-templates/q1/duplicate']);
    ok({ deleted: true, message: 'Đã xoá mẫu câu hỏi.' });
    await pedagogyService.deleteTemplate('q1');
    assert.deepEqual([last().method, path(last())], ['DELETE', '/question-templates/q1']);
  }],

  ['Lỗi BE: "đang được dùng" (409) hiện câu BE; dữ liệu sai dạng → 502', async () => {
    respond({ success: false, message: 'Mẫu đã có 4 điểm dừng dùng, chỉ tắt được.' }, 409);
    await assert.rejects(pedagogyService.deleteTemplate('q1'), (e: any) => e.status === 409 && e.message === 'Mẫu đã có 4 điểm dừng dùng, chỉ tắt được.');
    ok({ topics: [] });
    await assert.rejects(pedagogyService.getTopics(), (e: any) => e.status === 502);
  }],

  ['Chuyện mẫu: form khớp BE; sửa chỉ gửi trường đổi; đã có truyện thì không gửi năng lực; Dialog xoá theo số truyện', () => {
    const f = topicForm();
    assert.deepEqual([f.ageMin, f.ageMax, f.isActive], ['5', '8', true]);
    const good = { ...topicForm(topic()) };
    assert.equal(topicFormError(good), null);
    assert.match(topicFormError({ ...good, title: 'ab' }) ?? '', /3–200/);
    assert.match(topicFormError({ ...good, subSkillIds: [] }) ?? '', /1 đến 3/);
    assert.match(topicFormError({ ...good, subSkillIds: ['a', 'b', 'c', 'd'] }) ?? '', /1 đến 3/);
    assert.match(topicFormError({ ...good, guidance: 'ngắn' }) ?? '', /10 ký tự/);
    assert.match(topicFormError({ ...good, ageMin: '9', ageMax: '6' }) ?? '', /nhỏ hơn hoặc bằng/);
    assert.match(topicFormError({ ...good, ageMax: '19' }) ?? '', /1–18/);
    assert.deepEqual(topicUpdateBody(topic(), { ...good, title: 'Chia sẻ bút màu' }), { title: 'Chia sẻ bút màu' });
    assert.deepEqual(topicUpdateBody(topic({ storiesCount: 3 }), { ...good, skillId: 'other', subSkillIds: ['s9'] }), { subSkillIds: ['s9'] });
    assert.equal(subSkillSelectable({ id: 'x', publishedTemplatesCount: 0 }, []), false); // chưa có mẫu đã ban hành
    assert.equal(subSkillSelectable({ id: 'x', publishedTemplatesCount: 1 }, ['a', 'b', 'c']), false); // đủ 3
    assert.equal(subSkillSelectable({ id: 'a', publishedTemplatesCount: 0 }, ['a']), true); // đã chọn thì bỏ được
    assert.equal(topicDeleteConfirm(topic({ storiesCount: 2 })).confirmLabel, 'Ngưng dùng');
    assert.equal(topicDeleteConfirm(topic()).confirmLabel, 'Xoá');
  }],

  ['Kỹ năng con: chỉ 4 trường BE cho sửa, chỉ trường đổi; kiểm độ dài / tuổi', () => {
    const f = { nameVi: 'Chia sẻ', descriptionVi: 'Bé biết chia sẻ với bạn bè.', ageMin: '6', ageMax: '8' };
    assert.equal(subSkillFormError(f), null);
    assert.ok(subSkillFormError({ ...f, nameVi: 'ab' }));
    assert.ok(subSkillFormError({ ...f, descriptionVi: 'ngắn' }));
    assert.ok(subSkillFormError({ ...f, ageMin: '9' }));
    const body = subSkillUpdateBody(sub(), f);
    assert.deepEqual(body, { ageMin: 6 });
    assert.ok(Object.keys(body).every((k) => ['nameVi', 'descriptionVi', 'ageMin', 'ageMax', 'isActive'].includes(k)));
  }],

  ['Mẫu câu hỏi: payload theo dạng trả lời, luật ban hành như BE, gợi ý dạng theo năng lực CASEL', () => {
    const f = templateForm();
    assert.deepEqual([f.constructiveScore, f.avoidantScore, f.impulsiveScore, f.allowedEmotions.length], ['1', '0.5', '0', 5]);
    assert.match(f.referenceUrl, /^https:\/\/casel\.org/);
    const role = { ...f, questionFrame: ' Bé chọn cách xử lý ', parentPrompts: ['Con sẽ làm gì?', '  '], rationale: 'Đo kỹ năng chia sẻ', constructiveDesc: 'Hỏi mượn', avoidantDesc: 'Bỏ đi', impulsiveDesc: 'Giật lấy' };
    const p = templatePayload(role, 'role_choice');
    assert.deepEqual([p.questionFrame, p.parentPrompts, p.constructiveScore, p.avoidantScore, p.pageSetup], ['Bé chọn cách xử lý', ['Con sẽ làm gì?'], 1, 0.5, null]);
    assert.equal('allowedEmotions' in p, false);
    assert.deepEqual(publishMissing(role, 'role_choice'), []);
    assert.ok(publishMissing({ ...role, avoidantScore: '1' }, 'role_choice').includes('Điểm Tích cực phải lớn hơn hai cách còn lại'));
    assert.ok(publishMissing({ ...role, constructiveScore: '2' }, 'role_choice').includes('Điểm Tích cực (0–1)'));
    assert.deepEqual(publishMissing(f, 'single_correct'), ['① Bé được hỏi về điều gì', '③ Gợi ý cho phụ huynh (1–3 câu)', '④ Căn cứ sư phạm', 'Mô tả đáp án đúng', 'Mô tả đáp án nhiễu']);
    assert.deepEqual(draftErrors(f), []); // nháp được phép thiếu
    assert.ok(draftErrors({ ...f, referenceUrl: 'abc' }).length);
    assert.ok(draftErrors({ ...f, parentPrompts: ['a'.repeat(501)] }).length);
    assert.equal(autoTitle('  Bé   chọn  '), 'Bé chọn');
    assert.ok(autoTitle('a '.repeat(50)).endsWith('…'));
    assert.deepEqual(SUGGESTED_FORMATS.self_management.formats, ['role_choice']);
    const sheet = noComments(read('components/specialist/TemplateSheet.tsx'));
    assert.match(sheet, /suggestion\?\.formats\.includes\(f\) \? `\$\{ANSWER_FORMATS\[f\]\} · gợi ý`/); // chọn năng lực trước, gợi ý dạng
  }],

  ['Luồng nháp → ban hành: tạo (nếu mới) → lưu nháp → ban hành; Dialog trước; không tạo lại khi lưu nháp lỗi', () => {
    const w = noComments(read('screens/specialist/TemplatesScreen.tsx'));
    const confirmAt = w.indexOf('dialog.confirm(templateSaveConfirm(');
    const createAt = w.indexOf('pedagogyService.createTemplate(');
    const draftAt = w.indexOf('pedagogyService.saveDraft(');
    const publishAt = w.indexOf('pedagogyService.publishTemplate(');
    assert.ok(confirmAt > 0 && confirmAt < createAt && createAt < draftAt && draftAt < publishAt, 'thứ tự: Dialog → tạo → lưu nháp → ban hành');
    assert.match(w, /createdId\.current = id;/);
    assert.match(w, /let id = template\?\.id \?\? createdId\.current;/);
    assert.match(w, /return publish \? pedagogyService\.publishTemplate\(id\) : saved;/);
    const sheet = noComments(read('components/specialist/TemplateSheet.tsx'));
    assert.match(sheet, /if \(publish\) p\.push\(\.\.\.publishMissing\(form, format\)\);/);
  }],

  ['Dialog xác nhận TRƯỚC mọi thao tác ghi, chống bấm đúp', () => {
    const pairs: [string, string, string][] = [
      ['screens/specialist/TopicsScreen.tsx', 'dialog.confirm(topicSaveConfirm(topic, f))', 'pedagogyService.updateTopic(topic.id, body)'],
      ['screens/specialist/TopicsScreen.tsx', 'dialog.confirm(topicSaveConfirm(undefined, f))', 'pedagogyService.createTopic('],
      ['screens/specialist/TopicsScreen.tsx', "dialog.confirm(toggleConfirm('chuyện mẫu'", 'pedagogyService.updateTopic(t.id, { isActive'],
      ['screens/specialist/TopicsScreen.tsx', 'dialog.confirm(topicDeleteConfirm(t))', 'pedagogyService.deleteTopic('],
      ['screens/specialist/SubSkillsScreen.tsx', 'Lưu kỹ năng con', 'pedagogyService.updateSubSkill(s.id, body)'],
      ['screens/specialist/SubSkillsScreen.tsx', "dialog.confirm(toggleConfirm('kỹ năng con'", 'pedagogyService.updateSubSkill(s.id, { isActive'],
      ['screens/specialist/TemplatesScreen.tsx', 'dialog.confirm(duplicateConfirm(t))', 'pedagogyService.duplicateTemplate('],
      ['screens/specialist/TemplatesScreen.tsx', "dialog.confirm(toggleConfirm('mẫu'", 'pedagogyService.updateTemplate(t.id, { isActive'],
      ['screens/specialist/TemplatesScreen.tsx', 'dialog.confirm(templateDeleteConfirm(t))', 'pedagogyService.deleteTemplate('],
    ];
    for (const [f, confirm, call] of pairs) {
      const code = noComments(read(f));
      const a = code.indexOf(confirm);
      const b = code.indexOf(call, a);
      assert.ok(a > 0 && b > a, `${f}: "${confirm}" phải đứng trước "${call}"`);
      assert.match(code, /if \(busy\) return;/, f);
    }
    // Xoá chuyện mẫu: hiện đúng câu BE (xoá hẳn hoặc chuyển ngưng dùng)
    assert.match(noComments(read('screens/specialist/TopicsScreen.tsx')), /pedagogyService\.deleteTopic\(t\.id\), \(r\) => r\.message\)/);
  }],

  ['Điều hướng: 3 màn là màn con mở từ "Thêm", Back về menu; không còn "Dùng trên Web" cho 3 mục này; không <Modal> / hex mới', () => {
    const atMenu = navigateManagement('SPECIALIST', [{ route: SPECIALIST_ROUTES.QUEUE }], SPECIALIST_ROUTES.MENU);
    for (const r of [SPECIALIST_ROUTES.TOPICS, SPECIALIST_ROUTES.SUB_SKILLS, SPECIALIST_ROUTES.TEMPLATES]) {
      const s = navigateManagement('SPECIALIST', atMenu, r);
      assert.equal(s.length, 2, `${r} là màn con`);
      assert.deepEqual(backManagement('SPECIALIST', s), atMenu);
    }
    const nav = noComments(read('navigation/SpecialistNavigator.tsx'));
    for (const key of ['sub-skills', 'templates', 'topics']) assert.doesNotMatch(nav, new RegExp(`web\\('${key}'`), key);
    for (const r of ['TOPICS', 'SUB_SKILLS', 'TEMPLATES']) assert.match(nav, new RegExp(`case SPECIALIST_ROUTES\\.${r}:`));
    for (const f of ['screens/specialist/TopicsScreen.tsx', 'screens/specialist/SubSkillsScreen.tsx', 'screens/specialist/TemplatesScreen.tsx', 'components/specialist/TemplateSheet.tsx']) {
      assert.doesNotMatch(noComments(read(f)), /<Modal\b|#[0-9a-fA-F]{3,8}\b/, f);
    }
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
