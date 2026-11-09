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

### Xử lý sau review (GĐ A, branch `feat/mobile-error-i18n`)
- **Câu "Kid Mode":** thêm `MOBILE_OVERRIDES` trong `services/errorMessages.ts`, áp trước bảng Web. 4 message liên quan Kid Mode/phiên của bé nay dùng "Chế độ Bé". Bảng Web giữ nguyên.
  - Hai câu khác của Mobile cũ ("Mật khẩu hiện tại chưa đúng", "hồ sơ bé này trong tài khoản") vẫn theo Web.
- **4 chỗ đọc `errors[0].message`** (`ParentTabs.tsx:90`, `StoryDetailScreen.tsx:137`, `StoryWizard.tsx:191, 215`) đổi sang `e.message`. Vì `extractErrorMessage` đã lấy `errors[0].message` rồi dịch, hành vi giữ nguyên nhưng có dịch.
  - `StoryDetailScreen.tsx:117` (danh sách lỗi kiểm duyệt `errors.map`) không đổi.
- **Refresh token 5xx** (`apiClient.ts:119`) dùng `errorMessageFor`: lỗi 500 bị ẩn. Logic giữ phiên không đổi, đã có test.

## 17. GĐ B1 – Màn Sửa truyện + lối "Tự viết" (branch `feat/mobile-story-editor`)

Đối chiếu đọc từ source (`VERIFIED_FROM_SOURCE`) trước khi code. Đường dẫn BE tính từ `BE/api/src/modules/stories/`. Web: `Web/src/pages/parent/studio/StoryEditorPage.jsx`, `components/parent/studio/*`, `hooks/useStudio.js`.

### Endpoint (mọi lệnh editor trả `data { story }` = chi tiết đầy đủ, như GET /stories/:id)

| Endpoint | Body (zod `stories.validation.js`) | Luật BE | Mobile |
|---|---|---|---|
| `POST /stories/:id/pages` (routes:34) | `{ contentText?: string\|null }` (≤2000), mặc định `{}` (:152) | Chỉ truyện `custom` (`lockCustom`, editor.service:56). Số trang trong `custom_limits` (seed: 4–20, `customRules.js:10`) | `storyService.createPage` |
| `PUT /stories/:id/pages/:pageId` (:37) | `{ contentText: string\|null }` (:147) | Mọi truyện của chủ. Chữ trống → null. Tên thật đổi sang token, còn sót tên → 422. Đổi chữ thì xoá audio | `updatePage` |
| `DELETE /stories/:id/pages/:pageId` (:38) | — | Chỉ `custom`. Trang có điểm dừng sau nó → 409 (editor.service:217). Dưới số trang tối thiểu → 422 | `deletePage` |
| `POST /stories/:id/checkpoints` (:40) | `{ type, afterPageId, targetToken? }` (:182). `targetToken` (`{NVn}`) chỉ cho `emotion_other`/`perspective` | Chỉ `custom`. Không đặt sau trang 1; mỗi trang tối đa 1 điểm dừng; `reflection` chỉ sau trang cuối; tối đa `max_checkpoints` (seed 6). Nhân vật được hỏi phải là nhân vật phụ (`resolveCheckpointTarget`, editorRules:88) | `createCheckpoint` |
| `PUT /stories/:id/checkpoints/:cpId` (:43) | `{ question?, hint?, answerEmotion?, options? }` (:166), cần ít nhất 1 trường | Truyện không phải `custom` → 422. `checkCheckpointEdit` (editorRules:32): kiểu cảm xúc có câu hỏi thì phải có `answerEmotion`; `perspective`: đúng 3 phương án `{text,isCorrect}`, đúng 1 đúng; `problem_solving`: 3 phương án `{text,role,feedback}` đủ 3 vai; kiểu khác không có phương án | `updateCheckpoint` |
| `DELETE /stories/:id/checkpoints/:cpId` (:44) | — | Chỉ `custom` | `deleteCheckpoint` |
| `PUT /stories/:id/cover` (:30, chỉ `parent`) | `{ sceneId: uuid\|null }` (:205) | Cảnh phải thuộc truyện và đã có ảnh (`imageStatus='ready'`), không thì 422. Chỉ truyện `private` | `setCover` |
| `DELETE /stories/:id` (:27) | — | Xoá mềm (`deletedAt`). Trả `success` không có `data` | `deleteStory` |
| `POST /stories/:id/review` (:46, đã có) | — | Thiếu → 422 `errors[{path: 'pages.<id>'\|'checkpoints.<id>', message}]` (`findReviewGaps`, editorRules:116). Đủ thì kiểm từ khoá chặn → 422 message "Có từ không phù hợp cho bé…" (`keywords.js:42`). Thành công: đặt `reviewedAt` **và đẩy job giọng đọc TTS** | `reviewStoryDetail` (bản trả DTO cho editor) |

Luật chung:
- Truyện `status === 'generating'` → mọi lệnh ghi 409 (`stories.access.js:36`).
- `checkpoint.locked = story.length !== 'custom'` (`lib/storyFormat.js:126`). Web khoá thêm khi `entry === 'family'`.
- Chữ trả về giữ token `{NVn}`; Web đổi sang tên khi hiển thị/sửa (`utils/storyNames.js`) và gửi lại chữ có tên.
- `keywordWarnings[{path, keyword, severity}]` trong chi tiết: Web hiện nhắc "từ nên cân nhắc".

### Tạo truyện "Tự viết"
`POST /stories` với `length: 'custom'`, không `entry`/`analysisToken`, `useAiImage: false`, `topicId` tuỳ chọn (Web `CreateStoryPage.jsx:262`). BE đặt `entry = handwritten` và tạo sẵn 4 trang trống, chưa có điểm dừng (`lib/skeleton.js:8, 35`).

### Ngoài phạm vi B1
- Không đụng `/generate`, `/images`, `/scenes/:id/image`, `/narration/retry`, `/analyze`, `/characters/:id/portrait`.
- `SubSkillPicker` của Web chỉ dùng cho luồng `/analyze` (Kể chuyện nhà mình) → không thuộc B1.
- Web hiển thị thêm `NarrationPanel`, `ShelfPanel`, `GenerationPanel`, `ScenePicture`, nút "Đăng bán". B1 không làm; Mobile đã có tủ sách và AI viết ở `StoryDetailScreen`.

### File Mobile sẽ sửa
- `types/api.ts`: bổ sung trường BE đã trả (origin, answerEmotion, targetToken, scenes, coverSceneId, keywordWarnings…).
- `services/storyService.ts`: 8 hàm mới + `getStoryDetail`, `reviewStoryDetail`.
- `utils/storyEditor.ts` (mới): fillNames, form/body điểm dừng, kiểm tra phía client, `gapsByPath`.
- `screens/parent/StoryEditorScreen.tsx` (mới).
- `navigation/routes.ts` (route `STORY_EDITOR`), `navigation/ParentTabs.tsx`.
- `screens/parent/StoryDetailScreen.tsx`: nút "Sửa truyện" + dịch lỗi `errors.map` (:117).
- `screens/parent/StoryWizard.tsx`: bật lối "Tự viết".
- `tests/storyEditor.test.ts` (mới).

### Kết quả GĐ B1 (2026-11-09) — FIXTURE PASS, chưa test BE thật

| Hạng mục | Trạng thái |
|---|---|
| Service + type (8 endpoint + `getStoryDetail`, `reviewStoryDetail`) | DONE, FIXTURE PASS |
| Màn `StoryEditorScreen` (route `STORY_EDITOR`) | DONE, TSC PASS, `NOT_VERIFIED_AT_RUNTIME` |
| Wizard "Tự viết" | DONE, FIXTURE PASS (quét mã nguồn) |
| `StoryDetailScreen`: nút "Sửa truyện", dịch lỗi `errors.map` | DONE |

Kiểm tra: `npx tsc --noEmit` PASS; `apps/mobile/tests` 15/15 file PASS (mới: `storyEditor.test.ts` 12 ca). Sửa 1 câu mong đợi trong `tests/library.test.ts` (nút "Chỉnh sửa (chưa hỗ trợ)" → `onOpenEditor(storyId)`), là hệ quả trực tiếp của B1.

**Quyết định UI cho điện thoại**
- Một cột dọc: thẻ trang (ô nhập nhiều dòng, đếm "n tiếng", "Chưa lưu"/"Đã lưu", Hoàn tác + Lưu trang) → điểm dừng thụt lề ngay dưới trang → nút "Thêm điểm dừng sau trang n".
- Điểm dừng hiện tóm tắt trong danh sách; sửa trong bottom sheet (`Sheet`, có tránh bàn phím). Cảm xúc chọn bằng chip; phương án đúng (perspective) chọn bằng nút radio 44pt cạnh từng ô.
- Thêm điểm dừng bằng sheet: danh sách kiểu dạng radio, chỉ hiện kiểu hợp lệ cho trang đó (reflection chỉ ở trang cuối; kiểu hỏi nhân vật khác chỉ khi có nhân vật phụ), chọn nhân vật bằng chip.
- Điểm dừng khoá (truyện AI / Kể chuyện nhà mình): hiện đủ câu hỏi, cảm xúc đúng, gợi ý, phương án + dòng khoá, không có nút Sửa/Xoá.
- Ảnh bìa: dải ảnh cuộn ngang (chỉ cảnh `imageStatus = ready`), ẩn cả khối khi không có cảnh nào có ảnh.
- Thanh "Hoàn tất truyện" cố định ở đáy (như chân trang Wizard). Hoàn tất bị 422 → băng đỏ tóm tắt, tô đỏ thẻ lỗi, cuộn tới chỗ đầu tiên.
- Xoá truyện là nút phụ ở cuối danh sách, luôn qua Dialog xác nhận.
- Chống bấm đúp: một thao tác ghi tại một thời điểm, mọi nút ghi bị khoá khi đang chạy. Chữ đang sửa của các trang khác được giữ khi một lệnh khác trả truyện mới.
- Truyện đang AI viết → trạng thái chờ + "Tải lại"; truyện AI chưa có chữ → hướng dẫn quay lại Chi tiết truyện để cho AI viết.

**Điểm còn chưa chắc / chưa làm**
- `NOT_VERIFIED_AT_RUNTIME`: chưa chạy app, chưa gọi BE thật (cuộn tới lỗi, bàn phím trên Android, bottom sheet dài cần kiểm tay).
- **Hoàn tất (review) đẩy job giọng đọc TTS** khi truyện bật giọng đọc → có chi phí phía server. Chủ dự án tự test.
- Chưa hiện tiến độ giọng đọc / nút thử lại giọng đọc (Web `NarrationPanel`, `FinishBarStatus`) → B2/B3.
- Wizard "Tự viết" không hiện công tắc giọng đọc (giữ UI cũ), gửi `useTts: true` như mặc định của Web.
- `StoryDetailScreen` vẫn còn câu "Truyện tự viết cần thêm trang (chưa hỗ trợ trên Mobile)" ở trạng thái rỗng và chú thích "Điểm dừng… không chỉnh trực tiếp": không sửa vì phạm vi chỉ cho đổi nút mở editor. Truyện tự viết luôn có ≥ 4 trang nên trạng thái rỗng hiếm gặp.
- Giới hạn `custom_limits` (4–20 trang, ≤ 6 điểm dừng) không hard-code ở Mobile; vượt giới hạn thì hiện lỗi 422 của BE.
