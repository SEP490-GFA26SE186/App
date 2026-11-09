# Đối chiếu cập nhật Web – BE – Mobile (Gap Analysis)

> Đợt §12 trong `App/CLAUDE.md`. Ngày lập: 2026-11-09.
> **Cập nhật 2026-11-09 (Giai đoạn 4, đã duyệt):** mục 1 và mục 2 **ĐÃ TRIỂN KHAI**, link hỏng đã xử lý. Xem §16.
> Nguồn đối chiếu (GitHub `origin/main`, khớp với máy): **App `f84c4f9`** (29/10) · **Web `c1311e5`** (05/11) · **BE `82a372c`** (04/11).
> Mọi đường dẫn Mobile tính từ `App/apps/mobile/src/`, BE từ `BE/api/src/`, Web từ `Web/`.

## 1. Trạng thái Git ban đầu

| Repo | Branch | Commit trên máy | Khớp hash phân tích | Thay đổi chưa commit |
|---|---|---|---|---|
| App | `main` | `f84c4f9` (29/10) | ✅ | `CLAUDE.md` (cập nhật cấu hình AI cho đợt này) |
| Web | `main` | `c1311e5` (05/11) | ✅ | không |
| BE | `main` | `82a372c` (04/11) | ✅ | không |

Không có commit nào trên máy mà chưa push. `App_v2` không thuộc đợt này (chỉ tham khảo).

## 2. Kết luận

- Mobile đã đồng bộ gần hết với Web tính đến khoảng **25/10** (`INFERRED`).
- **BE không đổi API contract sau 26/10.** Chỉ có 3 commit, đều không chạm endpoint (`VERIFIED_FROM_SOURCE`: `git log --since=2026-10-26 -- api/src`):
  - `6eaed72` (29/10): `CORS_ORIGIN` nhận được nhiều origin.
  - `43a3806` (30/10): bỏ Supabase (cả DB lẫn Storage). Link ảnh vẫn đi qua `assetUrl()`, trả `null` khi file lưu local. Mobile đã có bìa dự phòng cho trường hợp này.
  - `42a236b` (03/11): sửa lint và swagger, thêm CI.
- **Thay đổi Web sau lần đồng bộ:**
  - **PR #13 (05/11):** bộ dịch lỗi BE sang tiếng Việt (`Web/src/services/errorMessages/*`), nối vào `getErrorMessage` ở `Web/src/services/api.js:80-90`.
  - 03/11: thêm test và CI. Mobile không cần làm theo.
- **Mobile chỉ cần làm 2 việc:** mục 1 (dịch lỗi, `NEEDS_FEATURE_UPDATE`) và mục 2 (hiển thị lý do chân dung lỗi, `NEEDS_UI_UPDATE`). Các mục còn lại đã đủ, không cần trên Mobile, hoặc thuộc phần chủ dự án tự làm.

## 3. Bảng đối chiếu Web – BE – Mobile

| # | Tính năng Web | BE | Mobile | Phân loại |
|---|---|---|---|---|
| 1 | Dịch lỗi BE → tiếng Việt toàn app | BE còn trả nhiều message tiếng Anh, vd. `modules/children/children.service.js:85` | Chỉ dịch một phần: `services/authService.ts:24-48` | **NEEDS_FEATURE_UPDATE** |
| 2 | Lý do chân dung lỗi (blocked/error) | `portraitFailure`: `modules/characters/characters.service.js:27` | Có kiểu ở `types/api.ts:64` nhưng chưa hiển thị; `screens/parent/CharactersScreen.tsx:30` chỉ ghi "Chân dung: chưa vẽ được" | **NEEDS_UI_UPDATE** (nhỏ, chỉ hiển thị) |
| 3 | Rút tiền chuyển khoản tay (mark-paid) | Có | `services/adminService.ts:70`, `screens/admin/WithdrawalsScreen.tsx:76-81` (số tài khoản đầy đủ, chọn/copy được bằng tay) | **ALREADY_SUPPORTED**. Nút copy cần dependency → chờ duyệt. VietQR: WEB ONLY |
| 4 | Lịch sử credit | `GET /subscriptions/me/credit-history` | `services/billingService.ts:29` | **ALREADY_SUPPORTED** |
| 5 | Kid PIN "còn N lần thử" | `attemptsLeft` / `retryAfterSeconds` | `services/authService.ts:139-144` (nhận biết PIN sai / mất phiên), `screens/kid/KidModeScreen.tsx:97` (hiển thị) | **ALREADY_SUPPORTED** |
| 6 | Gửi lại mã xác thực email có thời gian chờ | Có | `screens/parent/SettingsScreen.tsx:120-133` | **ALREADY_SUPPORTED** |
| 7 | Nhãn nguồn gốc nội dung + "Phiên bản mới" ở màn duyệt | Có | `screens/specialist/ReviewWorkspaceScreen.tsx:27, 103-104, 133` | **ALREADY_SUPPORTED** |
| 8 | Mẫu câu hỏi theo năng lực CASEL (Specialist) | Có | Không có màn (WEB ONLY theo `docs/mobile/ADMIN_SPECIALIST_MOBILE_IMPLEMENTATION.md:42`) | **NOT_NEEDED_ON_MOBILE** |
| 9 | Cảnh báo credit tranh AI, "vẽ tiếp", lối "Tự viết", gợi ý mô tả chân dung | Có | Thuộc luồng AI / tạo truyện | **OWNER_RESERVED** |
| 10 | Gia hạn gói, hồ sơ/phiên bản người bán, khung người bán | Có | Seller/Payment: SCOPE PENDING | **OWNER_RESERVED** |

## 4. Tính năng Mobile đã có, không cần sửa
Mục 3, 4, 5, 6, 7. Mục 8 không cần làm trên Mobile.

## 5. Tính năng Mobile cần cập nhật

### Mục 1 – Dịch lỗi BE sang tiếng Việt (NEEDS_FEATURE_UPDATE, P1)

**Hiện trạng**
- `services/apiClient.ts:27-33` (`extractErrorMessage`) trả nguyên văn message của BE. Đây là điểm xử lý lỗi duy nhất, được gọi ở các dòng 109, 114, 193, 232.
- Ví dụ lỗi thật: tạo hồ sơ bé vượt giới hạn gói thì `components/parent/ChildFormSheet.tsx:66` hiện câu tiếng Anh "You have reached the maximum limit of N child profiles…" (BE `modules/children/children.service.js:85`).
- Web dịch **94 message cố định + 13 regex**, gồm 12 nhóm: system, database, session, access, zod, auth, kid, children, characters, bookshelf, billing, admin. Mobile đã có 15/94 message, **còn thiếu 79**.

**Khác biệt phát hiện thêm: lỗi 5xx**
- Web không hiện message của lỗi 5xx (`Web/src/services/api.js:85`) mà dùng câu mặc định.
- Mobile vẫn hiện message gốc của BE với lỗi 5xx (`services/apiClient.ts:192-194`).
- Với lỗi không lường trước, BE trả nguyên `error.message` kèm mã 500 (`middlewares/error.middleware.js:26`). Vì vậy Mobile có thể hiện chi tiết kỹ thuật cho người dùng.
- Đề xuất xử lý cùng mục 1 nhưng cần chủ dự án duyệt riêng, vì nó đổi hành vi hiển thị lỗi chung.

**Đề xuất sửa tối thiểu**
- Thêm `services/errorMessages.ts`, chép bảng dịch từ `Web/src/services/errorMessages/*` sang TypeScript.
- Gọi hàm dịch bên trong `extractErrorMessage`.
- Giữ nguyên các bảng dịch trong `authService.ts`.

**Rủi ro thấp**
- Không có code Mobile nào so sánh `error.message` với chuỗi tiếng Anh, và không test nào phụ thuộc vào nó.
- Luồng PIN dựa vào `attemptsLeft`, không dựa vào message.

**Kiểm thử**
- `npx tsc --noEmit`.
- Thêm unit test theo mẫu `Web/tests/services/errorMessages.test.js`.
- Kiểm tay trên tài khoản test: đăng nhập sai, và tạo hồ sơ bé vượt giới hạn.

### Mục 2 – Hiển thị lý do chân dung lỗi (NEEDS_UI_UPDATE, P2)
- `types/api.ts:64` đã có `portraitFailure`, nhưng `screens/parent/CharactersScreen.tsx:30` chỉ hiện nhãn chung.
- Chỉ cần thêm phần hiển thị (một dòng chữ). Không đụng vào luồng vẽ chân dung AI (§11).

## 6. Tính năng Mobile còn thiếu
Không có tính năng mới nào cần màn hình mới (`NEEDS_NEW_SCREEN`) trong đợt này.

## 7. API Mobile chưa tích hợp hoặc cần sửa
- Không có `NEEDS_API_INTEGRATION` hay `NEEDS_API_FIX`: contract BE không đổi sau 26/10.
- Mục 1 chỉ sửa cách hiển thị lỗi, không đổi lời gọi API.

## 8. API BE chưa hỗ trợ hoặc chưa xác minh
Không có mục `NEEDS_BACKEND_REVIEW`.

## 9. File Mobile dự kiến thay đổi

| Mục | File | Loại thay đổi |
|---|---|---|
| 1 | `services/errorMessages.ts` | Thêm mới (bảng dịch + `translateErrorMessage`) |
| 1 | `services/apiClient.ts` | Gọi hàm dịch trong `extractErrorMessage` (dòng 27-33) |
| 1 | `tests/errorMessages.test.ts` | Thêm unit test |
| 2 | `screens/parent/CharactersScreen.tsx` | Hiển thị `portraitFailure` |

## 10. Mức ưu tiên

| Ưu tiên | Mục |
|---|---|
| P0 | Không có |
| P1 | Mục 1: dịch lỗi (ảnh hưởng mọi màn có báo lỗi, gồm Parent/Kid). Kèm điểm 5xx nếu được duyệt |
| P2 | Mục 2: lý do chân dung lỗi |

## 11. Rủi ro và phụ thuộc
- Mục 1 sửa `apiClient.ts`, file dùng chung cho mọi request. Phải chạy lại regression cho Auth/Session/Kid PIN (§8 CLAUDE.md), dù không có logic nào phụ thuộc vào nội dung message.
- Bảng dịch chép từ Web sẽ phải bảo trì ở 2 nơi. Khi Web thêm message mới, Mobile cần cập nhật theo.
- Hai mục độc lập với nhau, làm riêng được.

## 12. Phần chưa xác minh được
- `INFERRED`: mốc đồng bộ khoảng 25/10.
- `NOT_VERIFIED_AT_RUNTIME`: tất cả các mục, vì chưa chạy app và chưa gọi API.

## 13. Nhãn bằng chứng
- `VERIFIED_FROM_SOURCE`: toàn bộ file/dòng trích dẫn ở trên. Đã mở lại và đối chiếu ngày 2026-11-09 trên các commit ở đầu báo cáo.
- `INFERRED`: mốc đồng bộ khoảng 25/10.
- `NOT_VERIFIED_AT_RUNTIME`: tất cả.

## 14. Tài liệu: link hỏng
- `MOBILE_STATUS.md` dòng 59, 74, 78, 102 và `API_INTEGRATION_STATUS_REPORT.md:488` trỏ tới `R9B_MANUAL_TEST_PLAN.md` và `QA_R9B_READINESS.md`. Hai file này không còn trong repo.
- **Chưa sửa.** Chờ chủ dự án chọn cách xử lý: bỏ link, hoặc trỏ về lịch sử Git (`a9160a7`).

## 15. Kế hoạch triển khai (đã duyệt và làm xong ở Giai đoạn 4, xem §16)
1. **Nhóm A – Thông báo lỗi (P1):** mục 1. Kèm phần ẩn message lỗi 5xx nếu được duyệt.
2. **Nhóm B – Nhân vật (P2):** mục 2.
3. **Nhóm C – Tài liệu:** sửa link hỏng (mục 14) theo cách chủ dự án chọn.

Mỗi nhóm làm xong thì dừng chờ review.

## 16. Kết quả Giai đoạn 4 (2026-11-09)

| Mục | Trạng thái | File |
|---|---|---|
| 1 – Dịch lỗi BE | **DONE**, FIXTURE PASS | `services/errorMessages.ts` (mới), `services/apiClient.ts` |
| 2 – Lý do chân dung lỗi | **DONE**, TSC PASS (chưa kiểm trên giao diện) | `types/viewModels.ts`, `services/characterService.ts`, `screens/parent/CharactersScreen.tsx` |
| Link hỏng | **DONE** | `MOBILE_STATUS.md` (59, 74, 78, 102), `API_INTEGRATION_STATUS_REPORT.md:488` |

### Mục 1 – Dịch lỗi
- `services/errorMessages.ts` chép đủ **94 message + 13 regex** từ Web, giữ nguyên câu chữ và thứ tự nhóm. Test kiểm tra luôn số lượng này.
- `extractErrorMessage` dịch `errors[0].message` hoặc `message` trước khi trả về. Vì vậy mọi lỗi của `apiFetch`, `kidFetch` và lỗi refresh token đều được dịch.
- **Quyết định 500 khác 502/503 (Mobile khác Web có chủ đích):**
  - Chỉ status **500** bị thay bằng câu chung "Có lỗi xảy ra, ba mẹ thử lại sau nhé" (`errorMessageFor` trong `apiClient.ts`, dùng ở `apiFetch` và `kidFetch`).
  - **502/503** giữ message (sau khi dịch), vì BE cố ý trả câu tiếng Việt cho các trường hợp này:
    - `BE/api/src/modules/stories/stories.narration.service.js:59`: giọng đọc gián đoạn.
    - `stories.images.service.js:42`: hàng đợi tranh lỗi.
    - `billing.service.js:19-20`: thanh toán.
  - Web thì ẩn mọi lỗi 5xx (`Web/src/services/api.js:85`).
- Không đổi phần xử lý 401 / refresh token và logic `attemptsLeft` / PIN.
  - Riêng lỗi 5xx khi refresh token (`apiClient.ts`, nhánh `res.status >= 500` trong `refreshAccessToken`) vẫn hiện message (đã dịch), vì phạm vi đợt này không chạm vào phần refresh.
- Bảng dịch cũ trong `authService.ts` được giữ nguyên.
- **Đề xuất cho BE (ngoài phạm vi Mobile):** `BE/api/src/middlewares/error.middleware.js:26` trả nguyên `error.message` của lỗi 500 không lường trước (vd. message Prisma) ra client. Nên trả câu chung và chỉ ghi chi tiết vào log.

### Mục 2 – Lý do chân dung lỗi
- Mapper `characterService.formatCharacter` trước đây **không** truyền `portraitFailure`. Đã thêm trường này vào mapper và vào `CharacterView`. BE thực sự trả trường này (`characters.service.js:27`, giá trị `'blocked' | 'error' | null`).
- Khi `portraitStatus === 'failed'`, cả thẻ nhân vật lẫn sheet chi tiết hiện thêm một dòng chữ:
  - `blocked`: hướng dẫn sửa mô tả.
  - `error` hoặc null: báo lỗi tạm thời, credit đã hoàn.
- Dòng chữ dùng `Typography.caption` + `Colors.textMuted`, không thêm màu mới. Không thêm nút vẽ lại, không gọi `/portrait`.

### Kiểm thử
- `npx tsc --noEmit`: **PASS**.
- `apps/mobile/tests`: **14/14 file PASS**, gồm `errorMessages.test.ts` mới (17 ca).
  - Các ca dịch được chép từ Web.
  - Có thêm ca 500 bị ẩn (`apiFetch`/`kidFetch`), ca 502/503 giữ message, ca `attemptsLeft` giữ nguyên.
- Đã sửa 1 câu mong đợi trong `tests/phase2.test.ts:64`. Câu tiếng Việt "Mã xác thực không hợp lệ hoặc đã được sử dụng" của BE nay được viết lại giọng theo bảng của Web thành "Mã xác thực không đúng hoặc đã được dùng". Đây là hệ quả trực tiếp của mục 1.
- `NOT_VERIFIED_AT_RUNTIME`: chưa chạy app, chưa gọi BE thật. Kiểm tay trên tài khoản test (đăng nhập sai, tạo bé vượt giới hạn, nhân vật có chân dung lỗi) vẫn **NOT RUN**.

### Rủi ro còn lại
- **3 câu cũ của Mobile bị câu của Web thay thế** do dịch ở `apiClient` chạy trước bảng trong `authService.ts`. Các mục tương ứng trong bảng của `authService.ts` không còn được dùng tới:

  | Message BE | Câu Mobile cũ | Câu mới (Web) |
  |---|---|---|
  | `Account password is incorrect` | Mật khẩu hiện tại chưa đúng | Mật khẩu tài khoản chưa đúng |
  | `You must set a Kid Exit PIN before entering Kid Mode` | Ba mẹ cần đặt mã PIN trước khi vào Chế độ Bé | Ba mẹ cần đặt mã PIN thoát Kid Mode trước nhé |
  | `Child profile not found or does not belong to this account` | Không tìm thấy hồ sơ bé này trong tài khoản | Không tìm thấy hồ sơ bé trong tài khoản này |

  Câu thứ 2 dùng chữ "Kid Mode", trong khi giao diện Mobile gọi là "Chế độ Bé". Cần chủ dự án quyết định có giữ câu Mobile không.
- **Còn 5 chỗ đọc thẳng `errors[0].message`** mà không qua bảng dịch (`navigation/ParentTabs.tsx:90`, `screens/parent/StoryDetailScreen.tsx:117,137`, `screens/parent/StoryWizard.tsx:191,215`).
  - Message trường lỗi ở các chỗ này vẫn có thể là tiếng Anh.
  - `StoryWizard` thuộc phần OWNER-RESERVED (§11), nên không sửa.
- Bảng dịch phải bảo trì thủ công song song với Web.
