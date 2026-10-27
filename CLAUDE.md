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
4. Seller, Specialist, Admin, Marketplace, Payment = **SCOPE PENDING**: không phát triển thêm, không kết nối mới.
5. **Không tự ý xóa tính năng/màn hình hiện có.** Muốn xóa phải được duyệt.

## 3. Quy tắc bắt buộc
- Chỉ làm đúng task được giao (lộ trình giao diện: `docs/mobile/UI_UX_REDESIGN_PLAN.md`, tiến độ: `UI_REDESIGN_PROGRESS.md`). Làm xong một đợt thì dừng chờ review; không tự sang đợt kế. K1 (khôi phục Kid Mode sau restart, cần `expo-secure-store`) là task riêng, **chưa được duyệt**.
- **Không cài/đổi dependency** khi chưa được duyệt. Nếu duyệt: dùng `npx expo install` (đúng SDK 52).
- **Không đoán API.** Contract lấy từ `docs/mobile/API_MAPPING.md`; điểm chưa chắc ghi UNKNOWN và hỏi người dùng. Có thể đọc BE (`BE/src/modules/*`, Swagger `/api/v1/docs`) và Web (`Web/src/services/*.js`) để xác minh.
- **Cấm fake-success**: không token giả, user demo, ví/thanh toán giả, dữ liệu bịa khi API lỗi. Lỗi → hiển thị lỗi thật + trạng thái rỗng/thử lại.
- Không hiển thị/ghi secret từ `.env`. Không hardcode URL/khóa trong code.
- Không sửa `Web`, `BE`, `App_v2`. Không commit/push trừ khi được yêu cầu rõ.
- Giữ nguyên comment/docstring không liên quan thay đổi.
- Prototype Vite/Express/Prisma ở gốc `App/` **đã được xóa** (ARCHITECTURE_CLEANUP_REPORT.md). Repo chỉ còn `apps/mobile` + `docs/mobile`; kiểu miền nằm ở `apps/mobile/src/types/domain.ts`.

## 4. Quy ước kỹ thuật
- Stack (xác minh lại ở `apps/mobile/package.json` khi cần): Expo ~52, RN 0.76.9, React 18.3.1, Reanimated ~3.16, TypeScript. Điều hướng bằng state (`src/navigation/`, ADR-015), chưa có router. Design System: `src/theme/*` + `src/components/ui/*` (R1–R3); dùng lại, không thêm hex/emoji-icon mới.
- HTTP: dùng `fetch` + wrapper riêng (envelope `{success,message,data?}`, lỗi `errors[]`, timeout, single-flight refresh khi 401). **Không thêm axios.**
- Token hiện lưu qua `services/storage.ts` (Web: localStorage; native: bộ nhớ, mất khi restart); `expo-secure-store` chỉ khi K1 được duyệt. Kid session token **tách riêng** khỏi parent token; không refresh kid bằng parent token.
- Mapper dữ liệu BE → UI nằm ở lớp service; không bịa field.
- Kid PIN: xác minh **chỉ qua BE** (`/auth/kid-mode/enter|exit`). Không so sánh PIN cục bộ, không backdoor.

## 5. Tài liệu (nguồn sự thật: source + Git; docs chỉ đọc phần liên quan task)
- Giao diện: `UI_UX_REDESIGN_PLAN.md` (kế hoạch), `UI_REDESIGN_PROGRESS.md` (tiến độ chính thức, đối chiếu với source/Git), `QA_R*_REPORT.md` (chỉ báo cáo đợt liên quan).
- API/nghiệp vụ: `API_MAPPING.md`, `BUSINESS_FLOW_MATRIX.md`, `ARCHITECTURE_DECISIONS.md`. Hiện trạng cũ: `AUDIT_REPORT.md`, `IMPLEMENTATION_PLAN.md`.
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
