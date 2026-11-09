// apps/mobile/tests/legal.test.ts
// GĐ C – Trang pháp lý + gợi ý mô tả ở form hồ sơ bé: nội dung chép nguyên văn từ Web (đủ đề mục, đúng thứ tự),
// liên kết có ở Đăng nhập / Đăng ký / Trợ giúp, Back quay về đúng màn trước, form bé có ô ngoại hình + gợi ý và
// không gỡ nhầm nhân vật đại diện. Không gọi API. Chạy: xem tests/README.md.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { AUTH_FOOTER_LINKS, LEGAL_DOCS } from '../src/constants/legal';
import { ROUTES, backStack, navigateStack } from '../src/navigation/routes';
import { CHILD_APPEARANCE_MAX, childAppearancePayload } from '../src/utils/child';

const src = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(src, rel), 'utf8');
const noComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const webPage = (name: string) => join(process.cwd(), '../../../Web/src/pages/legal', name);

const cases: [string, () => void][] = [
  ['Nội dung không rỗng; đủ số đề mục như Web (Chính sách 9, Điều khoản 10)', () => {
    assert.equal(LEGAL_DOCS.privacy.sections.length, 9);
    assert.equal(LEGAL_DOCS.terms.sections.length, 10);
    for (const doc of Object.values(LEGAL_DOCS)) {
      assert.ok(doc.title && doc.intro.length > 50);
      for (const s of doc.sections) {
        assert.ok(s.title.trim(), 'đề mục rỗng');
        assert.ok(s.body.length > 0, `${s.title}: không có nội dung`);
        for (const b of s.body) assert.ok(Array.isArray(b) ? b.length > 0 && b.every((x) => x.trim()) : b.trim(), `${s.title}: đoạn rỗng`);
      }
    }
  }],
  ['Chép nguyên văn từ Web: đúng thứ tự đề mục, mọi câu chữ của Web có mặt ở Mobile', () => {
    const pairs: [string, keyof typeof LEGAL_DOCS][] = [['PrivacyPolicyPage.jsx', 'privacy'], ['TermsPage.jsx', 'terms']];
    for (const [file, key] of pairs) {
      const path = webPage(file);
      if (!existsSync(path)) {
        console.log(`  (bỏ qua ${file}: không thấy Web cạnh App)`);
        continue;
      }
      const web = readFileSync(path, 'utf8');
      const webTitles = [...web.matchAll(/^\s*title: "([^"]+)"/gm)].map((m) => m[1]);
      assert.deepEqual(LEGAL_DOCS[key].sections.map((s) => s.title), webTitles, `${file}: đề mục`);
      // Mọi chuỗi trong nháy kép (đoạn / gạch đầu dòng / tiêu đề / lời mở đầu) phải có nguyên văn trong bản Mobile
      const mobile = JSON.stringify(LEGAL_DOCS[key]);
      // Chỉ chuỗi trên một dòng, không chứa backtick (bỏ đoạn code như toLocaleString("vi-VN")…`)
      const strings = [...web.matchAll(/"([^"\\\n`]{15,})"/g)].map((m) => m[1]).filter((s) => !s.startsWith('../'));
      assert.ok(strings.length > 20, `${file}: đọc được quá ít câu`);
      for (const s of strings) assert.ok(mobile.includes(JSON.stringify(s).slice(1, -1)), `${file}: thiếu "${s.slice(0, 60)}…"`);
    }
    // Câu có con số (Web dùng template + POLICY_NUMBERS)
    const terms = JSON.stringify(LEGAL_DOCS.terms);
    for (const t of ['Người bán nhận 80% giá niêm yết', 'được giữ 3 ngày', 'mức rút tối thiểu 50.000đ', 'hoàn tiền trong 3 ngày', 'Khi đủ 3 phụ huynh khác nhau', 'hiệu lực 90 ngày; đủ 3 cảnh cáo']) {
      assert.ok(terms.includes(t), t);
    }
  }],
  ['Liên kết: Đăng nhập + Đăng ký có 2 liên kết chân trang; mở được khi chưa đăng nhập', () => {
    assert.deepEqual(AUTH_FOOTER_LINKS.map((l) => [l.doc, l.label]), [['privacy', 'Chính sách bảo mật'], ['terms', 'Điều khoản sử dụng']]);
    for (const f of ['screens/auth/LoginScreen.tsx', 'screens/auth/RegisterScreen.tsx']) {
      assert.match(noComments(read(f)), /<LegalLinks onOpen=\{onOpenLegal\} \/>/, f);
    }
    const nav = noComments(read('navigation/AppNavigator.tsx'));
    assert.match(nav, /if \(legal && \(auth\.appPhase === 'LOGIN' \|\| auth\.appPhase === 'REGISTER'\)\)/);
    assert.equal(nav.match(/onOpenLegal=\{setLegal\}/g)?.length, 2);
    // Back (nút + phím Android) quay về màn auth đang mở
    assert.match(nav, /<LegalScreenWithBack doc=\{legal\} onBack=\{\(\) => setLegal\(null\)\} \/>/);
    assert.match(nav, /hardwareBackPress', \(\) => \{\s*onBack\(\);\s*return true;/);
  }],
  ['Trợ giúp (đã đăng nhập): 2 mục mở trang pháp lý; Back về Trợ giúp', () => {
    const help = noComments(read('screens/parent/HelpScreen.tsx'));
    assert.ok(help.includes("label: 'Chính sách bảo mật'") && help.includes("label: 'Điều khoản dịch vụ'"));
    assert.match(help, /onPress=\{\(\) => onOpenLegal\(l\.doc\)\}/);
    const tabs = noComments(read('navigation/ParentTabs.tsx'));
    assert.match(tabs, /case ROUTES\.PRIVACY:\s*return <LegalScreen doc="privacy" onBack=\{goBack\} \/>/);
    assert.match(tabs, /case ROUTES\.TERMS:\s*return <LegalScreen doc="terms" onBack=\{goBack\} \/>/);
    const atHelp = navigateStack([{ route: ROUTES.MORE }], ROUTES.HELP);
    const atPrivacy = navigateStack(atHelp, ROUTES.PRIVACY);
    assert.deepEqual(backStack(atPrivacy), atHelp);
  }],
  ['Form hồ sơ bé: ô "Ngoại hình của bé" + gợi ý dùng chung với form nhân vật (B3), không chặn lưu', () => {
    const form = noComments(read('components/parent/ChildFormSheet.tsx'));
    assert.match(form, /label="Ngoại hình của bé \(không bắt buộc\)"/);
    assert.match(form, /<AppearanceHints value=\{appearance\} \/>/);
    assert.match(form, /import \{ AppearanceHints \} from '\.\/AppearanceHints'/);
    assert.match(noComments(read('components/parent/CharacterFormSheet.tsx')), /import \{ AppearanceHints \} from '\.\/AppearanceHints'/);
    assert.doesNotMatch(form, /appearanceRisks/, 'gợi ý không chặn lưu');
    assert.equal(CHILD_APPEARANCE_MAX, 500);
  }],
  ['Payload ngoại hình: tạo mới bỏ trống không gửi; sửa chỉ gửi null khi xoá mô tả đang có (BE gỡ nhân vật đại diện)', () => {
    assert.equal(childAppearancePayload('  tóc đen  ', undefined, false), 'tóc đen');
    assert.equal(childAppearancePayload('', undefined, false), undefined);
    assert.equal(childAppearancePayload('tóc nâu', 'tóc đen', true), 'tóc nâu');
    assert.equal(childAppearancePayload('   ', 'tóc đen', true), null);
    assert.equal(childAppearancePayload('', undefined, true), undefined, 'chưa có mô tả → không đụng nhân vật');
    assert.equal(childAppearancePayload('', '  ', true), undefined);
  }],
];

let failed = 0;
for (const [name, run] of cases) {
  try {
    run();
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`FAIL  ${name}\n      ${(e as Error).message}`);
  }
}
console.log(`\n${cases.length - failed}/${cases.length} PASS`);
process.exit(failed ? 1 : 0);
