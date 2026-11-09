# CLAUDE.md – StoryWeaver Mobile (App)

@AGENTS.md

## 0. Ngôn ngữ
- Giao tiếp với chủ dự án (giải thích, tiến độ, vướng mắc, kết quả QA) và tài liệu `docs/mobile`: **tiếng Việt**.
- Giữ **tiếng Anh** cho source code, identifier, tên API, lệnh terminal, commit message. Giữ nguyên ngôn ngữ UI hiện có của app.
- Không lặp một chỉ dẫn bằng cả hai ngôn ngữ.


## 1. Bối cảnh
Workspace `D:\fpt\SEP\SEP` gồm 4 repo:
- `App` – **repo Mobile chính thức** (sẽ sửa). Runtime thật: `App/apps/mobile`.
- `App_v2` – chỉ là **mẫu kiến trúc/UI**. KHÔNG sửa, KHÔNG thay thế App.
- `Web` – nguồn chuẩn về UI, hành trình người dùng, nghiệp vụ. KHÔNG sửa.
- `BE` – Backend (Express 5, Prisma, zod). Nguồn chuẩn API contract. KHÔNG sửa.

Đã xong: nối API thật phase 1–3 (commit `d727f8c`), UI Admin/Specialist (`08b26ef`), dọn mock/fake fallback.
Mục tiêu hiện tại (xem §12): **cập nhật Mobile theo những gì Web/BE vừa thay đổi**, không xây lại Mobile. Cụ thể: thêm tính năng Web mới mà Mobile chưa có; cập nhật tính năng Mobile đã có nhưng Web vừa đổi nghiệp vụ/UI; bổ sung API còn thiếu; sửa API lệch contract BE; kiểm thử lại.

## 2. Quyết định đã duyệt (không tự đổi)
1. **Giữ Expo SDK 52** (phương án A). Không nâng SDK, không migrate sang App_v2/SDK 58.
2. App là repo chính; App_v2 chỉ tham khảo.
3. **P0 = Parent + Kid Mode.**
4. Seller, Marketplace, Payment: **được triển khai theo lộ trình** (§12), không còn SCOPE_PENDING. Phần gọi API thật/giao dịch vẫn theo §11.
   Admin/Specialist Mobile: đã làm các chức năng quản trị chính, lời gọi API viết theo contract BE — Admin: Tổng quan, Việc chờ, Tài khoản, Rút tiền, Hoàn tiền, Kháng nghị, Nhật ký kiểm toán; Specialist: Hàng chờ, Lượt duyệt, Hồ sơ người bán, Báo cáo vi phạm. Kiểm thử: FIXTURE PASS (BE giả); **E2E với BE thật: NOT VERIFIED / BLOCKED**. Tính năng chưa làm và việc chờ duyệt: `docs/mobile/ADMIN_SPECIALIST_MOBILE_IMPLEMENTATION.md`. Mở rộng phạm vi cần chủ dự án duyệt; tuân thủ §10.
5. **Không tự ý xóa tính năng/màn hình hiện có.** Muốn xóa phải được duyệt.

## 3. Quy tắc bắt buộc
- Chỉ làm đúng task được giao (lộ trình giao diện: `docs/mobile/UI_UX_REDESIGN_PLAN.md`, tiến độ: `docs/mobile/MOBILE_STATUS.md`). Làm xong một đợt thì dừng chờ review; không tự sang đợt kế. K1 (khôi phục Kid Mode sau restart, cần `expo-secure-store`) là task riêng, **chưa được duyệt**.
- **Không cài/đổi dependency** khi chưa được duyệt. Nếu duyệt: dùng `npx expo install` (đúng SDK 52).
- **Không đoán API.** Contract lấy từ `docs/mobile/API_MAPPING.md`; điểm chưa chắc ghi UNKNOWN và hỏi người dùng. Có thể đọc BE (`BE/api/src/modules/<module>/*.routes.js|*.service.js|*.validation.js`, Swagger `BE/api/src/docs/`) và Web (`Web/src/services/*.js`, `Web/src/pages/`, `Web/src/routes/`) để xác minh. Nguồn chuẩn khi lệch nhau: BE source > Web source > tài liệu.
- **Cấm fake-success**: không token giả, user demo, ví/thanh toán giả, dữ liệu bịa khi API lỗi. Lỗi → hiển thị lỗi thật + trạng thái rỗng/thử lại.
- Không hiển thị/ghi secret từ `.env`. Không hardcode URL/khóa trong code.
- Không sửa `Web`, `BE`, `App_v2`. Không commit/push trừ khi được yêu cầu rõ.
- Giữ nguyên comment/docstring không liên quan thay đổi.
- Prototype Vite/Express/Prisma ở gốc `App/` **đã được xóa** (báo cáo dọn dẹp cũ: lịch sử Git `a9160a7`). Repo chỉ còn `apps/mobile` + `docs/mobile`; kiểu miền nằm ở `apps/mobile/src/types/domain.ts`.

## 4. Quy ước kỹ thuật
- Stack (xác minh lại ở `apps/mobile/package.json` khi cần): Expo ~52, RN 0.76.9, React 18.3.1, Reanimated ~3.16, TypeScript. Điều hướng bằng state (`src/navigation/`, ADR-015), chưa có router. Design System: `src/theme/*` + `src/components/ui/*` (R1–R3); dùng lại, không thêm hex/emoji-icon mới.
- Web (chỉ để tham khảo): React 19 + Vite, `react-router-dom` 7, `@tanstack/react-query`, axios. Không mang các thư viện này sang Mobile; ánh xạ sang pattern Mobile hiện có.
- HTTP: dùng `fetch` + wrapper riêng (envelope `{success,message,data?}`, lỗi `errors[]`, timeout, single-flight refresh khi 401). **Không thêm axios.**
- Token hiện lưu qua `services/storage.ts` (Web: localStorage; native: bộ nhớ, mất khi restart); `expo-secure-store` chỉ khi K1 được duyệt. Kid session token **tách riêng** khỏi parent token; không refresh kid bằng parent token.
- Mapper dữ liệu BE → UI nằm ở lớp service; không bịa field.
- Kid PIN: xác minh **chỉ qua BE** (`/auth/kid-mode/enter|exit`). Không so sánh PIN cục bộ, không backdoor.

## 5. Tài liệu (nguồn sự thật: source + Git; docs chỉ đọc phần liên quan task)
- Mục lục: `docs/mobile/README.md`. Giao diện: `UI_UX_REDESIGN_PLAN.md`. Hiện trạng chính thức: `MOBILE_STATUS.md` (đối chiếu với source/Git).
- API/nghiệp vụ: `API_MAPPING.md`, `BUSINESS_FLOW_MATRIX.md`, `ARCHITECTURE_DECISIONS.md`, `ENVIRONMENT.md`. Tích hợp API: `API_INTEGRATION_STATUS_REPORT.md` (+ `_AUDIT`, `_PHASE_1`, `_PHASE_2`), test: `API_SWAGGER_TEST_MATRIX.md`, `MOBILE_API_MANUAL_TEST_MATRIX.md`. Admin/Specialist: `ADMIN_SPECIALIST_MOBILE_IMPLEMENTATION.md`.
- Đợt cập nhật theo Web: `MOBILE_UPDATE_GAP_ANALYSIS.md` (§12).
- Báo cáo/kế hoạch cũ (QA R1–R9-A, `AUDIT_REPORT.md`, `IMPLEMENTATION_PLAN.md`) đã xóa: `git show a9160a7:docs/mobile/<tên-file>`.
- Không chép lại nguyên tài liệu vào CLAUDE.md; không tạo file memory/handoff/tài liệu trùng lặp.

## 6. Quy trình mỗi task
1. Hiểu task, đọc code liên quan; đối chiếu yêu cầu với tài liệu đã duyệt. 2. Xác định file ảnh hưởng và nguy cơ regression. 3. `git status`/branch trước việc lớn; giữ nguyên thay đổi không liên quan. 4. Sửa tối thiểu trong phạm vi được giao, dùng lại component/hook/service/token có sẵn. 5. Chạy kiểm tra phù hợp. 6. Sửa lỗi do chính mình gây ra. 7. Cập nhật tiến độ/QA. 8. Báo cáo (tiếng Việt) rồi dừng. Việc nhỏ: lập kế hoạch tương xứng; việc lớn: chia mốc, không cần hỏi lại sau mỗi component.

## 7. Kỹ thuật & chất lượng
- TypeScript chặt: tránh `any`/ép kiểu không có lý do; không nuốt lỗi. Giữ API contract; mọi màn xử lý đủ loading/empty/error/success. Không mock/fake-success ở production.
- Giữ nguyên Auth, Session, ranh giới Parent/Kid, PIN qua BE. Giữ accessibility (nhãn, vùng chạm ≥ 44pt Parent / 56pt Kid), safe area, Reduce Motion. Không refactor ngoài phạm vi.

## 8. Kiểm thử & báo cáo
- Kiểm chứng đúng phần đã đổi: `npx tsc --noEmit`, `tests/*.test.ts` (xem `tests/README.md`), `npx expo install --check`, `expo export` Web/Android, chạy thực tế Web + emulator `SW_Test` khi cần. Luồng Auth/Session/Kid/PIN/navigation bị đụng thì phải kiểm regression.
- Chỉ ghi PASS khi đã chạy thành công; phân biệt **PASS / FAIL / BLOCKED / NOT RUN / NOT VERIFIED**; nêu giới hạn và lỗi còn mở, không giấu test hỏng.

## 9. Hiệu quả ngữ cảnh (không đánh đổi độ đúng/bảo mật/kiểm thử)
- Tìm bằng grep/diff có mục tiêu trước khi đọc cả thư mục; không quét lại cùng file khi không có lý do; tái dùng ngữ cảnh đã xác minh trong task.
- Không đọc mọi báo cáo QA hay module không liên quan; không chạy lại build/test tốn kém khi chưa đổi gì. Báo tiến độ ngắn nhưng đủ phát hiện quan trọng.

## 10. Protected Architecture & Change Scope
Bổ sung (không thay) §2–§3, §6–§8 và `AGENTS.md`; quyền sửa theo đường dẫn vẫn do `AGENTS.md` §1 quyết định.
- Giữ nguyên kiến trúc Mobile đã ổn định (điều hướng state ADR-015, store `SessionProvider`, Design System R1–R2, cấu trúc thư mục). Không đổi tên/di chuyển module hay refactor chỉ để "gọn"; mỗi file sửa phải liên quan trực tiếp đến task được duyệt.
- Không đổi hành vi Parent/Kid đang ổn định (đăng nhập, phiên, PIN, Story Wizard, Reader, EQ) khi chưa có lý do xác nhận và chủ dự án duyệt trước.
- Cần sửa ngoài phạm vi (BE, Web, App_v2, kiến trúc chung, Parent/Kid, cấu hình Expo, dependency): dừng trước khi sửa, báo file cụ thể, vấn đề, lý do, tác dụng phụ dự kiến và cách sửa tối thiểu; chờ duyệt.
- Giữ nguyên file Git đang dở dang của người khác/không liên quan: không revert, không stage, không gộp vào thay đổi của mình.
- Thành công với BE giả/fixture/mock chỉ được ghi là FIXTURE PASS, không bao giờ là tích hợp thật hay E2E PASS.
- Thao tác BE nhạy cảm/không hoàn tác (duyệt/từ chối nội dung, rút tiền, hoàn tiền, cảnh cáo, khoá tài khoản, đổi cấu hình, xoá dữ liệu, tiêu credit, gọi AI) trên dữ liệu thật cần chủ dự án cho phép rõ ràng cho từng lần.

## 11. AI / Tạo truyện / API trả phí: Claude viết code, chủ dự án chạy thật
Bổ sung (không thay) §10.

**ĐƯỢC (theo task đã duyệt trong lộ trình §12):** viết code, UI, service, hook, type và nối API cho Story Wizard, Story Editor, sinh truyện/phân tích truyện, sinh tranh, chân dung nhân vật, giọng đọc (TTS), thanh toán/gói/credit, Seller/Marketplace. Viết unit test chỉ dùng fetch giả (không chạm mạng).

**VẪN CẤM Claude tự làm (chỉ chủ dự án làm, chủ dự án tự test thật):**
1. Gửi bất kỳ request thật nào tới API sinh truyện, phân tích, tranh, chân dung, audio/TTS, hay API tiêu credit/token.
2. Gọi AI provider, model, worker, hàng đợi sinh nội dung hay dịch vụ bên thứ ba trả phí.
3. Chạy E2E, smoke test, demo script, seed script hay test nào có thể chạm BE thật và kích hoạt các luồng trên.
4. Khởi động worker/tiến trình nền có thể tự kích hoạt sinh AI.
5. Mua gói, thu tiền, hoàn tiền, rút tiền, đổi số dư credit hay bất kỳ giao dịch tài chính nào.
6. Dùng tài khoản/dữ liệu thật hoặc demo cho thao tác trả phí hay phá huỷ. Không ghi tài khoản/mật khẩu vào file nào.

**Báo cáo:** phần đã viết code nhưng chưa được chủ dự án test thật ghi là `OWNER_RESERVED` (chờ chủ dự án test), không ghi PASS/E2E. Thao tác có thể phát sinh chi phí: DỪNG và xin phép rõ ràng.

Ranh giới dự án giữ nguyên: BE, Web, App_v2 chỉ đọc; giữ kiến trúc Mobile; giữ tính năng Parent/Kid/Admin/Specialist ổn định; không refactor ngoài phạm vi; không thêm dependency khi chưa duyệt; không tự commit/push.

## 12. Đợt hiện tại: Cập nhật Mobile theo Web (Gap Analysis)
Bổ sung (không thay) §2–§11. Báo cáo: `docs/mobile/MOBILE_UPDATE_GAP_ANALYSIS.md`.
Lộ trình: Project "đồ án" → `StoryWeaver/LO_TRINH_MOBILE.md` (nằm ngoài repo; làm theo từng GĐ của lộ trình, xong GĐ nào thì dừng chờ review).

**Tiến độ:** GĐ 0–1 (gap analysis) xong · GĐ 4 dịch lỗi + lý do chân dung xong (`e0aaadd`) · **GĐ A** (sửa sau review, env deploy) trên branch `feat/mobile-error-i18n`.

**Các giai đoạn** — mỗi giai đoạn xong thì DỪNG chờ chủ dự án review; không tự sang giai đoạn kế:
- **GĐ 0 – Kiểm tra source (chỉ đọc):** branch, commit mới nhất, `git status` của cả 4 repo; ghi nhận file modified/untracked/deleted; xác định framework/dependency chính. Không `reset`/`checkout`/`restore`/`rebase`/`stash`/xoá file, kể cả để "dọn" thay đổi có sẵn.
- **GĐ 1 – Review thay đổi + viết báo cáo:** KHÔNG sửa source nào, chỉ tạo/sửa file báo cáo trên. Ưu tiên Git history/diff của Web và BE (theo commit, reflog) để biết chính xác cái gì mới; không phân tích lại phần Web không đổi.
- **GĐ 2+ – Triển khai:** chỉ khi chủ dự án duyệt danh sách tính năng/ưu tiên trong báo cáo.

**Cách review mỗi tính năng Web mới/đổi:**
1. Web: màn hình, form, navigation, UI/UX, API dùng, role (Parent / Admin / Specialist; Kid nếu có).
2. BE: method + URL, params/query/body, response, `authorize(...)`, validation (zod), business rule, side effect. Không xác minh được → `NEEDS_BACKEND_REVIEW`.
3. Mobile: tìm screen/service/type/navigation tương ứng; kiểm tra đã thực sự gọi API chưa, type có khớp BE không. Không kết luận "thiếu" chỉ vì cấu trúc file khác Web.

**Trạng thái mỗi tính năng (dùng đúng nhãn):** `ALREADY_SUPPORTED` · `NEEDS_UI_UPDATE` · `NEEDS_FEATURE_UPDATE` · `NEEDS_API_INTEGRATION` · `NEEDS_API_FIX` · `NEEDS_NEW_SCREEN` · `NEEDS_BACKEND_REVIEW` · `NOT_NEEDED_ON_MOBILE`. Thêm `OWNER_RESERVED` cho phần chờ chủ dự án test thật (§11) và `SCOPE_PENDING` cho phần ngoài lộ trình, chưa được duyệt.

**Mức bằng chứng cho mỗi nhận định:** `VERIFIED_FROM_SOURCE` (kèm `file:line`) · `DOCUMENTED` · `INFERRED` · `NOT_VERIFIED_AT_RUNTIME`.

**Báo cáo gồm:** trạng thái Git ban đầu; cập nhật mới của Web; thay đổi BE liên quan; bảng đối chiếu Web – BE – Mobile; phần Mobile đã đủ; phần cần cập nhật; phần còn thiếu; API chưa tích hợp/cần sửa; API BE chưa hỗ trợ/chưa xác minh; file Mobile dự kiến đổi; ưu tiên P0/P1/P2; rủi ro + phụ thuộc giữa tính năng; phần chưa xác minh được; kế hoạch triển khai theo nhóm tính năng.

**UI/UX:** Web là nguồn cho màu, nội dung, cấu trúc thông tin, nghiệp vụ, thao tác — không chép layout Web. Chỉ thiết kế lại phần thực sự cần cập nhật cho điện thoại, dùng Design System Mobile sẵn có; giữ nguyên screen/component đang tốt.

**Trong GĐ 0–1 không được:** gọi API làm đổi dữ liệu hoặc API AI; chạy migration/seed; cài package; đọc/ghi giá trị trong `.env*`, token, mật khẩu; đưa thông tin đăng nhập vào báo cáo.
