# API Integration — Phase 2: Safe Mobile API Integration

Phạm vi: 13 endpoint BE có sẵn (prefix `/api/v1`), không AI, không trả phí.
Ngày: 2026-10-29 · Nhánh: `refactor/mobile-frontend-cleanup` · Chưa commit.

**Trạng thái chung:** 11/13 IMPLEMENTED — OWNER MANUAL TEST PENDING · 1 PARTIALLY IMPLEMENTED (`GET /kid/sessions/:sessionId`) · 1 BLOCKED — OWNER APPROVAL REQUIRED (`GET /kid/ui-audio`) — *cập nhật sau Phase 2: đã nối (IMPLEMENTED — MANUAL TEST PENDING) khi chủ dự án duyệt `expo-audio`, xem `MOBILE_API_MANUAL_TEST_MATRIX.md` §7.1; `GET /health` đã gỡ khỏi UI.*
Không gọi BE thật, không gửi email, không chạy AI/worker. Chưa có E2E PASS.

## 1. Tổng quan 13 endpoint

| # | Endpoint | Trạng thái | Service Mobile | Màn hình / hành động |
|---|---|---|---|---|
| 1 | `POST /auth/forgot-password` | IMPLEMENTED — OWNER MANUAL TEST PENDING | `authService.forgotPassword` | Đăng nhập → **Quên mật khẩu?** → nhập email → **Gửi mã khôi phục** |
| 2 | `POST /auth/reset-password` | IMPLEMENTED — OWNER MANUAL TEST PENDING | `authService.resetPassword` | Cùng sheet, bước 2: mã + mật khẩu mới → **Đặt lại mật khẩu** |
| 3 | `POST /auth/send-verification-email` | IMPLEMENTED — OWNER MANUAL TEST PENDING | `authService.sendVerificationEmail` | Hồ sơ → Cài đặt → thẻ **Xác thực email** → **Gửi mã xác thực** |
| 4 | `POST /auth/verify-email` | IMPLEMENTED — OWNER MANUAL TEST PENDING | `authService.verifyEmail` | Cùng thẻ: nhập mã → **Xác thực** |
| 5 | `GET /characters/:id` | IMPLEMENTED — OWNER MANUAL TEST PENDING | `characterService.getCharacter` | Hồ sơ → Nhân vật gia đình → **Chi tiết** trên thẻ → sheet chỉ đọc |
| 6 | `GET /eq-skills` | IMPLEMENTED — OWNER MANUAL TEST PENDING | `eqSkillService.getSkills` | Tab Tiến độ → **Tìm hiểu 5 năng lực CASEL** → màn mới `EqSkillsScreen` |
| 7 | `GET /eq-skills/:id` | IMPLEMENTED — OWNER MANUAL TEST PENDING | `eqSkillService.getSkill` | `EqSkillsScreen` → chạm một năng lực → sheet, mục "Chủ đề truyện đang dùng" |
| 8 | `GET /sub-skills` | IMPLEMENTED — OWNER MANUAL TEST PENDING | `eqSkillService.getSubSkills` | Cùng sheet, mục "Kỹ năng con" (`?skillId=`) |
| 9 | `GET /kid/me` | IMPLEMENTED — OWNER MANUAL TEST PENDING | `kidService.getMe` | Vào Chế độ Bé → tự gọi 1 lần khi mở; lời chào dùng tên BE trả; khác bé/401 → báo phiên mất |
| 10 | `GET /kid/ui-audio` | **IMPLEMENTED — MANUAL TEST PENDING** (cập nhật sau Phase 2: chủ dự án duyệt `expo-audio`) | `kidService.getUiAudio` → `useKidUiAudio` | Chế độ Bé → điểm dừng → nút **Nghe** (chi tiết: `MOBILE_API_MANUAL_TEST_MATRIX.md` §7.1) |
| 11 | `GET /kid/sessions/:sessionId` | **PARTIALLY IMPLEMENTED** | `kidService.getSession` | Đang đọc, khi có lỗi → nút **Tải lại lượt đọc** (đồng bộ lại lượt đang mở). Khôi phục sau khi khởi động lại app: BLOCKED |
| 12 | `GET /plans/:id` | IMPLEMENTED — OWNER MANUAL TEST PENDING | `billingService.getPlan` | Ví & Credit → thẻ gói → **Xem chi tiết** → sheet chỉ đọc |
| 13 | `GET /health` | IMPLEMENTED — OWNER MANUAL TEST PENDING | `systemService.checkHealth` | Cài đặt → thẻ Máy chủ → **Kiểm tra kết nối** (chỉ bản dev `__DEV__`) |

## 2. Contract BE đã xác minh (đọc source BE, chỉ đọc)

| Endpoint | Auth | Request | Response | Tác dụng phụ / lỗi |
|---|---|---|---|---|
| `POST /auth/forgot-password` | Công khai | body `{ email }` (zod email) | `{ success, message }`, **luôn cùng một câu** "Nếu email đã đăng ký, mã khôi phục sẽ được gửi trong ít phút." | Email tồn tại + tài khoản hoạt động → tạo token `password_reset` (1 giờ, 1 lần) và **gửi email** (lỗi gửi chỉ log). 400 nếu sai định dạng email |
| `POST /auth/reset-password` | Công khai | body `{ token (1–200), newPassword (8–100) }` | `{ success, message }` | Đổi mật khẩu, **thu hồi mọi phiên cũ**. 400 "Mã khôi phục không đúng, đã dùng hoặc đã hết hạn…" |
| `POST /auth/send-verification-email` | `auth` (Parent token) | không body (BE dùng email của tài khoản đang đăng nhập) | `data { retryAfterSeconds: 60 }` | Tạo token `email_verify` (24 giờ), vô hiệu mã cũ, **gửi email**. 400 "Email đã được xác thực"; 429 kèm `errors[0].retryAfterSeconds` nếu gửi lại < 60 giây |
| `POST /auth/verify-email` | `auth` | body `{ token }` | `data` = user `{ id, username, email, emailVerifiedAt, … }` | Đặt `emailVerifiedAt`. Token phải thuộc chính người đang đăng nhập; 400 không hợp lệ/đã dùng/hết hạn |
| `GET /characters/:id` | `auth` | `id` uuid | `data { character: { id, parentId, childId, name, appearance, portraitImageKey, portraitImageUrl, genPrompt, genSeed, portraitStatus, portraitFailure, createdAt, updatedAt, child{id,name,birthDate}\|null } }` | Chỉ nhân vật của phụ huynh; khác → 404. Mobile **không hiện** `genPrompt/genSeed` |
| `GET /eq-skills` | Công khai | `search?` | `data { skills: [{ id, caselCode, nameVi, nameEn, description, displayOrder, activeTopicsCount }] }` | — |
| `GET /eq-skills/:idOrCode` | Công khai | uuid **hoặc** mã CASEL | `data { skill: { id, caselCode, nameVi, nameEn, description, displayOrder, topics[{id,title,ageMin,ageMax}] } }` | Không phải uuid/mã → 404 |
| `GET /sub-skills` | `auth` | `skillId?` uuid, `search?`, `isActive?` (chỉ Specialist/Admin) | `data` = **mảng** `[{ id, skillId, skill{id,caselCode,nameVi}, code, nameVi, descriptionVi, caselTextEn, ageMin, ageMax, isActive, displayOrder }]` | Phụ huynh chỉ thấy mục đang dùng, không kèm số đếm |
| `GET /kid/me` | `kidAuth` (chỉ token `kid_session`) | — | `data { child: { id, name, birthDate, preferredVoice } }` | childId lấy từ token |
| `GET /kid/ui-audio` | `kidAuth` | — | `data { assets: { [key]: { text, audioUrl } } }` (12 câu: `emotion.*`, `prompt.*`) | File âm thanh **đã tạo sẵn** bằng script seed (không tạo khi gọi) |
| `GET /kid/sessions/:sessionId` | `kidAuth` | `sessionId` uuid | `data { session{id,storyId,isFirstPlay,status,currentPageId,startedAt,completedAt}, story{… pages, checkpoints kèm result} }` | `ownSession`: lượt của bé khác → 404. Chỉ đọc |
| `GET /plans/:id` | Công khai | `id` (không validate) | `data { plan }` = dòng `plans` thô: `{ id, code, name, durationMonths, priceVnd (chuỗi), creditsPerMonth, maxChildren, maxCharacters, canSell, isActive }` | 404 nếu không có; id không phải uuid → lỗi Prisma (500). Mobile chỉ dùng id lấy từ `GET /plans` |
| `GET /health` | Công khai | — | `{ status: 'ok', timestamp }` (**không** envelope) | Không kiểm tra DB/Redis/AI |

Không có deep link: email chứa **mã** để dán vào ứng dụng (BE `email.service.js`), nên Mobile dùng ô nhập mã.

## 3. UI/UX đã thêm/đổi

- **Đăng nhập** (`LoginScreen`): thêm link **Quên mật khẩu?** dưới ô mật khẩu → `ForgotPasswordSheet`:
  - **Bước 1:** nhập email, kiểm tra định dạng → gửi. Luôn hiện đúng câu BE trả, không nói email có tồn tại hay không. Có nút "Tôi đã có mã".
  - **Bước 2:** nhập mã khôi phục, mật khẩu mới (8–100) và nhập lại → đặt lại. Lỗi BE hiện tại chỗ.
  - **Bước 3:** "Về đăng nhập".

  Mỗi lần mở sheet thì mã/mật khẩu cũ bị xóa. Nút khóa khi đang gửi (ref). Phần công cụ dev bạn đang sửa (`SHOW_DEV_TOOLS`) giữ nguyên.
- **Cài đặt**:
  - **Thẻ Xác thực email:** nhãn Đã/Chưa xác thực từ `emailVerifiedAt`. Nút **Gửi mã xác thực** bị khóa 60 giây sau khi gửi (theo `retryAfterSeconds` của BE, kể cả khi bị 429). Có ô mã và nút **Xác thực**; thành công thì cập nhật trạng thái phiên.
  - **Khu dev (`__DEV__`):** nút **Kiểm tra kết nối** chỉ chạy khi bấm, không polling. Kết quả hiện "API trả lời: ok · thời điểm" và không suy diễn DB/Redis/AI.
- **Nhân vật gia đình**: nút **Chi tiết** trên mỗi thẻ → sheet gồm chân dung (nếu có URL), trạng thái chân dung, "Nhân vật đại diện của {bé}", ngoại hình, ngày tạo/cập nhật. Không có nút vẽ chân dung.
- **Tiến độ EQ**: nút **Tìm hiểu 5 năng lực CASEL** → màn mới `EqSkillsScreen` (route `EQ_SKILLS`, Back về EQ):
  - Thẻ từng năng lực: tên Việt/Anh, mô tả, số chủ đề đang dùng.
  - Chạm thẻ → sheet "Kỹ năng con" (tên, mô tả, độ tuổi) và "Chủ đề truyện đang dùng".
  - Mỗi khối có trạng thái đang tải / lỗi + Thử lại / trống. Không có điểm số.
  - Phần Hành trình EQ của Phase 1 giữ nguyên.
- **Ví & Credit**: nút **Xem chi tiết** trên thẻ gói (khi BE trả `id`) → sheet chỉ đọc: giá, thời hạn, mã gói, credit/tháng, số bé, số nhân vật, quyền đăng bán, còn cung cấp hay không. Không có nút mua hay nâng gói.
- **Chế độ Bé**:
  - Khi vào thì gọi `/kid/me` (token `kid_session`). Khớp bé → lời chào dùng tên BE trả. Khác bé hoặc 401 → hiện thanh "Phiên Chế độ Bé không còn hợp lệ" + **Đăng nhập lại**, ẩn tủ sách/trình đọc.
  - Đang đọc mà gặp lỗi → nút **Tải lại lượt đọc** nạp lại đúng lượt đang mở và kiểm tra `session.id` và `story.id` khớp.
  - PIN, thoát, trả lời điểm dừng, hoàn thành đều giữ nguyên.

## 4. File tạo/sửa (Phase 2)

Tạo:
- `apps/mobile/src/components/auth/ForgotPasswordSheet.tsx`
- `apps/mobile/src/screens/parent/EqSkillsScreen.tsx`
- `apps/mobile/src/services/eqSkillService.ts`
- `apps/mobile/src/services/systemService.ts`
- `apps/mobile/tests/phase2.test.ts`
- `docs/mobile/API_INTEGRATION_PHASE_2.md` (file này)

Sửa:
- `services/authService.ts`: thêm 4 hàm auth, `formatUser` thêm `emailVerifiedAt`.
- `services/characterService.ts`: `getCharacter`.
- `services/billingService.ts`: `getPlan`.
- `services/kidService.ts`: `getMe`, `getSession`.
- `services/index.ts`: export 2 service mới.
- `types/api.ts`: DTO Phase 2; `PlanDto.id?`.
- `types/sessionUser.ts`: `emailVerifiedAt?`.
- `types/viewModels.ts`: `KidDataSource.getMe?`, `getSession?` (tùy chọn, UI Preview không đổi).
- `screens/auth/LoginScreen.tsx`: link + sheet.
- `screens/parent/SettingsScreen.tsx`
- `screens/parent/CharactersScreen.tsx`
- `screens/parent/WalletScreen.tsx`
- `screens/parent/EqReportScreen.tsx`: nút mở EqSkills.
- `navigation/routes.ts`, `navigation/ParentTabs.tsx`: route `EQ_SKILLS`.
- `screens/kid/KidModeScreen.tsx`: `/kid/me`.
- `screens/kid/useKidReader.ts`: tách `applyPlay` dùng chung cho `open`/`resync`; thêm `resync`. Logic `submit`/`complete`/`next` không đổi.
- `components/kid/KidReader.tsx`: nút Tải lại lượt đọc.

Không đổi: StoryWizard, GenerationRunner/Panel, KidCheckpointCard, KidPinOverlay, apiClient, stores/SessionProvider, Admin/Specialist, BE, Web, App_v2. Không thêm dependency. Toàn bộ file Phase 1 giữ nguyên.

## 5. Kết quả kiểm tra tĩnh

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | Không lỗi |
| 12 test offline (`tests/README.md`) | Tất cả PASS: authRace 5/5, homeAuth 6/6, kidUi 5/5, library 7/7, manage 7/7, management 19/19, navigation 11/11, phase1 4/4, **phase2 5/5**, r9a 7/7, uiStates 2/2, wizard 6/6 |
| `npx expo export --platform android` (ra thư mục tạm) | Bundle thành công (3,01 MB) |

`phase2.test.ts` dùng fetch giả, địa chỉ `http://test.invalid`, không có thông tin đăng nhập thật. Test kiểm tra:
- Method, path, body của từng endpoint.
- Forgot/reset **không** gửi token.
- Endpoint Kid chỉ gửi token `kid_session`, không bao giờ token Parent.
- Mỗi endpoint có chỗ gọi từ màn hình.
- Nút health nằm trong nhánh `__DEV__`.
- File mới không chạm AI, thanh toán hay phát âm thanh.

Lần chạy đầu `phase2` đỏ do chuỗi tìm trong test (code xuống dòng giữa `source` và `.getMe()`). Đã sửa chuỗi tìm trong test, code không đổi.

## 6. BLOCKED / chờ chủ dự án quyết

**#10 `GET /kid/ui-audio` — BLOCKED — OWNER APPROVAL REQUIRED** *(lịch sử; đã giải quyết: chủ dự án duyệt phương án (a) `expo-audio`, nay IMPLEMENTED — MANUAL TEST PENDING, xem `MOBILE_API_MANUAL_TEST_MATRIX.md` §7.1)*
- BE trả URL file âm thanh tạo sẵn. Phát không tốn phí AI, nhưng Mobile **không có thư viện phát audio**: chỉ có `expo-speech` (TTS trên máy) và `expo-video`.
- Dùng `expo-video` để phát audio là cách lách chưa kiểm chứng. Dùng `expo-speech` đọc chữ là tự sinh giọng, trái yêu cầu.
- Cần chủ dự án chọn:
  - (a) duyệt thêm `expo-audio` (Expo SDK 52) để phát `audioUrl` ở điểm dừng cảm xúc / khen / gợi ý; hoặc
  - (b) chỉ dùng phần `text` thay nhãn cố định trong `constants/kid.ts`. Việc này phải sửa `KidCheckpointCard` (màn điểm dừng), cần duyệt riêng.
- `kidService.getUiAudio` có sẵn nhưng không màn nào gọi → **không tính là đã nối**.

**#11 `GET /kid/sessions/:sessionId` — PARTIALLY IMPLEMENTED**
- Đã làm: đồng bộ lại lượt đọc đang mở sau lỗi (trong cùng phiên ứng dụng).
- Chưa làm (BLOCKED): khôi phục lượt đọc sau khi đóng/mở lại app. Lý do:
  - Trên native, `safeStorage` chỉ lưu trong bộ nhớ, nên token cũng mất khi tắt app.
  - Lúc khởi động, app không khôi phục Chế độ Bé (`stores/useKidSession`, `SessionProvider`, `AppNavigator`).
- Để làm được cần:
  1. Lưu bền token kid + `sessionId` (cần storage bền như `expo-secure-store`/AsyncStorage → dependency mới).
  2. Khôi phục Kid Mode lúc boot trong `useKidSession`/`SessionProvider`.
  3. Gọi `GET /kid/sessions/:id` khi mở lại.
- Đây là thay đổi auth/điều hướng dùng chung → cần duyệt.
- Lưu ý: `POST /kid/sessions` (đã nối) vốn đã tự tiếp tục lượt `in_progress` khi bé mở lại truyện.

## 7. Rủi ro

- **Email (có thể tốn phí):** `forgot-password` (khi email tồn tại) và `send-verification-email` khiến BE **gửi email thật** qua nhà cung cấp đã cấu hình. Claude không gọi. Chủ dự án test bằng email QA, lưu ý hạn mức/phí. Gửi lại mã xác thực bị BE chặn 60 giây.
- **Reset mật khẩu** thu hồi mọi phiên đăng nhập của tài khoản đó (kể cả thiết bị khác).
- **Không lộ tài khoản:** UI quên mật khẩu chỉ hiện câu BE trả (giống nhau cho mọi email).
- **`emailVerifiedAt` chưa rõ:** phiên lưu từ trước khi có thay đổi chưa có trường này (`undefined`) → hiện "Chưa xác thực" cho đến khi `/auth/me` hoặc đăng nhập lại. Bấm gửi mã khi đã xác thực → BE trả 400 "Email đã được xác thực" và UI hiện đúng câu đó.
- **Kid:**
  - `/kid/me` thêm 1 request mỗi lần vào Chế độ Bé. Lỗi mạng không chặn đọc; chỉ 401 hoặc khác bé mới chặn.
  - "Tải lại lượt đọc" không tự trả lời hay hoàn thành thay bé. Nếu BE báo lượt đã kết thúc (409), đọc tới cuối sẽ gọi `complete` (idempotent) như cũ.
- **`GET /plans/:id`:** BE không validate id (id lạ → 500). Mobile chỉ dùng id lấy từ `/plans`. Gói không có `id` trong danh sách thì không hiện nút chi tiết.
- **Hai lời gọi EQ trong sheet:** `/eq-skills/:code` và `/sub-skills` nạp độc lập, nên một khối lỗi không chặn khối kia.
- **`/health`:** chỉ chứng minh API Express trả lời, không nói gì về PostgreSQL/Redis/AI.

## 8. Hướng dẫn kiểm thử thủ công cho chủ dự án

Chuẩn bị chung:
- **Dịch vụ:** BE + PostgreSQL chạy, `EXPO_PUBLIC_API_URL` trỏ BE dev. Không cần Redis/worker/AI service cho mọi bước dưới đây.
- **Email:** Auth-01 và Auth-03 cần BE cấu hình gửi email.
- **Tài khoản:** **Parent QA** dùng email QA bạn đọc được; có ≥1 bé đã có ≥1 truyện trên giá, ≥1 nhân vật.

| Test ID | Role | Dữ liệu cần | Điều hướng | Thao tác | API mong đợi | UI mong đợi | Đổi dữ liệu / chi phí ngoài | Dịch vụ cần | Status |
|---|---|---|---|---|---|---|---|---|---|
| QA-P2-01 | Khách (chưa đăng nhập) | Email QA đã đăng ký + 1 email chưa đăng ký | Màn Đăng nhập → **Quên mật khẩu?** | Nhập email sai định dạng → Gửi; rồi email chưa đăng ký; rồi email QA | Sai định dạng: không request. Còn lại: `POST /auth/forgot-password {email}` → 200, không header Authorization | Sai định dạng: lỗi tại chỗ. Hai email còn lại: **cùng một câu**, sang bước nhập mã | Tạo token reset + **gửi email thật** (chỉ email QA) | BE, DB, email | NOT TESTED — OWNER MANUAL QA |
| QA-P2-02 | Khách | Mã trong email QA | Bước 2 của sheet | Nhập mã sai → Đặt lại; mật khẩu < 8; nhập lại không khớp; rồi mã đúng + mật khẩu hợp lệ; đăng nhập bằng mật khẩu mới | `POST /auth/reset-password {token,newPassword}` → 400 (mã sai) / 200 | Mã sai: câu lỗi BE. Lỗi độ dài/khớp: chặn ở client. Đúng: "Đã đặt lại mật khẩu…" → Về đăng nhập; mật khẩu mới dùng được, mật khẩu cũ không | **Đổi mật khẩu**, thu hồi phiên cũ | BE, DB | NOT TESTED — OWNER MANUAL QA |
| QA-P2-03 | Parent (email chưa xác thực) | Tài khoản QA `emailVerifiedAt = null` | Hồ sơ → Cài đặt → thẻ Xác thực email | **Gửi mã xác thực**; bấm lại ngay | `POST /auth/send-verification-email` (Bearer Parent) → 200 `{retryAfterSeconds:60}`; trong 60 giây nút bị khóa (nếu vẫn gửi → 429) | "Đã gửi mã tới …"; nút "Đã gửi mã · chờ để gửi lại" tới hết 60 giây | Tạo token + **gửi email thật** | BE, DB, email | NOT TESTED — OWNER MANUAL QA |
| QA-P2-04 | Parent | Mã trong email | Cùng thẻ | Nhập mã sai → Xác thực; rồi mã đúng | `POST /auth/verify-email {token}` → 400 / 200 `data.emailVerifiedAt` | Sai: câu lỗi BE. Đúng: "Xác thực email thành công", nhãn thành **Đã xác thực**, ẩn nút gửi | Đặt `users.email_verified_at` | BE, DB | NOT TESTED — OWNER MANUAL QA |
| QA-P2-05 | Parent | ≥1 nhân vật (nên có 1 nhân vật đại diện của bé) | Hồ sơ → Nhân vật gia đình | **Chi tiết** trên thẻ | `GET /characters/{id}` → 200 | Sheet: chân dung/chữ cái đầu, trạng thái chân dung, "Nhân vật đại diện của {bé}" (nếu có), ngoại hình, ngày. Không có nút vẽ | Không | BE, DB | NOT TESTED — OWNER MANUAL QA |
| QA-P2-06 | Parent | Seed 5 năng lực | Tab Tiến độ → **Tìm hiểu 5 năng lực CASEL** | Mở màn | `GET /eq-skills` → 200 | 5 thẻ có tên Việt/Anh, mô tả, số chủ đề; Back về Tiến độ | Không | BE, DB | NOT TESTED — OWNER MANUAL QA |
| QA-P2-07 | Parent | Như trên | Màn 5 năng lực | Chạm một năng lực | `GET /eq-skills/{caselCode}` → 200 | Mục "Chủ đề truyện đang dùng" khớp topics; trống → "Chưa có chủ đề nào…" | Không | BE, DB | NOT TESTED — OWNER MANUAL QA |
| QA-P2-08 | Parent | Seed kỹ năng con | Cùng sheet | Xem mục "Kỹ năng con" | `GET /sub-skills?skillId={uuid}` (Bearer Parent) → 200 mảng | Danh sách kỹ năng con đang dùng (tên, mô tả, độ tuổi) đúng năng lực đã chạm | Không | BE, DB | NOT TESTED — OWNER MANUAL QA |
| QA-P2-09 | Kid (qua Parent + PIN) | Bé có hồ sơ | Hồ sơ → Chế độ Bé (hoặc Bé nhà mình → Vào Chế độ Bé) | Vào Chế độ Bé | `GET /kid/me` với Bearer **kid_session** (không phải token Parent) → 200 | Lời chào "Chào {tên BE trả}!"; tủ sách hiện bình thường. (Phiên hết hạn/thu hồi → thanh "Phiên Chế độ Bé không còn hợp lệ" + Đăng nhập lại) | Không | BE, DB | NOT TESTED — OWNER MANUAL QA |
| QA-P2-10 | — | — | — | (BLOCKED, không có UI) | — | — | — | — | BLOCKED — OWNER APPROVAL REQUIRED |
| QA-P2-11 | Kid | Truyện sẵn sàng trên giá của bé | Chế độ Bé → mở truyện | Đang đọc, tắt mạng/BE rồi bấm Trang sau ở trang có điểm dừng → trả lời (lỗi) → bật lại BE → **Tải lại lượt đọc** | `GET /kid/sessions/{sessionId}` (Bearer kid_session) → 200 | Lỗi biến mất, đúng trang đã lưu, câu đã trả lời giữ kết quả; đọc tiếp bình thường. (Khôi phục sau khi khởi động lại app: chưa hỗ trợ) | Không (chỉ đọc) | BE, DB | NOT TESTED — OWNER MANUAL QA |
| QA-P2-12 | Parent | ≥1 gói hoạt động | Ví & Credit (pill credit hoặc Hồ sơ → Ví) | **Xem chi tiết** trên một thẻ gói | `GET /plans/{id}` (không token) → 200 | Sheet: giá/thời hạn, mã gói, credit/tháng, số bé, số nhân vật, quyền đăng bán, còn cung cấp. Không có nút mua | Không, **không có thanh toán** | BE, DB | NOT TESTED — OWNER MANUAL QA |
| QA-P2-13 | Parent (bản dev) | Chạy bằng `expo start` (dev) | Cài đặt → thẻ Máy chủ | **Kiểm tra kết nối**; tắt BE rồi bấm lại | `GET /health` → 200 `{status:'ok'}` | "API trả lời: ok · {thời điểm}"; BE tắt → câu lỗi kết nối. Bản phát hành không có nút | Không | BE | NOT TESTED — OWNER MANUAL QA |

Kiểm tra thêm (không gọi API mới): Android Back đóng sheet trước, rồi mới rời màn. Back ở màn 5 năng lực về Tiến độ. Back trong Chế độ Bé vẫn mở khóa PIN.
