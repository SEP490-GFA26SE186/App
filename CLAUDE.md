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

Mục tiêu: (1) đồng bộ UI/luồng với Web & BE, (2) nối API thật, (3) refactor kiến trúc App học từ App_v2, (4) loại bỏ mock/fake fallback khỏi runtime mobile.

## 2. Quyết định đã duyệt (không tự đổi)
1. **Giữ Expo SDK 52** (phương án A). Không nâng SDK, không migrate sang App_v2/SDK 58.
2. App là repo chính; App_v2 chỉ tham khảo.
3. **P0 = Parent + Kid Mode.**
4. Seller, Marketplace, Payment = **SCOPE PENDING**: không phát triển thêm, không kết nối mới.
   Admin/Specialist Mobile: đã làm các chức năng quản trị chính, lời gọi API viết theo contract BE — Admin: Tổng quan, Việc chờ, Tài khoản, Rút tiền, Hoàn tiền, Kháng nghị, Nhật ký kiểm toán; Specialist: Hàng chờ, Lượt duyệt, Hồ sơ người bán, Báo cáo vi phạm. Kiểm thử: FIXTURE PASS (BE giả); **E2E với BE thật: NOT VERIFIED / BLOCKED**. Tính năng chưa làm và việc chờ duyệt: `docs/mobile/ADMIN_SPECIALIST_MOBILE_IMPLEMENTATION.md`. Mở rộng phạm vi cần chủ dự án duyệt; tuân thủ §10.
5. **Không tự ý xóa tính năng/màn hình hiện có.** Muốn xóa phải được duyệt.

## 3. Quy tắc bắt buộc
- Chỉ làm đúng task được giao (lộ trình giao diện: `docs/mobile/UI_UX_REDESIGN_PLAN.md`, tiến độ: `docs/mobile/MOBILE_STATUS.md`). Làm xong một đợt thì dừng chờ review; không tự sang đợt kế. K1 (khôi phục Kid Mode sau restart, cần `expo-secure-store`) là task riêng, **chưa được duyệt**.
- **Không cài/đổi dependency** khi chưa được duyệt. Nếu duyệt: dùng `npx expo install` (đúng SDK 52).
- **Không đoán API.** Contract lấy từ `docs/mobile/API_MAPPING.md`; điểm chưa chắc ghi UNKNOWN và hỏi người dùng. Có thể đọc BE (`BE/src/modules/*`, Swagger `/api/v1/docs`) và Web (`Web/src/services/*.js`) để xác minh.
- **Cấm fake-success**: không token giả, user demo, ví/thanh toán giả, dữ liệu bịa khi API lỗi. Lỗi → hiển thị lỗi thật + trạng thái rỗng/thử lại.
- Không hiển thị/ghi secret từ `.env`. Không hardcode URL/khóa trong code.
- Không sửa `Web`, `BE`, `App_v2`. Không commit/push trừ khi được yêu cầu rõ.
- Giữ nguyên comment/docstring không liên quan thay đổi.
- Prototype Vite/Express/Prisma ở gốc `App/` **đã được xóa** (báo cáo dọn dẹp cũ: lịch sử Git `a9160a7`). Repo chỉ còn `apps/mobile` + `docs/mobile`; kiểu miền nằm ở `apps/mobile/src/types/domain.ts`.

## 4. Quy ước kỹ thuật
- Stack (xác minh lại ở `apps/mobile/package.json` khi cần): Expo ~52, RN 0.76.9, React 18.3.1, Reanimated ~3.16, TypeScript. Điều hướng bằng state (`src/navigation/`, ADR-015), chưa có router. Design System: `src/theme/*` + `src/components/ui/*` (R1–R3); dùng lại, không thêm hex/emoji-icon mới.
- HTTP: dùng `fetch` + wrapper riêng (envelope `{success,message,data?}`, lỗi `errors[]`, timeout, single-flight refresh khi 401). **Không thêm axios.**
- Token hiện lưu qua `services/storage.ts` (Web: localStorage; native: bộ nhớ, mất khi restart); `expo-secure-store` chỉ khi K1 được duyệt. Kid session token **tách riêng** khỏi parent token; không refresh kid bằng parent token.
- Mapper dữ liệu BE → UI nằm ở lớp service; không bịa field.
- Kid PIN: xác minh **chỉ qua BE** (`/auth/kid-mode/enter|exit`). Không so sánh PIN cục bộ, không backdoor.

## 5. Tài liệu (nguồn sự thật: source + Git; docs chỉ đọc phần liên quan task)
- Mục lục: `docs/mobile/README.md`. Giao diện: `UI_UX_REDESIGN_PLAN.md` (kế hoạch). Hiện trạng chính thức: `MOBILE_STATUS.md` (đối chiếu với source/Git). R9-B: `R9B_MANUAL_TEST_PLAN.md`, `QA_R9B_READINESS.md`. Báo cáo QA R1–R9-A cũ đã xóa (lịch sử Git `a9160a7`).
- API/nghiệp vụ: `API_MAPPING.md`, `BUSINESS_FLOW_MATRIX.md`, `ARCHITECTURE_DECISIONS.md`. Hiện trạng/kế hoạch cũ (`AUDIT_REPORT.md`, `IMPLEMENTATION_PLAN.md`) đã xóa, xem lịch sử Git `a9160a7`.
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

## 11. Bảo vệ AI / Tạo truyện / API trả phí (chỉ chủ dự án)
Chủ dự án độc quyền kiểm soát mọi luồng AI, tiêu credit, thanh toán và tạo truyện. Bổ sung (không thay) §10. **Cấm tuyệt đối nếu chưa có phép riêng, rõ ràng của chủ dự án:**
1. Triển khai/thay đổi Story Wizard, sinh truyện AI, phân tích truyện, chỉnh sửa truyện hoặc luồng tạo truyện.
2. Triển khai/thay đổi sinh tranh AI hoặc chân dung nhân vật.
3. Triển khai/thay đổi giọng đọc AI phía server, sinh TTS hoặc luồng thử lại giọng đọc.
4. Gọi bất kỳ AI provider, model, worker, hàng đợi sinh nội dung hay dịch vụ bên thứ ba trả phí.
5. Gửi request API sinh truyện, tranh, audio, chân dung hoặc tiêu credit.
6. Chạy test tự động, E2E, smoke test, demo script hay seed script có thể kích hoạt các luồng trên.
7. Khởi động worker/tiến trình nền có thể tự kích hoạt sinh AI.
8. Đổi số dư credit, mua gói, thu tiền, hoàn tiền hoặc bất kỳ giao dịch tài chính nào.
9. Dùng tài khoản/dữ liệu thật hoặc demo cho thao tác test trả phí hay phá huỷ.
10. Gián tiếp sửa logic tạo truyện, AI hay credit đang ổn định qua component dùng chung.

**Task nối 35 API sắp tới:**
- LOẠI TRỪ toàn bộ tạo truyện, Story Editor, sinh AI, sinh tranh, chân dung AI, sinh giọng đọc và luồng trả phí; không sửa UI, service call, hook, cấu hình hay tích hợp BE của chúng.
- Chủ dự án tự triển khai và tự kiểm thử thủ công các phần đó.
- Được đọc mã liên quan (READ-ONLY) để viết tài liệu và phân tích phụ thuộc.
- Ghi rõ các mục này là **OWNER-RESERVED / NOT IMPLEMENTED** trong báo cáo tích hợp; không tính API owner-reserved là "mới nối".

**Được phép:**
- Triển khai chức năng Mobile không-AI, không-trả-phí đã được duyệt rõ ràng.
- Phân tích tĩnh, TypeScript check, build verification, miễn không kích hoạt API trả phí thật hay sinh nội dung nền.
- Không tự khởi chạy luồng ứng dụng có thể tiêu credit. Thao tác có thể phát sinh chi phí hoặc chạm phần được bảo vệ: DỪNG trước khi chạy và xin phép rõ ràng.

Ranh giới dự án giữ nguyên: BE, Web, App_v2 chỉ đọc; giữ kiến trúc Mobile; giữ tính năng Parent/Kid/Admin/Specialist ổn định; không refactor ngoài phạm vi; không thêm dependency khi chưa duyệt; không tự commit/push.
