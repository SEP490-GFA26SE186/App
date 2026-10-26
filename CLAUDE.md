# CLAUDE.md – StoryWeaver Mobile (App)

@AGENTS.md

Ngôn ngữ giao tiếp & tài liệu: **tiếng Việt**. Code/identifier: tiếng Anh.

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
- Chỉ làm đúng task được giao trong `docs/mobile/IMPLEMENTATION_PLAN.md`. Mỗi lần một task nhỏ; chưa được phép → không làm.
- **Không cài/đổi dependency** khi chưa được duyệt. Nếu duyệt: dùng `npx expo install` (đúng SDK 52).
- **Không đoán API.** Contract lấy từ `docs/mobile/API_MAPPING.md`; điểm chưa chắc ghi UNKNOWN và hỏi người dùng. Có thể đọc BE (`BE/src/modules/*`, Swagger `/api/v1/docs`) và Web (`Web/src/services/*.js`) để xác minh.
- **Cấm fake-success**: không token giả, user demo, ví/thanh toán giả, dữ liệu bịa khi API lỗi. Lỗi → hiển thị lỗi thật + trạng thái rỗng/thử lại.
- Không hiển thị/ghi secret từ `.env`. Không hardcode URL/khóa trong code.
- Không sửa `Web`, `BE`, `App_v2`. Không commit/push trừ khi được yêu cầu rõ.
- Giữ nguyên comment/docstring không liên quan thay đổi.
- Prototype Vite/Express/Prisma ở gốc `App/` **đã được xóa** (ARCHITECTURE_CLEANUP_REPORT.md). Repo chỉ còn `apps/mobile` + `docs/mobile`; kiểu miền nằm ở `apps/mobile/src/types/domain.ts`.

## 4. Quy ước kỹ thuật
- Stack hiện tại: Expo ~52, RN 0.76.7, React 18.3.1, TypeScript. Điều hướng hiện bằng state trong `App.tsx` (chưa có router).
- HTTP: dùng `fetch` + wrapper riêng (envelope `{success,message,data?}`, lỗi `errors[]`, timeout, single-flight refresh khi 401). **Không thêm axios.**
- Token lưu bằng `expo-secure-store` (khi được duyệt). Kid session token **tách riêng** khỏi parent token; không refresh kid bằng parent token.
- Mapper dữ liệu BE → UI nằm ở lớp service; không bịa field.
- Kid PIN: xác minh **chỉ qua BE** (`/auth/kid-mode/enter|exit`). Không so sánh PIN cục bộ, không backdoor.

## 5. Tài liệu tham chiếu (đọc trước khi làm)
- `docs/mobile/AUDIT_REPORT.md` – hiện trạng, mock, bảo mật.
- `docs/mobile/ARCHITECTURE_DECISIONS.md` – quyết định kiến trúc.
- `docs/mobile/BUSINESS_FLOW_MATRIX.md` – ma trận luồng.
- `docs/mobile/API_MAPPING.md` – contract Mobile ⇄ Web ⇄ BE.
- `docs/mobile/IMPLEMENTATION_PLAN.md` – roadmap & acceptance criteria.

## 6. Quy trình mỗi task
1. Đọc task + acceptance criteria. 2. Đọc API_MAPPING mục liên quan. 3. Sửa tối thiểu. 4. Chạy `npx tsc --noEmit` (và test nếu có). 5. Grep xác nhận không còn mock liên quan. 6. Báo cáo file đã sửa, dừng chờ review.
