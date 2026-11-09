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

## 18. GĐ B2 – Tranh AI, giọng đọc, làm mới credit (branch `feat/mobile-story-ai-media`)

Quyết định của chủ dự án: **không test thật sau từng đợt**, mọi test thật dồn về GĐ G. Đợt này chỉ có tsc + test fetch giả + review. Đọc từ source (`VERIFIED_FROM_SOURCE`) trước khi code. BE tính từ `BE/api/src/modules/stories/`.

### Endpoint

| Endpoint | Response | Luật / lỗi BE | Mobile |
|---|---|---|---|
| `POST /stories/:id/images` (routes:53) | 202 `data { portraits, scenes, waiting, insufficientCredit, skippedNoCredit? }` | `drawStoryImages` (images.service:215). Chỉ chủ truyện, truyện `private` (403 bản đăng bán), không `generating` (409). Quyền AI bị khoá → 403. Tự bật `useAiImage`. Vẽ chân dung còn thiếu rồi từng cảnh `none`/`failed`/`queued` có mô tả. Không vẽ được mục nào vì thiếu credit → 402 "Ba mẹ không đủ credit để vẽ tranh.". Hàng đợi lỗi → 503 (enqueueOrFail:35) | `storyService.drawImages` |
| `POST /stories/:id/scenes/:sceneId/image` (:54) | 202 `data { …như trên }` | `redrawScene` (:227): cảnh không có mô tả → 422; cảnh đang vẽ → 409; thiếu credit → 402; trừ credit lần nữa | `storyService.redrawScene` |
| `POST /stories/:id/narration/retry` (:47) | 202 `data { story }` | `retryNarration` (narration.service:46): chưa hoàn tất → 422; tắt giọng đọc → 422; hàng đợi lỗi → 503. Chỉ đưa lại đoạn lỗi / thiếu / lệch | `storyService.retryNarration` |
| `GET /stories/ai-pricing` (đã có) | `data { images: { characterPortrait, scene, maxScenes: 4 }, lengths[] }` (generation.service:226) | — | Bổ sung type `images` |

Hình dạng chi tiết truyện (`lib/storyFormat.js`):
- `scenes[]`: `{ id, sceneOrder, description, imageUrl, imageStatus }` (:101). `imageStatus`: `none | queued | generating | ready | failed`. `queued` mà chưa có job = đang chờ vẽ chân dung.
- `narration` (:93) = `narrationProgress` (`lib/narration.js:97`): `{ enabled, total, ready, pending, failed, missing, complete }`.
- `readiness`, `useAiImage`, `useTts`, `kind`.

### Web (nguồn hành vi)
- `CreateStoryPage.jsx:175-187`: `imagesMax = maxScenes × scene + chân dung còn thiếu × characterPortrait` (chỉ 2 lối AI khi bật tranh). Chân dung còn thiếu = nhân vật đã chọn, chưa có ảnh và `portraitStatus = 'none'`. `afterCost = số dư − giá viết chữ`; `scenes = afterCost < giá chân dung ? 0 : min(maxScenes, ⌊(afterCost − giá chân dung) / scene⌋)`. Ba mức: đủ cả N cảnh / chỉ đủ n/N cảnh / không có tranh. Công tắc giọng đọc hiện cho mọi lối (mặc định bật).
- `StoryEditorPage.jsx`: khung "Thêm tranh minh hoạ AI" (truyện AI chưa bật tranh, có mô tả cảnh); khung "n/N cảnh chưa có tranh" + "Vẽ tiếp" (cảnh `none`, không có cảnh đang vẽ, chặn khi số dư < giá 1 cảnh); `ScenePicture` (chưa vẽ / đang chờ chân dung / đang vẽ / lỗi – credit đã hoàn / xong, nút "Vẽ lại cảnh" hoặc "Vẽ tranh"); `NarrationPanel` + `narrationState.js` (ready / working / failed / stale), toast khi working → ready / failed.
- `hooks/useStudio.js`: hỏi lại GET /stories/:id mỗi 5 s khi `narration.pending > 0` hoặc còn cảnh đang vẽ; số cảnh đang vẽ giảm → tải lại credit (`f0fa6b3`); vẽ xong lệnh → tải lại truyện + credit.

### Mobile hiện có
- `ParentTabs.refreshCredit` đã gọi `authService.getMe()` rồi `auth.setCurrentUser` → dùng lại, không thêm hàm vào store.
- `GenerationRunner`: pattern polling bằng `setTimeout`, dừng khi rời màn, dừng sau 4 lần lỗi liên tiếp.
- `StoryView` chưa mang `scenes` / `narration` / `useAiImage` / `useTts` / `kind`; `AiPricingDto` chưa có `images`.

### File Mobile sẽ sửa
- `types/api.ts`, `types/viewModels.ts`, `services/storyService.ts` (3 hàm + map thêm trường BE trả).
- `utils/storyMedia.ts` (mới): `narrationState`, `imagePlan`, cảnh đang vẽ / còn thiếu, `createStoryPoller` (có trần số lần), `drawAndRefresh`.
- `components/parent/StoryMediaPanel.tsx` (mới): khung giọng đọc + tranh từng cảnh + vẽ tranh / vẽ tiếp / vẽ lại + polling.
- `screens/parent/StoryEditorScreen.tsx`, `screens/parent/StoryDetailScreen.tsx`, `navigation/ParentTabs.tsx` (truyền `refreshCredit`).
- `screens/parent/StoryWizard.tsx`: công tắc tranh AI + cảnh báo credit (2 lối AI), công tắc giọng đọc cho "Tự viết".
- `tests/storyMedia.test.ts` (mới), `docs/mobile/LO_TRINH_MOBILE.md`.

### Kết quả GĐ B2 (2026-11-09) — FIXTURE PASS, test thật dồn về GĐ G

| Hạng mục | Trạng thái |
|---|---|
| Service + type (`drawImages`, `redrawScene`, `retryNarration`, `NarrationDto`, `AiPricingDto.images`; `StoryView` mang `scenes`/`narration`/`useAiImage`/`useTts`/`kind`) | DONE, FIXTURE PASS |
| `StoryMediaPanel` (giọng đọc, tranh từng cảnh, vẽ tranh / vẽ tiếp / vẽ lại, polling) ở Sửa truyện + Chi tiết truyện | DONE, TSC PASS, `NOT_VERIFIED_AT_RUNTIME` |
| Wizard: công tắc tranh AI + cảnh báo credit (2 lối AI), công tắc giọng đọc cho mọi lối | DONE, FIXTURE PASS |
| Làm mới credit: sau khi bắt đầu vẽ, khi số cảnh đang vẽ giảm (xong / lỗi) | DONE (dùng `ParentTabs.refreshCredit` có sẵn, không thêm hàm vào store) |

Kiểm tra: `npx tsc --noEmit` PASS; `apps/mobile/tests` 16/16 file PASS (mới: `storyMedia.test.ts` 10 ca). `storyEditor.test.ts`: đổi ca cuối thành "editor không tự gọi API AI; tranh/giọng đọc chỉ qua `StoryMediaPanel`".

**Quyết định UI cho điện thoại**
- Tranh liệt kê theo cảnh thành một khối "Tranh minh hoạ (n/N cảnh)" ở đầu màn Sửa truyện và trong Chi tiết truyện, thay vì chèn tranh giữa các trang như Web: màn hẹp, đọc liền mạch hơn.
- Mỗi cảnh: ảnh 4:3 hoặc ô chờ (đang vẽ / chờ chân dung / lỗi – credit đã hoàn / chưa có tranh), nút "Vẽ lại cảnh" hoặc "Vẽ tranh" kèm số credit.
- Khung "n/N cảnh chưa có tranh" + "Vẽ tiếp n cảnh · x credit" (khoá khi số dư < giá 1 cảnh); khung "Thêm tranh minh hoạ AI" cho truyện AI chưa bật tranh.
- Giọng đọc: thẻ trạng thái + thanh tiến độ, nút "Thử lại giọng đọc" khi có đoạn lỗi; toast khi đang làm → xong / lỗi.
- Wizard: công tắc "Tranh minh hoạ bằng AI" + khung cảnh báo (xanh: đủ; cam: chỉ đủ n cảnh / không có tranh) ngay dưới công tắc.
- Polling 5 s, **trần 120 lần (10 phút)**, dừng sau 4 lần lỗi liên tiếp hoặc khi rời màn; dừng giữa chừng thì hiện "Cập nhật lại".

**Điểm còn chưa chắc / chưa làm**
- `NOT_VERIFIED_AT_RUNTIME`: chưa chạy app, chưa gọi BE (theo quyết định dồn test thật về GĐ G).
- Panel tự gọi `GET /stories/ai-pricing` một lần để lấy giá cảnh (GET, không tốn credit).
- Số credit hiển thị sau khi vẽ phụ thuộc thời điểm worker hoàn credit (vẽ lỗi hoàn sau vài giây); poller tải lại khi số cảnh đang vẽ giảm, giống Web.
- Khi Chi tiết truyện và Sửa truyện cùng nằm trong ngăn xếp, chỉ màn đang hiện mới polling (màn dưới bị unmount).
- Chưa có nút "Nâng gói" trong khung thiếu credit (GĐ D).
- Chân dung nhân vật (B3) chưa làm; truyện bật tranh vẫn tự vẽ chân dung còn thiếu ở BE.

## 19. Hotfix Expo Go audio (branch `fix/mobile-expo-go-audio`)

**Lỗi thật** (chủ dự án chạy Expo Go SDK 52 trên Android): `Error: Cannot find native module 'ExpoAudio'` → app sập ngay lúc khởi động.

**Nguyên nhân** (`VERIFIED_FROM_SOURCE`): `src/screens/kid/useKidUiAudio.ts` import tĩnh `createAudioPlayer`, `setAudioModeAsync` từ `expo-audio`. Bản Expo Go SDK 52 không có native module `ExpoAudio`. File này được `KidModeScreen` import, nên lỗi xảy ra khi nạp bundle, trước cả khi vào Kid Mode.

**Cách sửa** (chỉ `useKidUiAudio.ts`):
- Bỏ import giá trị; giữ `import type { AudioPlayer }`.
- Nạp tuỳ chọn ở cấp module: `try { ExpoAudio = require('expo-audio') } catch { ExpoAudio = null }`.
- `ExpoAudio` null → không gọi `GET /kid/ui-audio`, `canPlay` luôn false (không có nút "Nghe"), `play` không làm gì, không throw. Giống trường hợp API âm thanh lỗi đã có.
- Có module → hành vi giữ nguyên.
- Không đổi dependency, không đổi `app.json`.

**Kiểm tra:** `npx tsc --noEmit` PASS; 16/16 file test PASS. Thêm 1 ca ở `tests/kidUiAudio.test.ts`: chặn `require('expo-audio')` ném lỗi, gọi thật hook → nạp module không lỗi, không tải câu đọc, không có nút nghe, `play`/`stop`/rời màn không crash. Bản import tĩnh cũ sẽ làm ca này FAIL ngay lúc nạp.

**Hệ quả:** chạy bằng Expo Go SDK 52 thì Kid Mode **không có câu đọc giao diện** (nút "Nghe" ẩn); phần còn lại của Kid Mode dùng bình thường. Bản build thật (development build / APK có `expo-audio`) vẫn có âm thanh. `NOT_VERIFIED_AT_RUNTIME`: chưa chạy lại trên Expo Go; chủ dự án kiểm ở GĐ G.

## 20. GĐ B3 – Chân dung nhân vật AI (branch `feat/mobile-character-portrait`)

Test thật dồn về GĐ G; đợt này chỉ tsc + test fetch giả. Đọc từ source (`VERIFIED_FROM_SOURCE`) trước khi code.

### Endpoint

| Endpoint | Response | Luật / lỗi BE | Mobile |
|---|---|---|---|
| `POST /characters/:id/portrait` (`characters.routes.js:24`) | 202 `data { character, aiRequestId }` (`characters.controller.js:48`) | `startPortrait` (`stories.images.service.js:50`): không thấy nhân vật → 404; chưa có `appearance` → 422 "Hãy mô tả ngoại hình nhân vật trước khi tạo chân dung."; quyền AI bị khoá → 403; đang vẽ (`queued`/`generating`) → 409 "Chân dung nhân vật này đang được vẽ."; thiếu credit → 402 "Không đủ credit" (`creditLedger.js:40`); hàng đợi lỗi → 503. Giữ credit `ai_cost.character_portrait`, vẽ lỗi thì worker hoàn | `characterService.generatePortrait` (map qua `formatCharacter` có sẵn) |
| `GET /characters` (đã có) | `data { characters }` | `portraitStatus` (`none / queued / generating / ready / failed`), `portraitImageUrl`, `portraitFailure` (`blocked / error / null`, `lib/portraitFailure.js`) | polling khi có chân dung đang vẽ |
| `GET /children/:id` (đã có) | `data { child: { character } }` | nhân vật đại diện của bé | polling ở Chi tiết bé |
| `GET /stories/ai-pricing` (đã có) | `images.characterPortrait` | giá một chân dung | hiện chi phí trên nút |

### Web (nguồn hành vi)
- `components/parent/CharacterPortrait.jsx`: nút "Tạo chân dung AI" / "Vẽ lại" kèm "· N credit"; khoá khi chưa có mô tả; đang vẽ hiện vòng xoay "AI đang vẽ chân dung… (khoảng 30 giây)"; lỗi hiện lý do theo `portraitFailure`; 402 → "Ba mẹ không đủ credit để vẽ chân dung". Dùng ở `FamilyCharactersPage.jsx:147` và thẻ nhân vật của bé `children/CharacterCard.jsx:44`.
- `hooks/useStudio.js:127-139`: hỏi lại GET /characters mỗi 4 s khi có chân dung đang vẽ; số chân dung đang vẽ giảm → tải lại credit; bấm vẽ thành công → tải lại credit.
- `components/parent/AppearanceHints.jsx` (commit `a6aeb5b`): một câu gợi ý cách tả ngoại hình + cảnh báo khi mô tả có chi tiết dễ bị bộ lọc chặn (nhân vật có bản quyền, vũ khí, trang phục hở, "ốm/gầy/béo"). Chỉ nhắc, không chặn lưu.

### Mobile hiện có
- `CharactersScreen` đã hiện nhãn trạng thái chân dung và lý do lỗi (`portraitFailure`, GĐ A); chưa có nút vẽ.
- `ChildDetailScreen` hiện ảnh + mô tả `child.character`; chưa có nút vẽ.
- `CharacterFormSheet` chưa có gợi ý mô tả.
- `ParentTabs.refreshCredit` dùng lại để tải lại credit.

### Khác Web có chủ đích (theo yêu cầu đợt này)
- Bấm vẽ luôn qua **Dialog xác nhận ghi rõ "trừ N credit"**; Web bấm là vẽ ngay.
- Khoá nút khi không đủ credit (số dư < giá) và khi chưa tải được giá (không xác nhận được số credit sẽ trừ).
- Polling có trần (như B2), Web không có trần.

### File Mobile sẽ sửa
- `services/characterService.ts` (`generatePortrait`).
- `utils/characterPortrait.ts` (mới): trạng thái nút, câu lỗi, poller, gợi ý mô tả.
- `components/parent/CharacterPortraitAction.tsx` (mới): nút + trạng thái + xác nhận + hook polling.
- `screens/parent/CharactersScreen.tsx`, `screens/parent/ChildDetailScreen.tsx`, `navigation/ParentTabs.tsx`, `components/parent/CharacterFormSheet.tsx`.
- `tests/characterPortrait.test.ts` (mới), `docs/mobile/LO_TRINH_MOBILE.md`.

### Kết quả GĐ B3 (2026-11-09) — FIXTURE PASS, test thật dồn về GĐ G

| Hạng mục | Trạng thái |
|---|---|
| `characterService.generatePortrait` | DONE, FIXTURE PASS |
| `CharacterPortraitAction` ở màn Nhân vật + Chi tiết bé (nút, trạng thái đang vẽ, lý do lỗi, Dialog xác nhận, polling 4 s) | DONE, TSC PASS, `NOT_VERIFIED_AT_RUNTIME` |
| Gợi ý mô tả ngoại hình trong `CharacterFormSheet` | DONE |

Kiểm tra: `npx tsc --noEmit` PASS; `apps/mobile/tests` 17/17 file PASS (mới: `characterPortrait.test.ts` 8 ca). `tests/phase1.test.ts`: ràng buộc "Chi tiết bé không đụng luồng AI" đổi thành "không tự gọi API AI, chân dung chỉ qua `CharacterPortraitAction`" (hệ quả trực tiếp của B3).

**Quyết định UI cho điện thoại**
- Nút "Vẽ chân dung AI · N credit" / "Vẽ lại · N credit" là nút phụ nhỏ trên từng thẻ nhân vật; lý do khoá hiện ngay dưới nút (thiếu mô tả / không đủ credit / chưa tải được giá).
- Đang vẽ: thay nút bằng vòng xoay + "AI đang vẽ chân dung… (khoảng 30 giây)".
- Lỗi: câu theo `portraitFailure` (chữ đỏ) + nút "Vẽ lại".
- Chi tiết bé: nút nằm cuối thẻ hồ sơ, dưới mô tả ngoại hình của nhân vật đại diện. Sau khi vẽ / khi hỏi lại tiến độ chỉ thay dữ liệu hồ sơ, không nạp lại cả khối (không nháy skeleton).
- Gợi ý mô tả: một dòng gợi ý + ô cam cho từng chi tiết dễ bị chặn, ngay dưới ô mô tả.

**Điểm còn chưa chắc / chưa làm**
- `NOT_VERIFIED_AT_RUNTIME`: chưa vẽ chân dung thật.
- Ranh giới từ trong gợi ý mô tả dùng dải chữ Latin / tiếng Việt thay cho `\p{L}` của Web, để không phụ thuộc Hermes hỗ trợ Unicode property escape; khớp với các từ trong danh sách.
- Mỗi màn (Nhân vật, Chi tiết bé) gọi `GET /stories/ai-pricing` một lần để biết giá (GET, không tốn credit). Chưa tải được giá → khoá nút.
- Form hồ sơ bé (`ChildFormSheet`) chưa có gợi ý mô tả (Web có ở `ChildFormModal`); ngoài phạm vi đợt này.

## 21. GĐ C – Trang pháp lý + gợi ý mô tả ở form hồ sơ bé (branch `feat/mobile-legal-pages`) — FIXTURE PASS

Không có API mới. Nguồn Web (`VERIFIED_FROM_SOURCE`): `pages/legal/PrivacyPolicyPage.jsx` (9 mục), `pages/legal/TermsPage.jsx` (10 mục), `components/legal/LegalPage.jsx`, `constants/legal.js`, `components/auth/AuthShell.jsx:6-7`, `pages/parent/HelpPage.jsx:25-28`, `components/parent/children/ChildFormModal.jsx:110-124`.

| Hạng mục | Mobile | Trạng thái |
|---|---|---|
| Nội dung 2 trang (chép nguyên văn, con số từ `POLICY_NUMBERS`) | `constants/legal.ts` | DONE |
| Màn hiển thị chung (phiên bản, mục lục chạm để cuộn, mục đánh số, liên hệ) | `screens/legal/LegalScreen.tsx` | DONE |
| Chưa đăng nhập: 2 liên kết chân trang Đăng nhập / Đăng ký | `components/auth/LegalLinks.tsx`, `AppNavigator` (state `legal`, Back Android về màn auth) | DONE |
| Đã đăng nhập: 2 mục ở Trợ giúp | route `PRIVACY` / `TERMS` (ADR-015), `HelpScreen` | DONE |
| Form hồ sơ bé: ô "Ngoại hình của bé (không bắt buộc)" + gợi ý | `ChildFormSheet`, `AppearanceHints` (tách từ B3, dùng chung), `utils/child.ts` | DONE (chủ dự án duyệt thêm ô) |

Kiểm tra: `npx tsc --noEmit` PASS; `apps/mobile/tests` 18/18 file PASS (mới: `legal.test.ts` 6 ca, so nguyên văn với file Web).

**Quyết định / lưu ý**
- Form hồ sơ bé trên Mobile trước đây **không có** ô ngoại hình. Chủ dự án duyệt thêm ô như Web → payload `POST/PUT /children` có thêm `appearance` (tối đa 500).
- **BE gỡ nhân vật đại diện (kèm chân dung) khi nhận `appearance` rỗng / null** (`children.service.js` `applyCharacter`). Web gửi `null` mỗi lần sửa mà ô trống; Mobile chỉ gửi `null` khi ba mẹ thật sự xoá một mô tả đang có, và hiện câu nhắc "Để trống sẽ gỡ nhân vật đại diện (kèm chân dung) của bé." ngay dưới ô.
- `ChildProfile` mang thêm `appearance` (BE `child.character.appearance`, có trong `GET /children` và `GET /children/:id`) để form sửa điền sẵn.
- Liên kết chân trang Đăng ký ghi "Điều khoản sử dụng" (như Web AuthShell), tiêu đề trang là "Điều khoản dịch vụ" (như Web TermsPage).
- `NOT_VERIFIED_AT_RUNTIME`: chưa mở trên máy; chủ dự án kiểm ở GĐ G.

## 22. GĐ E1 – Chuyên gia: giám sát (branch `feat/mobile-specialist-monitoring`)

Test thật dồn về GĐ G; đợt này chỉ tsc + test fetch giả. Đọc từ source (`VERIFIED_FROM_SOURCE`) trước khi code. Mọi route dưới đây: `auth, authorize('specialist', 'admin')` (`BE/api/src/modules/monitoring/monitoring.routes.js:18`).

### Endpoint

| Endpoint (routes.js) | Query / body (zod) | Response (service) | Mobile |
|---|---|---|---|
| `GET /moderation/listings` (:35) | `status: suspended \| archived` (mặc định suspended) | `{ listings: [{ id, title, status, updatedAt, seller{id, displayName, status}, reportsCount, buyersCount, review{id, reviewType, decidedAt, decision, comment, moderator} \| null }] }` (`listRestrictedListings`:172) | `getRestrictedListings` |
| `GET /moderation/strikes` (:48) | `sellerId?`, `active?: 'true' \| 'false'` | `{ strikeLimit, strikes: [{ id, source, sourceId, reason, issuedAt, expiresAt, revokedAt, active, issuer{id,name}, seller{id, displayName, status}, appeal{…} \| null }] }` (`listStrikes`:262, `formatStrike`:239) | `getStrikes` |
| `POST /moderation/strikes` (:54, đã có) | `{ sellerId, source: report \| rejection \| takedown, sourceId?, reason ≥ 10 }` | 201 `{ strikeId, activeStrikes, strikeLimit, sellerSuspended }` | `issueStrike` (mở rộng `source`) |
| `GET /moderation/audits` (:70) | `open?: 'true' \| 'false'` | `{ audits: [{ reviewId, createdAt, decidedAt, decision, comment, moderator, listing{id, title, status, seller} }] }` (`listAudits`:389) | `getAudits` |
| `POST /moderation/audits/run` (:76) | `{ count?: 1..20 }` (mặc định `{}` → `moderation.audit_per_week`) | 201 `{ created, reviewIds }` (`runRandomAudits`:382, `scheduleRandomAudits`:350: chỉ truyện đang bán, người bán còn hoạt động, chưa có lượt duyệt mở, không được xem trong 30 ngày) | `runAudits` |
| `GET /moderation/ai-flags` (:83) | `days: 1..90` (7), `min: 1..100` (2) | `{ days, min, flags: [{ userId, fullName, email, total, blocked, failed, blockedRate, lastBlocked{at, reason, storyTitle} \| null, aiBlockedUntil }] }` (`listAiFlags`:417) | `getAiFlags` |
| `POST /moderation/ai-flags/:userId/block` (:89) | `{ days: 0..90 (0 = mở khoá), reason?: ≤ 2000 }` | `{ userId, aiBlockedUntil }` (`setAiBlock`:467: chỉ tài khoản phụ huynh, ghi nhật ký `ai.block` / `ai.unblock`) | `setAiBlock` |

### Web (nguồn hành vi)
- `services/specialistService.js`: `getSpecialistOverview` ghép `queue.length`, hồ sơ người bán chờ, tổng báo cáo mở, và **kiểm tra ngẫu nhiên = số mục `random_audit` trong hàng chờ**.
- `SuspendedPage.jsx`: tab Đang tạm gỡ / Đã gỡ hẳn; lượt duyệt đang mở → "…: xem lại" (mở Lượt duyệt); nút "Cảnh cáo" (`StrikeModal`, nguồn `takedown`, người bán cố định).
- `StrikesPage.jsx`: lọc "Chỉ cảnh cáo còn hiệu lực" (mặc định bật), ngưỡng `strikeLimit`, trạng thái (đã gỡ / hiệu lực đến / hết hạn), kháng nghị; nút "Ra cảnh cáo" (`StrikeModal`, nguồn `report`, chọn người bán đã duyệt).
- `AuditsPage.jsx`: số truyện 1–20 (mặc định 3) + "Chọn đợt ngay"; lượt chưa quyết định → "Kiểm tra" (mở Lượt duyệt).
- `AiFlagsPage.jsx`: khoảng 7 / 14 / 30 ngày, tối thiểu n lượt bị chặn; khoá 1/3/7/14/30 ngày + lý do (tuỳ chọn); mở khoá (`days: 0`).

### Mobile hiện có
- `SpecialistNavigator`: thanh tab Hàng chờ (= Tổng quan kiểm duyệt của Web) · Người bán · Báo cáo · Thêm; menu "Thêm" có 4 mục giám sát đang ghi "Dùng trên Web".
- `ManagementUi`: `ManagementPage` (kéo để tải lại), `ResourceBody`, `FilterChips`, `ReasonSheet`, `useMutationRunner` (chống bấm đúp, toast, lỗi BE nguyên văn).

### Quyết định điều hướng (ít xáo trộn nhất)
- Không thêm tab: 4 màn giám sát mở từ menu "Thêm" (thay 4 mục "Dùng trên Web" bằng màn thật), là màn con có nút Back như Lượt duyệt.
- "Tổng quan": dùng màn Hàng chờ hiện có (đã là Tổng quan kiểm duyệt của Web), chỉ thêm ô "Kiểm tra ngẫu nhiên" và một hàng lối tắt tới 4 màn giám sát. Hành vi hàng chờ giữ nguyên.

### File Mobile sẽ sửa
- `types/management.ts`, `services/moderationService.ts` (6 hàm + `buildSpecialistOverview`).
- `screens/specialist/{RestrictedListingsScreen,StrikesScreen,AuditsScreen,AiFlagsScreen}.tsx` (mới), `SpecialistQueueScreen.tsx` (thêm ô + lối tắt).
- `navigation/managementRoutes.ts`, `navigation/SpecialistNavigator.tsx`.
- `tests/specialistMonitoring.test.ts` (mới), `docs/mobile/ADMIN_SPECIALIST_MOBILE_IMPLEMENTATION.md`, `docs/mobile/LO_TRINH_MOBILE.md`.

### Kết quả GĐ E1 (2026-11-09) — FIXTURE PASS, test thật dồn về GĐ G

| Hạng mục | Trạng thái |
|---|---|
| Service + type (6 hàm, `issueStrike` nhận cả `takedown`, `buildSpecialistOverview`) | DONE, FIXTURE PASS |
| 4 màn giám sát + lối tắt / ô "Kiểm tra ngẫu nhiên chờ xem" ở Tổng quan | DONE, TSC PASS, `NOT_VERIFIED_AT_RUNTIME` |
| Điều hướng: màn con từ "Thêm" (thay "Dùng trên Web"), badge số kiểm tra chờ xem ở mục menu | DONE |

Kiểm tra: `npx tsc --noEmit` PASS; `apps/mobile/tests` 19/19 file PASS (mới: `specialistMonitoring.test.ts` 10 ca).

**Quyết định UI cho điện thoại**
- Danh sách dọc dạng thẻ, kéo để tải lại (`ManagementPage`), đủ loading / rỗng / lỗi (`ResourceBody`).
- Bộ lọc dạng chip (Đang tạm gỡ / Đã gỡ hẳn; Còn hiệu lực / Tất cả; 7 / 14 / 30 ngày). Số nguyên (số truyện cần kiểm, số lượt bị chặn tối thiểu) chọn bằng nút − / + (`NumberStepper` mới trong `ManagementUi`), không cần bàn phím số.
- Ra cảnh cáo: Truyện tạm gỡ dùng `ReasonSheet` có sẵn (lý do ≥ 10); Cảnh cáo tác giả dùng sheet chọn người bán đã duyệt + lý do.
- Khoá AI: sheet chọn 1 / 3 / 7 / 14 / 30 ngày + lý do tuỳ chọn, bấm "Khoá" → Dialog xác nhận → gọi BE.

**Thay đổi dùng chung**
- `useMutationRunner` (ManagementUi): câu báo thành công nhận thêm dạng hàm theo kết quả BE ("Đã chọn N truyện", "Đã cảnh cáo (2/3…)"); cách gọi bằng chuỗi giữ nguyên.

**Điểm còn chưa chắc**
- `NOT_VERIFIED_AT_RUNTIME`: chưa chạy với BE thật.
- Dialog xác nhận khoá AI mở từ trong bottom sheet: trên Android là hộp thoại hệ thống nên hiện trên sheet; trên Expo Web cần kiểm thứ tự lớp ở GĐ G.
- Cảnh cáo tác giả: danh sách người bán để chọn lấy từ `GET /moderation/sellers?status=approved` (như Web), không tìm kiếm; nhiều người bán thì danh sách dài.

## 23. GĐ F – Admin: Gói & định giá, Doanh thu & đối soát, Cấu hình AI (branch `feat/mobile-admin-plans-finance`)

Test thật dồn về GĐ G; đợt này chỉ tsc + test fetch giả. Đọc từ source (`VERIFIED_FROM_SOURCE`) trước khi code. Mọi route: `auth, authorize('admin')` (`BE/api/src/modules/admin/admin.routes.js:13`).

### Endpoint

| Endpoint (admin.routes.js) | Body / query (zod) | Response / luật (service) | Mobile |
|---|---|---|---|
| `GET /admin/plans` (:59) | — | `{ plans: [{ id, code, name, durationMonths, priceVnd, creditsPerMonth, maxChildren, maxCharacters, canSell, isActive, activeSubscribers }] }` (`listAdminPlans`:124, giá rẻ trước) | `getAdminPlans` |
| `POST /admin/plans` (:60) | `planFields` (:50): `name` 2–100, `priceVnd` số nguyên 0–100.000.000, `creditsPerMonth` 0–10.000, `maxChildren` 1–20, `maxCharacters` 1–200, `canSell`, `isActive` + `code` `^[A-Z0-9_]{2,40}$` (tự viết hoa), `durationMonths` 1 \| 12 | 201 `{ plan }`. Trùng mã → 409 "Mã gói đã tồn tại." (`createPlan`:133) | `createPlan` |
| `PUT /admin/plans/:planId` (:76) | các trường `planFields` tuỳ chọn, ít nhất 1 trường (không sửa `code`, `durationMonths`) | `{ plan }`. Gói `FREE`: giá luôn 0, không tắt được → 422 (`updatePlan`:146). Giá / credit mới chỉ áp dụng cho lần mua sau | `updatePlan` |
| `GET /admin/finance/summary?range` (:107, đã có) | `today \| 7d \| 30d \| 90d \| year` | `{ revenue, series, newParents, activePaidSubscriptions, sellerFunds }` (`finance.service.js` `summary`:51) | dùng lại `getFinanceSummary` |
| `GET /admin/finance/reconciliation` (:113) | — | `{ checkedAt, walletsChecked, walletMismatches[{ userId, walletType, walletBalance, ledgerBalance }], paidWithoutWebhook[{ orderId, payosOrderCode, totalVnd, paidAt }], counterDrift[{ listingId, title, purchaseCount, paidActual, freeClaimCount, freeActual }] }` (`reconciliation`:88). Chỉ báo, không tự sửa tiền | `getReconciliation` |
| `POST /admin/finance/reconciliation/fix-counters` (:114) | — | `{ fixed }` — tính lại bộ đếm lượt mua / nhận miễn phí của truyện theo quyền đọc thực tế, ghi nhật ký (`fixCounters`:126) | `fixCounters` |
| `GET /admin/settings` (:84) | — | `{ groups: { ai, market, moderation }, settings: [{ key, group, label, hint, unit, type: int \| rate, min, max, value, isDefault, updatedAt, updatedBy }] }` (`getSettings`:168, `describeSettings`) | `getSettings` |
| `PUT /admin/settings/:key` (:85) | `{ value: number }`; `key` ≤ 60 | `{ setting }`. `settingError` (`lib/settingsRegistry.js:68`): khoá ngoài registry, không phải số, `int` phải nguyên, ngoài [min, max], thời hạn hoàn tiền > số ngày giữ doanh thu → 422 (`updateSetting`:173, ghi nhật ký) | `updateSetting` |

Nhóm `ai` trong registry (`SETTINGS_REGISTRY`, `lib/settingsRegistry.js:7`): `ai_cost.story_text.short/medium/long`, `ai_cost.character_portrait`, `ai_cost.scene_image` (credit, 0–100), `finance.usd_vnd` (đ / 1 USD, 15.000–40.000). Kiểu `rate` (tỉ lệ 0..1, hiện %) chỉ có ở nhóm `market`.

### Web (nguồn hành vi)
- `PlansPage.jsx`: bảng gói + "Thêm gói" / sửa trong modal. Form: mã + thời hạn (chỉ khi tạo), tên, giá, credit/tháng, số bé, số nhân vật, "Được bán truyện", "Đang mở bán". Gói `FREE` khoá giá và công tắc mở bán. Cùng trang có nhóm cài đặt `market`, `moderation`.
- `FinanceReportPage.jsx`: chọn khoảng thời gian; 3 thẻ (khách đã trả, phần nền tảng giữ, phải trả người bán); biểu đồ; bảng phân tích (doanh thu gói, doanh thu truyện, − phần người bán, = hoa hồng, đã hoàn). Cuối trang: đối soát 3 mục (ví lệch sổ cái, đơn trả chưa có webhook, truyện lệch bộ đếm) + "Kiểm lại" + "Tính lại bộ đếm" (chỉ hiện khi có lệch).
- `AiConfigPage.jsx` + `components/admin/SettingsGroup.jsx` (`group="ai"`): mỗi dòng nhãn, gợi ý, "mặc định" / "sửa lần cuối … bởi …", ô số, đơn vị, nút lưu. Đoạn "Nhà cung cấp" giải thích khoá API nằm ở biến môi trường của dịch vụ ai/.

### Mobile hiện có
- `AdminNavigator`: tab Tổng quan · Việc chờ · Tài khoản · Thêm; menu "Thêm" có 3 mục "Dùng trên Web": Gói & định giá, Cấu hình AI, Doanh thu & đối soát.
- `AdminDashboardScreen` đã dùng `getFinanceSummary` (KPI, biểu đồ, quỹ người bán) với `FINANCE_RANGES`.
- `ManagementUi`: `ManagementPage`, `ResourceBody`, `FilterChips`, `KpiCard`, `InfoRow`, `useMutationRunner` (nhận câu báo dạng hàm từ E1), `NumberStepper`.

### Quyết định điều hướng
Giống E1: 3 màn con mở từ menu "Thêm", thay 3 mục "Dùng trên Web"; không thêm tab, không đổi 4 màn admin đang có.

### Ngoài phạm vi F
- Nhóm cài đặt `market` và `moderation` (Web đặt ở trang Gói): yêu cầu đợt này chỉ hiện nhóm `ai`.
- Biểu đồ doanh thu ở màn Doanh thu: đã có ở Tổng quan Admin; màn này hiện số liệu dạng thẻ + danh sách.

### File Mobile sẽ sửa
- `types/management.ts`, `services/adminService.ts` (7 hàm), `utils/adminConfig.ts` (mới: validate form gói, lọc nhóm `ai`, đổi giá trị cài đặt).
- `screens/admin/{PlansScreen,FinanceScreen,AiConfigScreen}.tsx` (mới), `navigation/managementRoutes.ts`, `navigation/AdminNavigator.tsx`.
- `tests/adminPlansFinance.test.ts` (mới), `docs/mobile/ADMIN_SPECIALIST_MOBILE_IMPLEMENTATION.md`, `docs/mobile/LO_TRINH_MOBILE.md`.

### Kết quả GĐ F (2026-11-10) — FIXTURE PASS, test thật dồn về GĐ G

| Hạng mục | Trạng thái |
|---|---|
| Service + type (7 hàm; `getFinanceSummary` dùng lại) | DONE, FIXTURE PASS |
| 3 màn Admin + điều hướng (màn con từ "Thêm", bỏ 3 mục "Dùng trên Web") | DONE, TSC PASS, `NOT_VERIFIED_AT_RUNTIME` |

Kiểm tra: `npx tsc --noEmit` PASS; `apps/mobile/tests` 20/20 file PASS (mới: `adminPlansFinance.test.ts` 9 ca).

**Quyết định UI cho điện thoại**
- Gói: thẻ dọc thay bảng 7 cột của Web; form trong bottom sheet, số nhập bằng bàn phím số, thời hạn bằng chip, 2 công tắc. Sửa gói chỉ gửi trường đã đổi; không đổi gì thì báo "Chưa có gì thay đổi", không gọi BE.
- Doanh thu: 3 thẻ KPI + danh sách phân tích dạng hàng (`InfoRow`); không lặp biểu đồ (đã có ở Tổng quan Admin). Đối soát: 3 mục có biểu tượng đạt / lệch, nút "Kiểm lại", nút "Tính lại bộ đếm" chỉ hiện khi có truyện lệch.
- Cấu hình AI: mỗi khoá một hàng (nhãn, gợi ý, ai sửa lần cuối, ô số + đơn vị, nút Lưu chỉ bật khi đổi giá trị).
- Mọi thao tác ghi: Dialog xác nhận → `useMutationRunner` (chống bấm đúp, toast theo kết quả BE, lỗi BE đã dịch).

**Điểm còn chưa chắc / chưa làm**
- `NOT_VERIFIED_AT_RUNTIME`: chưa chạy với BE thật.
- Nhóm cài đặt `market` / `moderation` (Web đặt ở trang Gói) chưa làm — đợt này chỉ cho hiện nhóm `ai`.
- Form gói mở trong bottom sheet, Dialog xác nhận mở chồng lên sheet: Android là hộp thoại hệ thống (hiện trên cùng); Expo Web cần kiểm thứ tự lớp ở GĐ G.
- `AdminNavigator`: bỏ `useDialog` / `WEB_ONLY_NOTICE` không còn dùng (hằng số vẫn dùng ở khu Chuyên gia cho các mục E2).
