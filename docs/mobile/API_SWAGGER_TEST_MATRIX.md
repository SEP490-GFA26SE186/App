# API SWAGGER TEST MATRIX – StoryWeaver

Ngày: 2026-10-26 · Swagger local: <http://localhost:3000/api/v1/docs/> · Tài liệu này **chỉ đọc source** (BE: routes, validation, Swagger `BE/api/src/docs`; FE: `App/apps/mobile/src`). Chưa gọi API nào. Mọi cột “Swagger Test” và “FE Runtime” đang là **NOT TESTED** cho tới khi bạn tự thử.
> Không có mật khẩu/token/secret trong tài liệu. Ô nhập nhạy cảm ghi `<tự nhập>`. Ví dụ dữ liệu chỉ lấy từ `example` do Swagger khai báo; nếu Swagger không có ví dụ, ô để trống (NOT VERIFIED).

**Mục lục:** [A. Dashboard](#a-dashboard) · [B. Đã nối & đang dùng](#b-api-đã-kết-nối-và-đang-dùng) · [C. Có service, UI chưa dùng](#c-api-có-service-nhưng-ui-chưa-dùng) · [D. Chưa kết nối](#d-api-chưa-kết-nối-trong-phạm-vi-mobile) · [E. Ngoài phạm vi](#e-api-ngoài-phạm-vi-mobile) · [F. Checklist test Swagger](#f-checklist-kiểm-thử-trên-swagger-theo-thứ-tự-phụ-thuộc) · [G. Tổng kết](#g-tổng-kết)

## A. Dashboard

Số liệu **đã kiểm tra lại từ source** (không dùng lại số cũ): BE có **169 route** (phân tích `routes/v1/index.js` + 22 file `*.routes.js`); Swagger khai báo **170 thao tác**. Kết quả trùng với báo cáo trước (72 / 38 / 2 / 32).

| Chỉ số | Số lượng |
|---|---|
| Tổng API Backend (route thực tế) | **169** |
| Thuộc phạm vi Mobile (Parent + Kid) | **72** |
| INTEGRATED & USED | **38** |
| SERVICE ONLY | **2** |
| NOT INTEGRATED | **32** |
| OUT OF SCOPE (không tính vào tỷ lệ Mobile) | 97 |
| NOT VERIFIED | 0 trạng thái FE; một số ô Swagger/quyền ghi NOT VERIFIED trong chi tiết |
| Tỷ lệ code tích hợp (USED + SERVICE ONLY) / 72 | **55.6%** |
| Tỷ lệ API được UI gọi / 72 | **52.8%** |
| Swagger Test đã PASS | **0** |
| FE Mobile Runtime đã PASS | **0** |

Phân bố theo nhóm Swagger (phạm vi Mobile):

| Nhóm Swagger | Tổng | USED | SERVICE ONLY | NOT INTEGRATED |
|---|---|---|---|---|
| Auth | 8 | 6 | 0 | 2 |
| Kid Mode | 12 | 9 | 1 | 2 |
| Email Verification | 2 | 0 | 0 | 2 |
| Children | 11 | 6 | 0 | 5 |
| Characters | 6 | 4 | 0 | 2 |
| EQ Skills | 2 | 0 | 0 | 2 |
| Stories | 22 | 8 | 0 | 14 |
| Bookshelf | 4 | 1 | 1 | 2 |
| Plans & Subscriptions | 1 | 1 | 0 | 0 |
| Plans | 3 | 2 | 0 | 1 |
| Topics | 1 | 1 | 0 | 0 |

**Xác minh “đã nối” (không chỉ có hàm):** với mỗi API USED, tôi tìm nơi gọi hàm service và kiểm tra file gọi **được import trong chuỗi điều hướng thật** (`App.tsx → AppNavigator → ParentTabs/KidModeScreen → màn hình/hook`). Các màn đều có route thật (`ROUTES.HOME/LIBRARY/STORY/CREATE/EQ/WALLET/CHILDREN/CHARACTERS/SETTINGS`), `useKidReader` được `KidModeScreen` dùng, `GenerationRunner` được `StoryWizard`/`StoryDetailScreen` dùng. `components/auth/AuthModal.tsx` có gọi login/register/PIN nhưng **không được import ở đâu (mã chết)** nên không tính. Đây là xác minh **tĩnh**; chưa chạy app với BE.

**Sai lệch Swagger ⇄ BE phát hiện được** (ảnh hưởng khi test trên Swagger):

| Mục | Chi tiết |
|---|---|
| Swagger **thiếu** | `POST /stories/:id/narration/retry` có route nhưng Swagger không mô tả (không thử được bằng form Swagger; NOT VERIFIED). |
| Swagger **thừa** | `POST /children/{id}/usage` và `POST /moderation/keywords/bulk` có trong Swagger nhưng BE không có route tương ứng (route thật của usage là **GET**). Đừng dùng hai mục này. |
| Mô tả lệch | `POST /stories/:id/publish-version` ghi “chưa hỗ trợ” (501). `GET /bookshelf` ghi hỗ trợ “Kid Session” nhưng middleware `auth` từ chối kid token (403) — dùng `GET /kid/bookshelf` cho Kid. |

## B. API đã kết nối và đang dùng

**38 API** — ưu tiên kiểm thử trước. Chi tiết từng API (params, body, status, checkbox) ở phần F theo số STT.

| STT | Nhóm Swagger | Method | Endpoint | Chức năng (Swagger) | Mô tả | Quyền | Trạng thái FE | Service (hàm) | Màn hình/hook/store dùng thực tế | Swagger Test | FE Runtime |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Auth | PUT | `/auth/change-password` | Đổi mật khẩu (đang đăng nhập) | Đổi mật khẩu (đang đăng nhập) | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `authService.changePassword` — services/authService.ts:192 | Settings — `screens/parent/SettingsScreen.tsx:75` | NOT TESTED | NOT TESTED |
| 3 | Auth | POST | `/auth/login` | Đăng nhập vào hệ thống | Cho phép đăng nhập bằng email hoặc username kèm theo mật khẩu. | Public | **INTEGRATED & USED** | `authService.login` — services/authService.ts:53 | Login — `screens/auth/LoginScreen.tsx:74` | NOT TESTED | NOT TESTED |
| 4 | Auth | POST | `/auth/logout` | Đăng xuất khỏi hệ thống | Vô hiệu hóa và thu hồi refresh token hiện tại. | Public | **INTEGRATED & USED** | `authService.logout` — services/authService.ts:159 | Bootstrap/Logout (store) — `stores/useAuthSession.ts:94` | NOT TESTED | NOT TESTED |
| 5 | Auth | GET | `/auth/me` | Lấy thông tin tài khoản hiện tại | Lấy thông tin tài khoản đang đăng nhập kèm số dư ví credit/earning. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `authService.getMe` — services/authService.ts:127 | Bootstrap/Logout (store), ParentTabs, Tải dữ liệu Parent (store) — `navigation/ParentTabs.tsx:56, stores/useAuthSession.ts:70, stores/useParentData.ts:45` | NOT TESTED | NOT TESTED |
| 6 | Auth | POST | `/auth/refresh-tokens` | Làm mới token (Token Rotation) | Gửi refresh token cũ để nhận về cặp access token và refresh token mới. | Public | **INTEGRATED & USED** | `refreshAccessToken (nội bộ apiClient)` — services/apiClient.ts:74 | Tự động khi 401 (apiClient.apiFetch) — `services/apiClient.ts (apiFetch → refreshAccessToken)` | NOT TESTED | NOT TESTED |
| 7 | Auth | POST | `/auth/register` | Đăng ký tài khoản phụ huynh mới | Tạo tài khoản mới, khởi tạo ví tiền và tự động gửi email xác thực qua Brevo. | Public | **INTEGRATED & USED** | `authService.register` — services/authService.ts:93 | Register — `screens/auth/RegisterScreen.tsx:76` | NOT TESTED | NOT TESTED |
| 9 | Kid Mode | POST | `/auth/kid-mode/enter` | Chuyển sang Chế độ Trẻ em (Kid Mode) | Bắt buộc phụ huynh phải có mã PIN. Cấp token phiên `kid_session` có phạm vi đọc truyện của riêng bé. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `authService.enterKidMode` — services/authService.ts:229 | Vào/thoát Kid Mode (store) — `stores/useKidSession.ts:31` | NOT TESTED | NOT TESTED |
| 10 | Kid Mode | POST | `/auth/kid-mode/exit` | Thoát Chế độ Trẻ em về Chế độ Phụ huynh | Nhập đúng mã PIN để đóng phiên đọc của bé và khôi phục quyền phụ huynh. | Kid session token | **INTEGRATED & USED** | `authService.exitKidMode` — services/authService.ts:263 | Vào/thoát Kid Mode (store) — `stores/useKidSession.ts:45` | NOT TESTED | NOT TESTED |
| 11 | Kid Mode | PUT | `/auth/kid-pin/change` | Thay đổi mã PIN thoát Kid Mode | Thay đổi mã PIN thoát Kid Mode (yêu cầu mã PIN hiện tại hoặc mật khẩu phụ huynh). | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `authService.changeKidPin` — services/authService.ts:218 | Settings — `screens/parent/SettingsScreen.tsx:108` | NOT TESTED | NOT TESTED |
| 12 | Kid Mode | POST | `/auth/kid-pin/set` | Thiết lập mã PIN thoát Kid Mode lần đầu | Thiết lập mã PIN (4-6 chữ số) lần đầu dùng để khóa và thoát khỏi Chế độ Trẻ em. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `authService.setKidPin` — services/authService.ts:206 | Settings — `screens/parent/SettingsScreen.tsx:109` | NOT TESTED | NOT TESTED |
| 13 | Kid Mode | GET | `/kid/bookshelf` | Giá sách của bé (chỉ truyện đã sẵn sàng: hoàn tất + đủ giọng đọc) | Giá sách của bé (chỉ truyện đã sẵn sàng: hoàn tất + đủ giọng đọc) | Kid | **INTEGRATED & USED** | `kidService.getShelf` — services/kidService.ts:14 | Kid Mode (tủ sách/đọc/điểm dừng) — `screens/kid/useKidReader.ts:46` | NOT TESTED | NOT TESTED |
| 15 | Kid Mode | POST | `/kid/sessions` | Bắt đầu / tiếp tục lượt đọc | Truyện phải nằm trên giá của bé và **sẵn sàng cho trẻ** (422 kèm tiến độ giọng đọc nếu chưa). Có lượt `in_progress` thì tiếp tục; không thì tạo lượt mới, `isFirstPlay` = bé chưa từng đọc truyện này (chỉ lượt đầu được chấm EQ). Nội dung trả về **không có đáp án… | Kid | **INTEGRATED & USED** | `kidService.startReading` — services/kidService.ts:24 | Kid Mode (tủ sách/đọc/điểm dừng) — `screens/kid/useKidReader.ts:89` | NOT TESTED | NOT TESTED |
| 17 | Kid Mode | POST | `/kid/sessions/:sessionId/answers` | Bé trả lời điểm dừng — BE chấm | Cảm xúc: `emotion`; vị trí người khác / giải quyết tình huống: `optionId`; liên hệ bản thân: chỉ `checkpointId`. Sai lần đầu (cảm xúc / vị trí) → `done: false` + `hint`; gửi lần nữa → `done: true`, sai thì kèm `answer`. Giải quyết tình huống trả `feedback`. Ch… | Kid | **INTEGRATED & USED** | `kidService.answer` — services/kidService.ts:47 | Kid Mode (tủ sách/đọc/điểm dừng) — `screens/kid/useKidReader.ts:167` | NOT TESTED | NOT TESTED |
| 18 | Kid Mode | POST | `/kid/sessions/:sessionId/complete` | Đọc xong (idempotent) | Đọc xong (idempotent) | Kid | **INTEGRATED & USED** | `kidService.complete` — services/kidService.ts:67 | Kid Mode (tủ sách/đọc/điểm dừng) — `screens/kid/useKidReader.ts:123` | NOT TESTED | NOT TESTED |
| 19 | Kid Mode | PUT | `/kid/sessions/:sessionId/progress` | Lưu trang đang đọc | Lưu trang đang đọc | Kid | **INTEGRATED & USED** | `kidService.saveProgress` — services/kidService.ts:36 | Kid Mode (tủ sách/đọc/điểm dừng) — `screens/kid/useKidReader.ts:78` | NOT TESTED | NOT TESTED |
| 23 | Children | GET | `/children` | Lấy danh sách hồ sơ các bé của phụ huynh | Lấy danh sách toàn bộ hồ sơ các bé thuộc tài khoản phụ huynh hiện tại. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `childService.getChildren` — services/childService.ts:20 | Tải dữ liệu Parent (store) — `stores/useParentData.ts:46` | NOT TESTED | NOT TESTED |
| 24 | Children | POST | `/children` | Tạo hồ sơ bé mới | Tạo hồ sơ cho bé. Kiểm tra giới hạn số lượng bé theo gói cước (mặc định miễn phí 2 bé). | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `childService.createChild` — services/childService.ts:30 | Bé (form) — `components/parent/ChildFormSheet.tsx:59` | NOT TESTED | NOT TESTED |
| 25 | Children | DELETE | `/children/:id` | Xóa hồ sơ bé (Soft delete) | Xóa mềm hồ sơ bé và đồng thời thu hồi mọi token phiên Kid Session đang hoạt động của bé. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `childService.deleteChild` — services/childService.ts:54 | Bé nhà mình — `screens/parent/ChildrenScreen.tsx:62` | NOT TESTED | NOT TESTED |
| 27 | Children | PUT | `/children/:id` | Cập nhật hồ sơ bé | Cập nhật thông tin bé, giờ đi ngủ, giọng đọc ưa thích hoặc giới hạn màn hình. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `childService.updateChild` — services/childService.ts:42 | Bé (form) — `components/parent/ChildFormSheet.tsx:59` | NOT TESTED | NOT TESTED |
| 31 | Children | GET | `/children/:id/eq-report` | Báo cáo EQ theo mức độ (radar 5 năng lực + kỹ năng con + topic gợi ý) | Mức kỹ năng con tính trên `window` câu chấm gần nhất; dưới `minItems` câu → null. Chỉ câu chấm ở lượt đọc đầu, điểm dừng không bị Specialist gắn cờ, có kỹ năng con (câu cũ không có `subSkillId` không tính). Không trả điểm / %: chỉ mức độ. Báo cáo phản ánh mức … | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `childService.getChildEqReport` — services/childService.ts:73 | Hành trình EQ — `screens/parent/EqReportScreen.tsx:43` | NOT TESTED | NOT TESTED |
| 32 | Children | GET | `/children/:id/overview` | Xem tổng quan bảng điều khiển của bé (Dashboard Overview) | Tổng hợp toàn diện thông tin bé: hồ sơ, tuổi tính theo ngày sinh, nhân vật đại diện (self character), thời lượng màn hình hôm nay, trạng thái giờ đi ngủ, thống kê kệ sách, truyện đang đọc dở và `eqReport` = nội dung của `/children/{id}/eq-report` (mức độ 5 năn… | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `childService.getChildOverview` — services/childService.ts:64 | Trang chủ Parent — `screens/parent/ParentHomeScreen.tsx:68` | NOT TESTED | NOT TESTED |
| 34 | Characters | GET | `/characters` | Lấy danh sách nhân vật của phụ huynh | Lấy danh sách nhân vật gia đình của phụ huynh (hỗ trợ lọc theo vai trò role hoặc theo bé childId). | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `characterService.getCharacters` — services/characterService.ts:13 | Tải dữ liệu Parent (store) — `stores/useParentData.ts:47` | NOT TESTED | NOT TESTED |
| 35 | Characters | POST | `/characters` | Tạo nhân vật gia đình mới | Tạo nhân vật gia đình mới từ mô tả chữ an toàn, liên kết với bé (tối đa 5 nhân vật với gói miễn phí). | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `characterService.createCharacter` — services/characterService.ts:20 | Nhân vật (form) — `components/parent/CharacterFormSheet.tsx:65` | NOT TESTED | NOT TESTED |
| 36 | Characters | DELETE | `/characters/:id` | Xóa mềm nhân vật | Xóa mềm nhân vật khỏi danh sách gia đình. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `characterService.deleteCharacter` — services/characterService.ts:38 | Nhân vật — `screens/parent/CharactersScreen.tsx:57` | NOT TESTED | NOT TESTED |
| 38 | Characters | PUT | `/characters/:id` | Cập nhật thông tin nhân vật | Cập nhật tên gọi, vai trò hoặc đặc điểm nhận dạng của nhân vật. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `characterService.updateCharacter` — services/characterService.ts:29 | Nhân vật (form) — `components/parent/CharacterFormSheet.tsx:60` | NOT TESTED | NOT TESTED |
| 42 | Stories | GET | `/stories` | Danh sách truyện của tôi | Danh sách truyện của tôi | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `storyService.getStories` — services/storyService.ts:41 | Tải dữ liệu Parent (store) — `stores/useParentData.ts:48` | NOT TESTED | NOT TESTED |
| 43 | Stories | POST | `/stories` | Tạo truyện nháp | Tạo truyện `kind = private`, `status = draft` cùng khung trang/cảnh/điểm dừng trống, dựng theo `length` (cấu hình `story_layout.*` trong `platform_settings`). Chưa có chữ và chưa tốn credit; gọi `POST /stories/{id}/generate` để AI viết chữ. Ba lối vào (`entry`… | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `storyService.createStory` — services/storyService.ts:63 | Tạo truyện (Wizard) — `screens/parent/StoryWizard.tsx:162` | NOT TESTED | NOT TESTED |
| 45 | Stories | GET | `/stories/:id` | Chi tiết truyện | Trả trang, cảnh, điểm dừng, phương án và nhân vật. Chữ truyện **giữ dạng token** `{NV1}`, `{NV2}`…; frontend thay token bằng tên khi hiển thị, dùng bảng `characters` (`token → name`). | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `storyService.getStory` — services/storyService.ts:56 | Chi tiết truyện — `screens/parent/StoryDetailScreen.tsx:58` | NOT TESTED | NOT TESTED |
| 52 | Stories | POST | `/stories/:id/generate` | Nhờ AI viết chữ cho truyện | Giữ credit theo độ dài (`ai_cost.story_text.<length>`), đặt truyện `generating`, đẩy job vào queue và trả ngay `202`. Frontend gọi `GET /stories/{id}/generation` mỗi 2–3 giây tới khi `succeeded` / `failed` / `blocked`. Thành công: credit được tính, truyện `rea… | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `storyService.startGeneration` — services/storyService.ts:95 | Tạo truyện (tiến độ) — `components/parent/GenerationRunner.tsx:88` | NOT TESTED | NOT TESTED |
| 53 | Stories | GET | `/stories/:id/generation` | Trạng thái lần sinh chữ mới nhất | Trả `{ generation }`: yêu cầu AI sinh chữ mới nhất của truyện, hoặc `null` nếu chưa sinh lần nào. `errorCode` và `errorMessage` được tách từ chuỗi lưu dạng `<CODE>: <message>` (`null` khi không lỗi). Job `queued`/`processing` quá 10 phút được coi là kẹt và đượ… | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `storyService.getGeneration` — services/storyService.ts:102 | Tạo truyện (tiến độ) — `components/parent/GenerationRunner.tsx:48` | NOT TESTED | NOT TESTED |
| 60 | Stories | POST | `/stories/:id/review` | Đánh dấu đã xem xong | Đặt `reviewedAt`. Chỉ nhận khi mọi trang có chữ và mọi điểm dừng đủ trường theo kiểu. Truyện đang `generating` trả `409` (mọi thao tác sửa đều bị khoá). | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `storyService.reviewStory` — services/storyService.ts:109 | Chi tiết truyện — `screens/parent/StoryDetailScreen.tsx:94` | NOT TESTED | NOT TESTED |
| 62 | Stories | GET | `/stories/ai-pricing` | Bảng giá AI viết truyện theo độ dài | Mỗi độ dài truyện AI (`short` / `medium` / `long`): số trang, số điểm dừng (`story_layout.<length>`) và số credit bị trừ khi bắt đầu viết (`ai_cost.story_text.<length>`, Admin chỉnh ở Cấu hình AI). Trang tạo truyện dùng để báo giá trước cho ba mẹ. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `storyService.getAiPricing` — services/storyService.ts:88 | Tạo truyện (Wizard) — `screens/parent/StoryWizard.tsx:99` | NOT TESTED | NOT TESTED |
| 63 | Stories | POST | `/stories/analyze` | Phân tích lời kể "Kể chuyện nhà mình" | Phân tích lời kể "Kể chuyện nhà mình" | Parent | **INTEGRATED & USED** | `storyService.analyze` — services/storyService.ts:73 | Tạo truyện (Wizard) — `screens/parent/StoryWizard.tsx:184` | NOT TESTED | NOT TESTED |
| 65 | Bookshelf | POST | `/bookshelf` | Thêm truyện vào kệ sách của bé | Thêm một câu chuyện vào kệ sách cá nhân của bé. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `storyService.addToShelf` — services/storyService.ts:116 | Chi tiết truyện, ParentTabs — `navigation/ParentTabs.tsx:72, screens/parent/StoryDetailScreen.tsx:112` | NOT TESTED | NOT TESTED |
| 68 | Plans & Subscriptions | GET | `/subscriptions/me` | Xem thông tin gói đăng ký và định mức sử dụng hiện tại | Xem chi tiết gói thành viên đang sử dụng, thời gian hết hạn, số lượng hồ sơ bé/nhân vật đã tạo và số lượt AI story / AI image còn lại trong chu kỳ. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `billingService.getSubscription` — services/billingService.ts:15 | Credit (Wallet) — `screens/parent/WalletScreen.tsx:64` | NOT TESTED | NOT TESTED |
| 69 | Plans | GET | `/plans` | Gói đang bán (công khai) | Gói đang bán (công khai) | Public | **INTEGRATED & USED** | `billingService.getPlans` — services/billingService.ts:8 | Credit (Wallet) — `screens/parent/WalletScreen.tsx:65` | NOT TESTED | NOT TESTED |
| 71 | Plans | GET | `/subscriptions/me/credit-history` | Lịch sử credit cộng / trừ (sổ cái) | Mới nhất trước. Bỏ dòng credit_consume (0 credit). context: { kind: ai, requestType, storyTitle, characterName } \| { kind: plan, planName }. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `billingService.getCreditHistory` — services/billingService.ts:22 | Credit (Wallet) — `screens/parent/WalletScreen.tsx:87` | NOT TESTED | NOT TESTED |
| 72 | Topics | GET | `/topics` | Danh sách bài học | **Phụ huynh:** chỉ bài học đang dùng, không kèm `guidance`. **Specialist / Admin:** mọi bài học + `guidance`, `storiesCount`, `creator`; lọc `skillId`, `search`, `isActive`. | Đã đăng nhập – access token thường | **INTEGRATED & USED** | `storyService.getTemplates` — services/storyService.ts:134 | Tải dữ liệu Parent (store) — `stores/useParentData.ts:49` | NOT TESTED | NOT TESTED |

## C. API có service nhưng UI chưa dùng

**2 API**: đã có hàm trong `services/*` nhưng không màn hình/hook nào gọi.

| STT | Nhóm Swagger | Method | Endpoint | Chức năng (Swagger) | Mô tả | Quyền | Trạng thái FE | Service (hàm) | Màn hình/hook/store dùng thực tế | Swagger Test | FE Runtime |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 20 | Kid Mode | GET | `/kid/ui-audio` | Câu đọc dùng chung (tên cảm xúc, câu nhắc) | Câu đọc dùng chung (tên cảm xúc, câu nhắc) | Kid | **SERVICE ONLY** | `kidService.getUiAudio` — services/kidService.ts:72 | — (không có màn gọi) | NOT TESTED | NOT TESTED |
| 66 | Bookshelf | DELETE | `/bookshelf/:storyId` | Xóa truyện khỏi kệ sách của bé | Xóa một câu chuyện khỏi kệ sách của bé (không làm mất lịch sử đọc truyện đã ghi nhận). | Đã đăng nhập – access token thường | **SERVICE ONLY** | `storyService.removeFromShelf` — services/storyService.ts:125 | — (không có màn gọi) | NOT TESTED | NOT TESTED |

## D. API chưa kết nối trong phạm vi Mobile

**32 API**. “Mức ưu tiên” là đề xuất theo nghiệp vụ Mobile (Parent/Kid), không phải quyết định của nhóm.

| STT | Nhóm Swagger | Method | Endpoint | Chức năng (Swagger) | Quyền | Ưu tiên | Lý do / chức năng Mobile còn thiếu | Swagger Test | FE Runtime |
|---|---|---|---|---|---|---|---|---|---|
| 2 | Auth | POST | `/auth/forgot-password` | Quên mật khẩu — gửi mã khôi phục qua email | Public | **Cao** | Khôi phục tài khoản Parent; cần email BE | NOT TESTED | — |
| 8 | Auth | POST | `/auth/reset-password` | Đặt lại mật khẩu bằng mã trong email | Public | **Cao** | Đi cùng quên mật khẩu | NOT TESTED | — |
| 44 | Stories | DELETE | `/stories/:id` | Xoá mềm truyện | Đã đăng nhập – access token thường | **Cao** | PUT/DELETE: sửa và xóa truyện — thiếu quản lý truyện | NOT TESTED | — |
| 46 | Stories | PUT | `/stories/:id` | Sửa thông tin truyện | Đã đăng nhập – access token thường | **Cao** | PUT/DELETE: sửa và xóa truyện — thiếu quản lý truyện | NOT TESTED | — |
| 48 | Stories | POST | `/stories/:id/checkpoints` | Thêm điểm dừng (chỉ truyện custom) | Đã đăng nhập – access token thường | **Cao** | Soạn điểm dừng EQ | NOT TESTED | — |
| 49 | Stories | DELETE | `/stories/:id/checkpoints/:cpId` | Xoá điểm dừng (chỉ truyện custom) | Đã đăng nhập – access token thường | **Cao** | Sửa/xóa điểm dừng | NOT TESTED | — |
| 50 | Stories | PUT | `/stories/:id/checkpoints/:cpId` | Sửa điểm dừng | Đã đăng nhập – access token thường | **Cao** | Sửa/xóa điểm dừng | NOT TESTED | — |
| 56 | Stories | POST | `/stories/:id/pages` | Thêm trang (chỉ truyện custom) | Đã đăng nhập – access token thường | **Cao** | Soạn truyện tự viết | NOT TESTED | — |
| 57 | Stories | DELETE | `/stories/:id/pages/:pageId` | Xoá trang (chỉ truyện custom) | Đã đăng nhập – access token thường | **Cao** | Sửa/xóa trang khi soạn truyện | NOT TESTED | — |
| 58 | Stories | PUT | `/stories/:id/pages/:pageId` | Sửa chữ của trang | Đã đăng nhập – access token thường | **Cao** | Sửa/xóa trang khi soạn truyện | NOT TESTED | — |
| 16 | Kid Mode | GET | `/kid/sessions/:sessionId` | Nội dung + câu đã trả lời của lượt đọc | Kid | **Trung bình** | Khôi phục lượt đọc đang dở | NOT TESTED | — |
| 21 | Email Verification | POST | `/auth/send-verification-email` | Gửi lại mã xác thực email | Đã đăng nhập – access token thường | **Trung bình** | Xác minh email (cần BE gửi email) | NOT TESTED | — |
| 22 | Email Verification | POST | `/auth/verify-email` | Xác thực Email bằng mã trong email | Đã đăng nhập – access token thường | **Trung bình** | Xác minh email | NOT TESTED | — |
| 28 | Children | PUT | `/children/:id/avatar` | Cập nhật chân dung / ngoại hình đại diện của bé | Đã đăng nhập – access token thường | **Trung bình** | Đổi avatar bé | NOT TESTED | — |
| 29 | Children | GET | `/children/:id/bookshelf` | Lấy danh sách truyện trên kệ sách của riêng bé | Đã đăng nhập – access token thường | **Trung bình** | Kệ sách của riêng bé phía Parent | NOT TESTED | — |
| 30 | Children | GET | `/children/:id/eq-journey` | Báo cáo EQ chi tiết: bằng chứng, gợi ý trò chuyện, xu hướng theo tuần | Đã đăng nhập – access token thường | **Trung bình** | Hành trình EQ chi tiết (bằng chứng, gợi ý) | NOT TESTED | — |
| 33 | Children | GET | `/children/:id/usage` | Xem thống kê thời lượng sử dụng màn hình của bé | Đã đăng nhập – access token thường | **Trung bình** | Thống kê thời lượng dùng — liên quan giới hạn màn hình | NOT TESTED | — |
| 39 | Characters | POST | `/characters/:id/portrait` | Vẽ chân dung AI cho nhân vật (1 ảnh, làm ảnh tham chiếu cho tranh) | Đã đăng nhập – access token thường | **Trung bình** | Chân dung AI (tốn credit, cần AI) | NOT TESTED | — |
| 40 | EQ Skills | GET | `/eq-skills` | Lấy danh mục 5 nhóm năng lực trí tuệ cảm xúc chuẩn quốc tế CASEL | Public | **Trung bình** | Thay hằng số CASEL cục bộ bằng dữ liệu BE | NOT TESTED | — |
| 47 | Stories | PUT | `/stories/:id/characters` | Đổi nhân vật của truyện | Đã đăng nhập – access token thường | **Trung bình** | Đổi nhân vật của truyện | NOT TESTED | — |
| 51 | Stories | PUT | `/stories/:id/cover` | Chọn ảnh bìa (ảnh một cảnh) | Parent | **Trung bình** | Chọn bìa | NOT TESTED | — |
| 54 | Stories | POST | `/stories/:id/images` | Bật tranh AI và vẽ mọi cảnh còn thiếu | Đã đăng nhập – access token thường | **Trung bình** | Bật tranh AI (tốn credit, cần AI) | NOT TESTED | — |
| 55 | Stories | POST | `/stories/:id/narration/retry` | (Swagger thiếu – NOT VERIFIED) | Đã đăng nhập – access token thường | **Trung bình** | Sinh lại giọng đọc (liên quan C11) | NOT TESTED | — |
| 61 | Stories | POST | `/stories/:id/scenes/:sceneId/image` | Vẽ lại tranh một cảnh | Đã đăng nhập – access token thường | **Trung bình** | Vẽ lại một cảnh (tốn credit, cần AI) | NOT TESTED | — |
| 64 | Bookshelf | GET | `/bookshelf` | Lấy danh sách truyện trên kệ sách của bé | Đã đăng nhập – access token thường | **Trung bình** | GET: xem kệ sách phía Parent | NOT TESTED | — |
| 14 | Kid Mode | GET | `/kid/me` | Hồ sơ bé đang dùng máy | Kid | **Thấp** | Hồ sơ bé trong Kid Mode (hiện lấy từ dữ liệu đã có) | NOT TESTED | — |
| 26 | Children | GET | `/children/:id` | Lấy chi tiết hồ sơ một bé | Đã đăng nhập – access token thường | **Thấp** | GET chi tiết bé (danh sách đã đủ) | NOT TESTED | — |
| 37 | Characters | GET | `/characters/:id` | Lấy thông tin chi tiết một nhân vật | Đã đăng nhập – access token thường | **Thấp** | GET chi tiết (danh sách đã đủ) | NOT TESTED | — |
| 41 | EQ Skills | GET | `/eq-skills/:id` | Xem chi tiết một kỹ năng EQ | Public | **Thấp** | Chi tiết kỹ năng | NOT TESTED | — |
| 59 | Stories | POST | `/stories/:id/publish-version` | Đăng bán (chưa hỗ trợ) | Đã đăng nhập – access token thường | **Thấp** | BE chưa hỗ trợ (501) | NOT TESTED | — |
| 67 | Bookshelf | GET | `/bookshelf/check/:storyId` | Kiểm tra truyện đã có trên kệ sách của bé chưa | Đã đăng nhập – access token thường | **Thấp** | Kiểm tra trạng thái nút "thêm vào kệ" | NOT TESTED | — |
| 70 | Plans | GET | `/plans/:id` | Chi tiết gói | Public | **Thấp** | Chi tiết gói | NOT TESTED | — |

## E. API ngoài phạm vi Mobile

**97 API** (Seller/Marketplace/Payment = SCOPE PENDING; Moderator/Admin/Specialist; nội dung & hạ tầng). Không tính vào tỷ lệ hoàn thành Mobile; FE không có lời gọi nào (đã grep). ⚠️ Các API thanh toán, rút tiền, hoàn tiền, quản trị **không nên tự gọi thử**.

| STT | Nhóm Swagger | Method | Endpoint | Chức năng (Swagger) | Quyền | FE | Swagger Test |
|---|---|---|---|---|---|---|---|
| 73 | Health | GET | `/health` | Kiểm tra trạng thái server | Public (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 74 | Checkpoint Review | GET | `/checkpoint-review` | Hàng đợi soát mẫu điểm dừng chấm điểm | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 75 | Checkpoint Review | DELETE | `/checkpoint-review/:checkpointId/flag` | Gỡ cờ loại | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 76 | Checkpoint Review | POST | `/checkpoint-review/:checkpointId/flag` | Loại điểm dừng khỏi điểm và báo cáo | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 77 | Checkpoint Review | POST | `/checkpoint-review/:checkpointId/ok` | Đánh dấu điểm dừng ổn | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 78 | Checkpoint Review | GET | `/checkpoint-review/stats` | Thống kê soát theo mẫu câu hỏi | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 79 | Pedagogy | GET | `/pedagogy/report-settings` | Tham số báo cáo EQ | Specialist/Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 80 | Pedagogy | PUT | `/pedagogy/report-settings` | Sửa tham số báo cáo EQ | Specialist/Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 81 | Publishing | POST | `/listings` | Đăng bán một truyện riêng đã hoàn tất | Seller (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 82 | Publishing | POST | `/listings/:listingId/versions` | Đăng phiên bản mới của truyện đang bán | Seller (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 83 | Publishing | GET | `/listings/mine` | Truyện tôi đăng bán | Parent (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 84 | Publishing | POST | `/sellers/apply` | Nộp hồ sơ người bán | Parent (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 85 | Publishing | GET | `/sellers/me` | Hồ sơ người bán của tôi | Parent (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 86 | Publishing | PUT | `/sellers/me` | Sửa hồ sơ bán (biệt danh, giới thiệu, kinh nghiệm) | Seller (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 87 | Publishing | PUT | `/sellers/me/bank` | Tài khoản nhận tiền | Seller (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 88 | Publishing | GET | `/sellers/me/earnings` | Doanh thu: chờ (giữ 3 ngày) / rút được / đang rút, tài khoản nhận, lịch sử | Seller (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 89 | Publishing | GET | `/sellers/me/strikes` | Cảnh cáo của tôi | Seller (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 90 | Publishing | POST | `/sellers/me/strikes/:strikeId/appeal` | Kháng nghị cảnh cáo | Seller (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 91 | Publishing | POST | `/sellers/me/withdrawals` | Yêu cầu rút tiền ⚠️💰 | Seller (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 92 | Publishing | DELETE | `/sellers/me/withdrawals/:id` | Huỷ yêu cầu rút (khi Admin chưa duyệt) ⚠️💰 | Seller (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 93 | Market | POST | `/market/checkout` | Mua / nhận truyện ⚠️💰 | Parent (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 94 | Market | GET | `/market/listings` | Truyện đang bán (chỉ published) | NOT VERIFIED (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 95 | Market | GET | `/market/listings/:listingId` | Chi tiết truyện đang bán + trang đầu xem trước (tên chung) | NOT VERIFIED (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 96 | Market | POST | `/market/listings/:listingId/reports` | Báo cáo truyện đang bán | Parent (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 97 | Market | PUT | `/market/listings/:listingId/review` | Tạo / sửa đánh giá của mình | Parent (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 98 | Market | GET | `/market/listings/:listingId/reviews` | Đánh giá của truyện + quyền đánh giá của người xem | NOT VERIFIED (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 99 | Market | GET | `/market/owned` | Truyện đã mua / nhận (entitlement) | Parent (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 100 | Market | GET | `/market/report-categories` | Loại vi phạm để báo cáo (value + nhãn tiếng Việt) | NOT VERIFIED (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 101 | Market | POST | `/market/reviews/:reviewId/reply` | Trả lời đánh giá (một lần) | Seller (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 102 | Market | POST | `/market/reviews/:reviewId/reports` | Báo cáo đánh giá | Parent (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 103 | Market | GET | `/market/sellers/:sellerId` | Hồ sơ công khai người bán + truyện đang bán | Auth (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 104 | Admin Withdrawals | GET | `/admin/withdrawals` | Yêu cầu rút tiền theo trạng thái ⚠️💰 | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 105 | Admin Withdrawals | POST | `/admin/withdrawals/:id/mark-paid` | Đã chuyển khoản tay → paid ⚠️💰 | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 106 | Admin Withdrawals | POST | `/admin/withdrawals/:id/reject` | Từ chối (bắt buộc lý do) → trả tiền ⚠️💰 | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 107 | Payments | POST | `/payments/order-items/:itemId/refund` | Yêu cầu hoàn tiền ⚠️💰 | Parent (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 108 | Payments | GET | `/payments/orders` | Lịch sử thanh toán (đơn có phí) + trạng thái / hạn hoàn tiền từng mục ⚠️💰 | Parent (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 109 | Payments | GET | `/payments/orders/:orderId` | Trạng thái đơn — BE tự hỏi lại payOS khi đơn chưa xong ⚠️💰 | Parent (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 110 | Payments | POST | `/payments/payos/webhook` | Webhook thanh toán (không token, xác thực bằng chữ ký) ⚠️💰 | payOS (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 111 | Payments | POST | `/payments/plans/checkout` | Mua / đổi gói qua payOS ⚠️💰 | Parent (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 112 | Sub-skills | GET | `/sub-skills` | Danh sách kỹ năng con | NOT VERIFIED (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 113 | Sub-skills | PUT | `/sub-skills/:id` | Điều chỉnh kỹ năng con | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 114 | Question Templates | GET | `/question-templates` | Danh sách mẫu câu hỏi | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 115 | Question Templates | POST | `/question-templates` | Tạo mẫu + phiên bản 1 nháp | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 116 | Question Templates | DELETE | `/question-templates/:id` | Xoá mẫu | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 117 | Question Templates | PUT | `/question-templates/:id` | Đổi tên / bật tắt mẫu | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 118 | Question Templates | PUT | `/question-templates/:id/draft` | Lưu bản nháp | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 119 | Question Templates | POST | `/question-templates/:id/duplicate` | Nhân bản mẫu | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 120 | Question Templates | POST | `/question-templates/:id/publish` | Ban hành bản nháp | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 121 | Content Library | GET | `/content-library/stats` | Thống kê toàn bộ tài nguyên Content Library | Specialist / Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 122 | Content Library | GET | `/ui-audio-assets` | Lấy danh sách tài nguyên âm thanh giao diện | NOT VERIFIED (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 123 | Content Library | POST | `/ui-audio-assets` | Tạo mới âm thanh giao diện | Specialist / Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 124 | Content Library | DELETE | `/ui-audio-assets/:id` | Xóa âm thanh giao diện | Specialist / Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 125 | Content Library | GET | `/ui-audio-assets/:id` | Lấy chi tiết âm thanh giao diện theo ID | NOT VERIFIED (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 126 | Content Library | PUT | `/ui-audio-assets/:id` | Cập nhật âm thanh giao diện | Specialist / Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 127 | Content Library | GET | `/ui-audio-assets/by-key/:key` | Lấy âm thanh giao diện theo mã key và ngôn ngữ | NOT VERIFIED (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 128 | Moderation | GET | `/moderation/ai-flags` | Cảnh báo AI: phụ huynh có nhiều lượt AI bị chặn | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 129 | Moderation | POST | `/moderation/ai-flags/:userId/block` | Tạm khoá / mở khoá quyền dùng AI | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 130 | Moderation | GET | `/moderation/audits` | Lượt kiểm tra ngẫu nhiên | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 131 | Moderation | POST | `/moderation/audits/run` | Chọn ngay một đợt kiểm tra ngẫu nhiên | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 132 | Moderation | GET | `/moderation/keywords` | Danh sách từ khoá bị chặn | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 133 | Moderation | POST | `/moderation/keywords` | Thêm từ khoá | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 134 | Moderation | DELETE | `/moderation/keywords/:id` | Xoá từ khoá | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 135 | Moderation | PUT | `/moderation/keywords/:id` | Đổi mức độ / bật tắt từ khoá | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 136 | Moderation | GET | `/moderation/listings` | Truyện đang tạm gỡ / đã gỡ hẳn | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 137 | Moderation | POST | `/moderation/listings/:listingId/suspend` | Tạm gỡ truyện đang bán | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 138 | Moderation | POST | `/moderation/product-reviews/:reviewId/hide` | Ẩn đánh giá vi phạm | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 139 | Moderation | GET | `/moderation/reports` | Báo cáo vi phạm, gom theo truyện | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 140 | Moderation | POST | `/moderation/reports/:reportId/dismiss` | Bác báo cáo (không vi phạm) | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 141 | Moderation | GET | `/moderation/sellers` | Hồ sơ người bán theo trạng thái (?status=pending) | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 142 | Moderation | POST | `/moderation/sellers/:userId/decision` | Duyệt / từ chối hồ sơ người bán | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 143 | Moderation | GET | `/moderation/strikes` | Danh sách cảnh cáo | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 144 | Moderation | POST | `/moderation/strikes` | Cảnh cáo tác giả | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 145 | Moderation | GET | `/moderation/submissions` | Hàng đợi truyện chờ duyệt (cũ nhất trước) | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 146 | Moderation | GET | `/moderation/submissions/:reviewId` | Chi tiết lượt duyệt: truyện (tên chung), giá bán, trang đã xem, tiến độ | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 147 | Moderation | POST | `/moderation/submissions/:reviewId/claim` | Nhận bài (giữ 30 phút) | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 148 | Moderation | POST | `/moderation/submissions/:reviewId/decision` | Quyết định | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 149 | Moderation | POST | `/moderation/submissions/:reviewId/pages/:pageId/view` | Đánh dấu đã xem trang (+ nhận xét) | Specialist (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 150 | Admin | GET | `/admin/accounts` | Tài khoản | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 151 | Admin | PATCH | `/admin/accounts/:userId` | Khoá / mở khoá tài khoản | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 152 | Admin | POST | `/admin/accounts/moderators` | Tạo tài khoản Chuyên gia sư phạm | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 153 | Admin | GET | `/admin/appeals` | Kháng nghị cảnh cáo | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 154 | Admin | POST | `/admin/appeals/:appealId/decision` | Xét kháng nghị | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 155 | Admin | GET | `/admin/audit-logs` | Nhật ký thao tác (Admin + Specialist) | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 156 | Admin | GET | `/admin/finance/reconciliation` | Đối soát: số dư ví ↔ sổ cái, đơn đã trả không có webhook, bộ đếm truyện | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 157 | Admin | POST | `/admin/finance/reconciliation/fix-counters` | Tính lại bộ đếm lượt mua / nhận của truyện | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 158 | Admin | GET | `/admin/finance/summary` | Tổng quan tài chính | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 159 | Admin | GET | `/admin/overview` | Badge menu: rút tiền / hoàn tiền / kháng nghị đang chờ | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 160 | Admin | GET | `/admin/plans` | Mọi gói (kể cả đã tắt) + số người đang dùng | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 161 | Admin | POST | `/admin/plans` | Tạo gói | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 162 | Admin | PUT | `/admin/plans/:planId` | Sửa gói | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 163 | Admin | GET | `/admin/refunds` | Yêu cầu hoàn tiền | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 164 | Admin | POST | `/admin/refunds/:refundId/decision` | Duyệt / từ chối hoàn tiền | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 165 | Admin | GET | `/admin/settings` | Cấu hình được sửa (chi phí AI, chợ, giám sát) | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 166 | Admin | PUT | `/admin/settings/:key` | Sửa một cấu hình | Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 167 | Topics | POST | `/topics` | Tạo bài học | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 168 | Topics | DELETE | `/topics/:id` | Xoá bài học | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |
| 169 | Topics | PUT | `/topics/:id` | Sửa bài học | Specialist \| Admin (theo Swagger) | OUT OF SCOPE | NOT TESTED |

## F. Checklist kiểm thử trên Swagger (theo thứ tự phụ thuộc)

**Cách dùng:** mở <http://localhost:3000/api/v1/docs/> → làm lần lượt F1 → F9. Sau `POST /auth/login`, copy `accessToken` → nút **Authorize** (dán token, không cần gõ “Bearer”). Với Kid: `POST /auth/kid-mode/enter` trả kid token → **Authorize lại** bằng token đó (đăng xuất Authorize cũ). Tick ☐ → ☑ sau khi tự thử. Mã trạng thái “dự kiến” **lấy từ Swagger, chưa được kiểm chứng**. Dùng **tài khoản/dữ liệu thử**, không dùng dữ liệu thật. Tài khoản demo nằm trong `BE/api/prisma/seed_demo.js` (không ghi mật khẩu ở đây).

### F1. Authentication (nền tảng, làm đầu tiên)

#### [3] POST `/auth/login` — Đăng nhập vào hệ thống

- **Làm gì:** Cho phép đăng nhập bằng email hoặc username kèm theo mật khẩu.
- **Quyền / Authorize:** Public (không cần Authorize) · Swagger ghi: `[Public]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Không
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `emailOrUsername` | Không | string | hoangnam | Có thể điền email hoặc username |
  | `email` | Không | string | hoangnam@example.com |  |
  | `username` | Không | string | hoangnam |  |
  | `password` | Có | string | <tự nhập, không ghi vào tài liệu> |  |
- **Status dự kiến (theo Swagger):** `200` Đăng nhập thành công · `401` Sai tài khoản hoặc mật khẩu
- **FE Mobile:** INTEGRATED & USED · `authService.login` — services/authService.ts:53 · Login — `screens/auth/LoginScreen.tsx:74`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [4] POST `/auth/logout` — Đăng xuất khỏi hệ thống

- **Làm gì:** Vô hiệu hóa và thu hồi refresh token hiện tại.
- **Quyền / Authorize:** Public (không cần Authorize) · Swagger ghi: `[Public]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 🔐 Thu hồi refresh token đang dùng
- **Phụ thuộc (chạy trước):** `refreshToken` lấy từ response của `POST /auth/login`
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `refreshToken` | Có | string | <tự nhập, không ghi vào tài liệu> |  |
- **Status dự kiến (theo Swagger):** `200` Đăng xuất thành công
- **FE Mobile:** INTEGRATED & USED · `authService.logout` — services/authService.ts:159 · Bootstrap/Logout (store) — `stores/useAuthSession.ts:94`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [5] GET `/auth/me` — Lấy thông tin tài khoản hiện tại

- **Làm gì:** Lấy thông tin tài khoản đang đăng nhập kèm số dư ví credit/earning.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent | Specialist | Admin]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Status dự kiến (theo Swagger):** `200` Thông tin tài khoản và số dư ví · `401` Chưa đăng nhập hoặc token hết hạn
- **FE Mobile:** INTEGRATED & USED · `authService.getMe` — services/authService.ts:127 · Bootstrap/Logout (store), ParentTabs, Tải dữ liệu Parent (store) — `navigation/ParentTabs.tsx:56, stores/useAuthSession.ts:70, stores/useParentData.ts:45`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [6] POST `/auth/refresh-tokens` — Làm mới token (Token Rotation)

- **Làm gì:** Gửi refresh token cũ để nhận về cặp access token và refresh token mới.
- **Quyền / Authorize:** Public (không cần Authorize) · Swagger ghi: `[Public]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** `refreshToken` lấy từ response của `POST /auth/login`
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `refreshToken` | Có | string | <tự nhập, không ghi vào tài liệu> |  |
- **Status dự kiến (theo Swagger):** `200` Làm mới token thành công · `401` Token không hợp lệ hoặc đã bị xoay vòng
- **FE Mobile:** INTEGRATED & USED · `refreshAccessToken (nội bộ apiClient)` — services/apiClient.ts:74 · Tự động khi 401 (apiClient.apiFetch) — `services/apiClient.ts (apiFetch → refreshAccessToken)`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [7] POST `/auth/register` — Đăng ký tài khoản phụ huynh mới

- **Làm gì:** Tạo tài khoản mới, khởi tạo ví tiền và tự động gửi email xác thực qua Brevo.
- **Quyền / Authorize:** Public (không cần Authorize) · Swagger ghi: `[Public]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Không
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `username` | Có | string | hoangnam |  |
  | `email` | Có | string | hoangnam@example.com |  |
  | `password` | Có | string | <tự nhập, không ghi vào tài liệu> |  |
  | `fullName` | Không | string | Nguyễn Hoàng Nam |  |
  | `phone` | Không | string | 0901234567 |  |
- **Status dự kiến (theo Swagger):** `201` Đăng ký thành công, trả về user và tokens · `400` Dữ liệu không hợp lệ · `409` Email hoặc Username đã tồn tại
- **FE Mobile:** INTEGRATED & USED · `authService.register` — services/authService.ts:93 · Register — `screens/auth/RegisterScreen.tsx:76`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

### F2. Parent: tài khoản, mật khẩu, email, PIN

#### [1] PUT `/auth/change-password` — Đổi mật khẩu (đang đăng nhập)

- **Làm gì:** Đổi mật khẩu (đang đăng nhập)
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403)
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 🔐 Đổi mật khẩu tài khoản đang dùng – ghi nhớ mật khẩu mới
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `currentPassword` | Có | string | <tự nhập, không ghi vào tài liệu> |  |
  | `newPassword` | Có | string | <tự nhập, không ghi vào tài liệu> |  |
- **Status dự kiến (theo Swagger):** `200` Đã đổi · `400` Mật khẩu hiện tại sai / mật khẩu mới trùng mật khẩu cũ
- **FE Mobile:** INTEGRATED & USED · `authService.changePassword` — services/authService.ts:192 · Settings — `screens/parent/SettingsScreen.tsx:75`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [2] POST `/auth/forgot-password` — Quên mật khẩu — gửi mã khôi phục qua email

- **Làm gì:** Mã hiệu lực 1 giờ, dùng một lần; mã cũ chưa dùng hết hiệu lực. Luôn trả 200 kể cả email chưa đăng ký (không để dò email).
- **Quyền / Authorize:** Public (không cần Authorize)
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Không
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `email` | Có | string |  |  |
- **Status dự kiến (theo Swagger):** `200` Đã nhận yêu cầu
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [8] POST `/auth/reset-password` — Đặt lại mật khẩu bằng mã trong email

- **Làm gì:** Thành công → thu hồi mọi phiên đăng nhập (refresh token) cũ.
- **Quyền / Authorize:** Public (không cần Authorize)
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Mã từ email của `POST /auth/forgot-password` (cần BE cấu hình email)
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `token` | Có | string | <tự nhập, không ghi vào tài liệu> |  |
  | `newPassword` | Có | string | <tự nhập, không ghi vào tài liệu> |  |
- **Status dự kiến (theo Swagger):** `200` Đã đặt lại · `400` Mã sai / đã dùng / hết hạn
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [11] PUT `/auth/kid-pin/change` — Thay đổi mã PIN thoát Kid Mode

- **Làm gì:** Thay đổi mã PIN thoát Kid Mode (yêu cầu mã PIN hiện tại hoặc mật khẩu phụ huynh).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 🔐 Đổi PIN Kid Mode của tài khoản thử
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `currentPin` | Không | string | <tự nhập, không ghi vào tài liệu> | Mã PIN hiện tại |
  | `password` | Không | string | <tự nhập, không ghi vào tài liệu> | Hoặc nhập mật khẩu tài khoản nếu quên PIN |
  | `newPin` | Có | string | <tự nhập, không ghi vào tài liệu> | Mã PIN mới gồm 4 đến 6 chữ số |
- **Status dự kiến (theo Swagger):** `200` Đổi mã PIN thành công · `400` Mã PIN cũ hoặc mật khẩu không chính xác
- **FE Mobile:** INTEGRATED & USED · `authService.changeKidPin` — services/authService.ts:218 · Settings — `screens/parent/SettingsScreen.tsx:108`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [12] POST `/auth/kid-pin/set` — Thiết lập mã PIN thoát Kid Mode lần đầu

- **Làm gì:** Thiết lập mã PIN (4-6 chữ số) lần đầu dùng để khóa và thoát khỏi Chế độ Trẻ em.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 🔐 Đổi PIN Kid Mode của tài khoản thử
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `pin` | Có | string | <tự nhập, không ghi vào tài liệu> | Mã PIN gồm 4 đến 6 chữ số |
- **Status dự kiến (theo Swagger):** `200` Cài đặt mã PIN thành công · `400` Mã PIN đã được đặt trước đó (hãy dùng endpoint đổi PIN) · `401` Chưa đăng nhập
- **FE Mobile:** INTEGRATED & USED · `authService.setKidPin` — services/authService.ts:206 · Settings — `screens/parent/SettingsScreen.tsx:109`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [21] POST `/auth/send-verification-email` — Gửi lại mã xác thực email

- **Làm gì:** Gửi mã xác thực mới (hiệu lực 24 giờ) tới email của chính tài khoản đang đăng nhập; mã cũ chưa dùng bị vô hiệu. Không có body. Phải cách mã gần nhất (kể cả mã gửi lúc đăng ký) ít nhất 60 giây, sớm hơn trả 429 kèm `errors[0].retryAfterSeconds`. Thành công: `dat…
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Auth]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Request body:** Swagger không khai báo (có thể không cần body).
- **Status dự kiến (theo Swagger):** `200` Đã gửi mã xác thực. data: { retryAfterSeconds: 60 } · `400` Email đã được xác thực trước đó · `401` Chưa đăng nhập · `429` Gửi lại quá sớm. errors: [{ path: "retryAfterSeconds", message, retryAfterSeconds }]
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [22] POST `/auth/verify-email` — Xác thực Email bằng mã trong email

- **Làm gì:** Email xác thực chỉ chứa mã (token, hiệu lực 24 giờ). Người dùng dán mã vào trang Xác thực email, Web gửi lên qua JSON body. Mã chỉ xác thực đúng tài khoản đang đăng nhập: mã của tài khoản khác trả 400.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Auth]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `token` | Có | string | <tự nhập, không ghi vào tài liệu> |  |
- **Status dự kiến (theo Swagger):** `200` Xác thực email thành công · `400` Mã không hợp lệ, đã dùng, hết hạn hoặc thuộc tài khoản khác · `401` Chưa đăng nhập
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

### F3. Children

#### [23] GET `/children` — Lấy danh sách hồ sơ các bé của phụ huynh

- **Làm gì:** Lấy danh sách toàn bộ hồ sơ các bé thuộc tài khoản phụ huynh hiện tại.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Status dự kiến (theo Swagger):** `200` Danh sách hồ sơ bé · `401` Chưa đăng nhập
- **FE Mobile:** INTEGRATED & USED · `childService.getChildren` — services/childService.ts:20 · Tải dữ liệu Parent (store) — `stores/useParentData.ts:46`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [24] POST `/children` — Tạo hồ sơ bé mới

- **Làm gì:** Tạo hồ sơ cho bé. Kiểm tra giới hạn số lượng bé theo gói cước (mặc định miễn phí 2 bé).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `name` | Có | string | Bé Bo | Tên hoặc biệt danh của bé |
  | `birthDate` | Không | string | 2019-05-10 | Ngày sinh (YYYY-MM-DD) |
  | `dailyScreenTimeMinutes` | Không | integer | 30 | Thời gian màn hình tối đa trong ngày (phút) |
  | `preferredVoice` | Không | string | northern_female | Giọng đọc AI ưa thích |
- **Status dự kiến (theo Swagger):** `201` Tạo hồ sơ bé thành công · `400` Dữ liệu không hợp lệ · `403` Đã đạt giới hạn số lượng bé theo gói dịch vụ
- **FE Mobile:** INTEGRATED & USED · `childService.createChild` — services/childService.ts:30 · Bé (form) — `components/parent/ChildFormSheet.tsx:59`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [25] DELETE `/children/:id` — Xóa hồ sơ bé (Soft delete)

- **Làm gì:** Xóa mềm hồ sơ bé và đồng thời thu hồi mọi token phiên Kid Session đang hoạt động của bé.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 🗑️ PHÁ HỦY (xóa/ẩn dữ liệu) – chỉ chạy trên dữ liệu thử do bạn tạo
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `childId` lấy từ `GET /children` hoặc `POST /children`
- **Tham số:**
  - `id` (path, bắt buộc, string) · ví dụ Swagger: `76693be8-831c-41a7-bdaa-6e07fc5c6457` · ID hồ sơ bé
- **Status dự kiến (theo Swagger):** `200` Xóa hồ sơ bé thành công · `404` Không tìm thấy hồ sơ bé
- **FE Mobile:** INTEGRATED & USED · `childService.deleteChild` — services/childService.ts:54 · Bé nhà mình — `screens/parent/ChildrenScreen.tsx:62`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [26] GET `/children/:id` — Lấy chi tiết hồ sơ một bé

- **Làm gì:** Xem chi tiết hồ sơ bé kèm cấu hình giờ đi ngủ và hạn mức màn hình.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `childId` lấy từ `GET /children` hoặc `POST /children`
- **Tham số:**
  - `id` (path, bắt buộc, string) · ví dụ Swagger: `76693be8-831c-41a7-bdaa-6e07fc5c6457` · ID hồ sơ bé
- **Status dự kiến (theo Swagger):** `200` Chi tiết hồ sơ bé · `404` Không tìm thấy hồ sơ bé
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [27] PUT `/children/:id` — Cập nhật hồ sơ bé

- **Làm gì:** Cập nhật thông tin bé, giờ đi ngủ, giọng đọc ưa thích hoặc giới hạn màn hình.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `childId` lấy từ `GET /children` hoặc `POST /children`
- **Tham số:**
  - `id` (path, bắt buộc, string) · ví dụ Swagger: `76693be8-831c-41a7-bdaa-6e07fc5c6457` · ID hồ sơ bé
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `name` | Không | string | Bé Bo Đẹp Trai |  |
  | `birthDate` | Không | string | 2019-05-10 |  |
  | `dailyScreenTimeMinutes` | Không | integer | 45 |  |
  | `preferredVoice` | Không | string | southern_female |  |
- **Status dự kiến (theo Swagger):** `200` Cập nhật thành công · `404` Không tìm thấy hồ sơ bé
- **FE Mobile:** INTEGRATED & USED · `childService.updateChild` — services/childService.ts:42 · Bé (form) — `components/parent/ChildFormSheet.tsx:59`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [28] PUT `/children/:id/avatar` — Cập nhật chân dung / ngoại hình đại diện của bé

- **Làm gì:** Cập nhật ảnh đại diện và mô tả ngoại hình nhân vật `self` của bé dùng làm ảnh tham chiếu khi vẽ truyện.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `childId` lấy từ `GET /children` hoặc `POST /children`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID hồ sơ bé
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `appearance` | Không | string | Bé trai 6 tuổi, tóc cắt ngắn, mắt to tròn, mặc áo thun xanh |  |
  | `portraitImageKey` | Không | string | characters/portraits/be-bo-avatar.webp |  |
- **Status dự kiến (theo Swagger):** `200` Cập nhật avatar thành công · `404` Không tìm thấy hồ sơ bé
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [29] GET `/children/:id/bookshelf` — Lấy danh sách truyện trên kệ sách của riêng bé

- **Làm gì:** Truy vấn nhanh kệ sách của bé mà không cần truyền query childId qua `/bookshelf`.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `childId` lấy từ `GET /children` hoặc `POST /children`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID hồ sơ bé
  - `page` (query, tùy chọn, integer)  
  - `limit` (query, tùy chọn, integer)  
  - `search` (query, tùy chọn, string)  
- **Status dự kiến (theo Swagger):** `200` Danh sách truyện trên kệ sách · `404` Không tìm thấy hồ sơ bé
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [30] GET `/children/:id/eq-journey` — Báo cáo EQ chi tiết: bằng chứng, gợi ý trò chuyện, xu hướng theo tuần

- **Làm gì:** Gồm mọi trường của `/eq-report`, thêm: - `evidence`: tối đa 5 câu mới nhất mỗi kỹ năng con { subSkillId, answeredAt, storyTitle, question (tên thật), firstChoiceText, correctFirstTry, usedHint, source: "ai_template", momentSummary (tên thật; chỉ truyện "Kể chu…
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `childId` lấy từ `GET /children` hoặc `POST /children`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID hồ sơ bé
  - `weeks` (query, tùy chọn, integer)  
- **Status dự kiến (theo Swagger):** `200` { childId, childName, settings, competencies, recommendations, evidence, conversation, trend } · `404` Không tìm thấy hồ sơ bé
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [31] GET `/children/:id/eq-report` — Báo cáo EQ theo mức độ (radar 5 năng lực + kỹ năng con + topic gợi ý)

- **Làm gì:** Mức kỹ năng con tính trên `window` câu chấm gần nhất; dưới `minItems` câu → null. Chỉ câu chấm ở lượt đọc đầu, điểm dừng không bị Specialist gắn cờ, có kỹ năng con (câu cũ không có `subSkillId` không tính). Không trả điểm / %: chỉ mức độ. Báo cáo phản ánh mức …
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `childId` lấy từ `GET /children` hoặc `POST /children`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID hồ sơ bé
- **Status dự kiến (theo Swagger):** `200` { childId, childName, settings, competencies, recommendations } · `404` Không tìm thấy hồ sơ bé
- **FE Mobile:** INTEGRATED & USED · `childService.getChildEqReport` — services/childService.ts:73 · Hành trình EQ — `screens/parent/EqReportScreen.tsx:43`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [32] GET `/children/:id/overview` — Xem tổng quan bảng điều khiển của bé (Dashboard Overview)

- **Làm gì:** Tổng hợp toàn diện thông tin bé: hồ sơ, tuổi tính theo ngày sinh, nhân vật đại diện (self character), thời lượng màn hình hôm nay, trạng thái giờ đi ngủ, thống kê kệ sách, truyện đang đọc dở và `eqReport` = nội dung của `/children/{id}/eq-report` (mức độ 5 năn…
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `childId` lấy từ `GET /children` hoặc `POST /children`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID hồ sơ bé
- **Status dự kiến (theo Swagger):** `200` Tổng quan hồ sơ và tiến độ học tập của bé · `404` Không tìm thấy hồ sơ bé
- **FE Mobile:** INTEGRATED & USED · `childService.getChildOverview` — services/childService.ts:64 · Trang chủ Parent — `screens/parent/ParentHomeScreen.tsx:68`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [33] GET `/children/:id/usage` — Xem thống kê thời lượng sử dụng màn hình của bé

- **Làm gì:** Truy vấn tổng thời lượng bé đã dùng trong ngày, so sánh với giới hạn quy định, tính toán thời gian còn lại.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Kid Session | Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `childId` lấy từ `GET /children` hoặc `POST /children`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID hồ sơ bé
  - `date` (query, tùy chọn, string) · ví dụ Swagger: `2026-09-24` · Ngày cần tra cứu (YYYY-MM-DD), mặc định là ngày hôm nay
- **Status dự kiến (theo Swagger):** `200` Thống kê thời lượng sử dụng · `404` Không tìm thấy hồ sơ bé
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

### F4. Characters

#### [34] GET `/characters` — Lấy danh sách nhân vật của phụ huynh

- **Làm gì:** Lấy danh sách nhân vật gia đình của phụ huynh (hỗ trợ lọc theo vai trò role hoặc theo bé childId).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Tham số:**
  - `role` (query, tùy chọn, string)  · Lọc theo vai trò nhân vật
  - `childId` (query, tùy chọn, string)  · Lọc theo ID hồ sơ bé liên kết
- **Status dự kiến (theo Swagger):** `200` Lấy danh sách nhân vật thành công
- **FE Mobile:** INTEGRATED & USED · `characterService.getCharacters` — services/characterService.ts:13 · Tải dữ liệu Parent (store) — `stores/useParentData.ts:47`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [35] POST `/characters` — Tạo nhân vật gia đình mới

- **Làm gì:** Tạo nhân vật gia đình mới từ mô tả chữ an toàn, liên kết với bé (tối đa 5 nhân vật với gói miễn phí).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `name` | Có | string | Bé Miu | Tên nhân vật |
  | `role` | Có | string (self\|sibling\|parent\|relative\|pet\|toy) | self | Vai trò trong truyện |
  | `appearance` | Có | string | Bé gái 5 tuổi, tóc ngắn ngang vai màu đen cài nơ đỏ, mắt to tròn hay cười, mặc váy hoa | Mô tả ngoại hình thuần văn bản (không tải ảnh thật của trẻ) |
  | `childId` | Không | string |  | Liên kết tới hồ sơ bé (nếu role là self/sibling) |
  | `portraitImageKey` | Không | string |  | URL hoặc key ảnh chân dung (nếu có sẵn) |
- **Status dự kiến (theo Swagger):** `201` Tạo nhân vật thành công · `400` Dữ liệu không hợp lệ hoặc hồ sơ bé liên kết không đúng · `403` Đã đạt giới hạn tối đa số nhân vật theo gói cước hiện tại
- **FE Mobile:** INTEGRATED & USED · `characterService.createCharacter` — services/characterService.ts:20 · Nhân vật (form) — `components/parent/CharacterFormSheet.tsx:65`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [36] DELETE `/characters/:id` — Xóa mềm nhân vật

- **Làm gì:** Xóa mềm nhân vật khỏi danh sách gia đình.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 🗑️ PHÁ HỦY (xóa/ẩn dữ liệu) – chỉ chạy trên dữ liệu thử do bạn tạo
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `characterId` lấy từ `GET /characters` hoặc `POST /characters`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID nhân vật
- **Status dự kiến (theo Swagger):** `200` Xóa nhân vật thành công · `404` Không tìm thấy nhân vật
- **FE Mobile:** INTEGRATED & USED · `characterService.deleteCharacter` — services/characterService.ts:38 · Nhân vật — `screens/parent/CharactersScreen.tsx:57`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [37] GET `/characters/:id` — Lấy thông tin chi tiết một nhân vật

- **Làm gì:** Xem chi tiết nhân vật gia đình, mô tả ngoại hình và trạng thái ảnh đại diện AI.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `characterId` lấy từ `GET /characters` hoặc `POST /characters`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID nhân vật
- **Status dự kiến (theo Swagger):** `200` Lấy chi tiết nhân vật thành công · `404` Không tìm thấy nhân vật
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [38] PUT `/characters/:id` — Cập nhật thông tin nhân vật

- **Làm gì:** Cập nhật tên gọi, vai trò hoặc đặc điểm nhận dạng của nhân vật.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `characterId` lấy từ `GET /characters` hoặc `POST /characters`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID nhân vật
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `name` | Không | string | Bé Miu Siêu Quậy |  |
  | `role` | Không | string (self\|sibling\|parent\|relative\|pet\|toy) |  |  |
  | `appearance` | Không | string | Tóc ngắn ngang vai cài nơ xanh, áo len sọc vàng |  |
  | `childId` | Không | string |  |  |
  | `portraitImageKey` | Không | string |  |  |
  | `portraitStatus` | Không | string (none\|queued\|generating\|ready\|failed) |  |  |
- **Status dự kiến (theo Swagger):** `200` Cập nhật nhân vật thành công · `404` Không tìm thấy nhân vật
- **FE Mobile:** INTEGRATED & USED · `characterService.updateCharacter` — services/characterService.ts:29 · Nhân vật (form) — `components/parent/CharacterFormSheet.tsx:60`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [39] POST `/characters/:id/portrait` — Vẽ chân dung AI cho nhân vật (1 ảnh, làm ảnh tham chiếu cho tranh)

- **Làm gì:** Giữ `ai_cost.character_portrait` credit, xếp job `character_portrait` (Cloudflare Workers AI), trả **202**; `portraitStatus` đi `queued` → `generating` → `ready` / `failed` (lỗi thì hoàn credit). Chỉ gửi mô tả ngoại hình đã bỏ mọi tên trong gia đình; phong các…
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 💳 GỌI AI / TỐN CREDIT – cần Redis + service AI; không chạy thử khi chưa chuẩn bị
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `characterId` lấy từ `GET /characters` hoặc `POST /characters`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID nhân vật
- **Request body:** Swagger không khai báo (có thể không cần body).
- **Status dự kiến (theo Swagger):** `200` Đã đưa yêu cầu tạo chân dung vào hàng đợi · `404` Không tìm thấy nhân vật
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

### F5. Stories / Story Generation (+ Topics)

#### [42] GET `/stories` — Danh sách truyện của tôi

- **Làm gì:** Danh sách truyện của tôi
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Tham số:**
  - `status` (query, tùy chọn, string)  
  - `page` (query, tùy chọn, integer)  
  - `limit` (query, tùy chọn, integer)  
- **Status dự kiến (theo Swagger):** `200` Danh sách truyện (phân trang); mỗi phần tử là tóm tắt kèm `characters`, `pageCount` và `cover` (`StoryCover`) · `401` Chưa đăng nhập
- **FE Mobile:** INTEGRATED & USED · `storyService.getStories` — services/storyService.ts:41 · Tải dữ liệu Parent (store) — `stores/useParentData.ts:48`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [43] POST `/stories` — Tạo truyện nháp

- **Làm gì:** Tạo truyện `kind = private`, `status = draft` cùng khung trang/cảnh/điểm dừng trống, dựng theo `length` (cấu hình `story_layout.*` trong `platform_settings`). Chưa có chữ và chưa tốn credit; gọi `POST /stories/{id}/generate` để AI viết chữ. Ba lối vào (`entry`…
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · ℹ️ Chỉ tạo bản nháp, chưa tốn credit (theo Swagger); `POST /stories/:id/generate` mới tốn credit
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `characterId` từ `GET /characters`; truyện mẫu cần `topicId` từ `GET /topics`; lối "family" cần `analysisToken` từ `POST /stories/analyze`
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `entry` | Không | string (topic\|family\|handwritten) |  | Thiếu với độ dài AI → `topic`; `custom` → `handwritten` |
  | `topicId` | Không | string |  | ID chuyện mẫu (topic) — bắt buộc với `entry = topic` |
  | `length` | Có | string (short\|medium\|long\|custom) |  |  |
  | `title` | Có | string | Bo và chiếc xe cứu hỏa |  |
  | `situation` | Không | string | Bo đang xếp lego thì em làm đổ tháp, Bo giận và đẩy em. | Chỉ `family` (bắt buộc, ≥ 20 ký tự) và `custom` |
  | `analysisToken` | Không | string | <tự nhập, không ghi vào tài liệu> | `family`: token từ `POST /stories/analyze` (hạn 2 giờ) |
  | `scored` | Không | boolean |  | `family`: false = "Chỉ kể truyện" (không chấm điểm) |
  | `characters` | Có | array |  | Đúng một `isMain = true`, không trùng `characterId`. **Thứ tự gửi lên  |
  | `useAiImage` | Không | boolean |  |  |
  | `useTts` | Không | boolean |  |  |
- **Status dự kiến (theo Swagger):** `201` Tạo truyện thành công, trả chi tiết truyện (chưa có chữ) · `400` Dữ liệu không hợp lệ (thiếu nhân vật chính, trùng nhân vật, chuyện mẫu gửi `situation`…) · `422` Tình huống chứa tên bé chưa có trong truyện, thiếu nhân vật phụ, hoặc `analysisToken` không còn dùng được / kỹ năng chính hết câu hỏi (phân tích lại)
- **FE Mobile:** INTEGRATED & USED · `storyService.createStory` — services/storyService.ts:63 · Tạo truyện (Wizard) — `screens/parent/StoryWizard.tsx:162`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [44] DELETE `/stories/:id` — Xoá mềm truyện

- **Làm gì:** Đặt `deleted_at`. **Được phép xoá cả khi đang `generating`**: worker sẽ không ghi nội dung vào truyện đã xoá, credit vẫn bị trừ (AI đã chạy), không có lỗi.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 🗑️ PHÁ HỦY (xóa/ẩn dữ liệu) – chỉ chạy trên dữ liệu thử do bạn tạo
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
- **Status dự kiến (theo Swagger):** `200` Đã xoá truyện · `401` Chưa đăng nhập · `403` Không phải chủ truyện · `404` Không tìm thấy truyện
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [45] GET `/stories/:id` — Chi tiết truyện

- **Làm gì:** Trả trang, cảnh, điểm dừng, phương án và nhân vật. Chữ truyện **giữ dạng token** `{NV1}`, `{NV2}`…; frontend thay token bằng tên khi hiển thị, dùng bảng `characters` (`token → name`).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent | Specialist | Admin]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
- **Status dự kiến (theo Swagger):** `200` Chi tiết truyện · `401` Chưa đăng nhập · `403` Không có quyền xem truyện này · `404` Không tìm thấy truyện
- **FE Mobile:** INTEGRATED & USED · `storyService.getStory` — services/storyService.ts:56 · Chi tiết truyện — `screens/parent/StoryDetailScreen.tsx:58`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [46] PUT `/stories/:id` — Sửa thông tin truyện

- **Làm gì:** Sửa `title`, `situation`, `useAiImage`, `useTts`. Cần gửi ít nhất một trường. Truyện đang `generating` trả `409` (mọi thao tác sửa đều bị khoá). Truyện `entry = family`: gửi `situation` → `409` ("Muốn đổi lời kể hay nhân vật, hãy tạo truyện mới").
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `title` | Không | string |  |  |
  | `situation` | Không | string |  |  |
  | `useAiImage` | Không | boolean |  |  |
  | `useTts` | Không | boolean |  |  |
- **Status dự kiến (theo Swagger):** `200` Cập nhật thành công · `401` Chưa đăng nhập · `403` Không phải chủ truyện · `404` Không tìm thấy truyện / trang / điểm dừng · `409` Truyện đang được AI viết (`generating`) · `422` Tình huống chứa tên bé chưa có trong truyện
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [47] PUT `/stories/:id/characters` — Đổi nhân vật của truyện

- **Làm gì:** Chỉ đổi được khi **chưa trang nào có chữ** (đổi sau khi có chữ làm token trỏ sai người). Token của điểm dừng được đưa về nhân vật phụ đầu tiên mới. Truyện `entry = family` luôn trả `409`. Truyện đang `generating` trả `409` (mọi thao tác sửa đều bị khoá).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `characters` | Có | array |  | Đúng một `isMain = true`, không trùng `characterId`. **Thứ tự gửi lên  |
- **Status dự kiến (theo Swagger):** `200` Đổi nhân vật thành công · `401` Chưa đăng nhập · `403` Không phải chủ truyện · `404` Không tìm thấy truyện / trang / điểm dừng · `409` Truyện đang `generating`, hoặc đã có trang có chữ · `422` Thiếu nhân vật phụ cho câu hỏi về nhân vật khác, hoặc tình huống còn nhắc nhân vật bị bỏ
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [48] POST `/stories/:id/checkpoints` — Thêm điểm dừng (chỉ truyện custom)

- **Làm gì:** Chỉ truyện `length = custom`; truyện khác trả `422`. Luật `custom`: 0–6 điểm dừng có chấm, tối đa 1 điểm dừng mỗi trang, không đặt sau trang 1, `reflection` chỉ ở trang cuối. `targetToken` chỉ dùng cho `emotion_other` và `perspective`. Truyện đang `generating`…
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `type` | Có | string (emotion_self\|emotion_other\|perspective\|problem_solving\|reflection) |  |  |
  | `afterPageId` | Có | string |  |  |
  | `targetToken` | Không | string | <tự nhập, không ghi vào tài liệu> |  |
- **Status dự kiến (theo Swagger):** `201` Đã thêm điểm dừng · `401` Chưa đăng nhập · `403` Không phải chủ truyện · `404` Không tìm thấy truyện / trang / điểm dừng · `409` Truyện đang được AI viết (`generating`) · `422` Không phải truyện `custom`, hoặc vi phạm luật đặt điểm dừng
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [49] DELETE `/stories/:id/checkpoints/:cpId` — Xoá điểm dừng (chỉ truyện custom)

- **Làm gì:** Chỉ truyện `length = custom`; truyện khác trả `422`. Truyện đang `generating` trả `409` (mọi thao tác sửa đều bị khoá).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 🗑️ PHÁ HỦY (xóa/ẩn dữ liệu) – chỉ chạy trên dữ liệu thử do bạn tạo
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`; `cpId` (điểm dừng) lấy từ `GET /stories/:id`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
  - `cpId` (path, bắt buộc, string)  · ID điểm dừng
- **Status dự kiến (theo Swagger):** `200` Đã xoá điểm dừng · `401` Chưa đăng nhập · `403` Không phải chủ truyện · `404` Không tìm thấy truyện / trang / điểm dừng · `409` Truyện đang được AI viết (`generating`) · `422` Không phải truyện `custom`
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [50] PUT `/stories/:id/checkpoints/:cpId` — Sửa điểm dừng

- **Làm gì:** Sửa `question`, `hint`, `answerEmotion`, `options`. Kiểm đủ trường theo kiểu điểm dừng. `origin = ai` chuyển thành `ai_edited`. Truyện đang `generating` trả `409` (mọi thao tác sửa đều bị khoá).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`; `cpId` (điểm dừng) lấy từ `GET /stories/:id`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
  - `cpId` (path, bắt buộc, string)  · ID điểm dừng
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `question` | Không | string |  |  |
  | `hint` | Không | string |  |  |
  | `answerEmotion` | Không | string (happy\|sad\|angry\|scared\|neutral) |  |  |
  | `options` | Không | array |  |  |
- **Status dự kiến (theo Swagger):** `200` Đã lưu điểm dừng · `400` Nội dung điểm dừng không hợp lệ theo kiểu · `401` Chưa đăng nhập · `403` Không phải chủ truyện · `404` Không tìm thấy truyện / trang / điểm dừng · `409` Truyện đang được AI viết (`generating`)
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [51] PUT `/stories/:id/cover` — Chọn ảnh bìa (ảnh một cảnh)

- **Làm gì:** Ảnh bìa = ảnh một cảnh của truyện (1024x1024, không chữ). `sceneId` phải thuộc truyện và ảnh đã vẽ xong (`imageStatus = ready`), không thì `422` "Cảnh này chưa có ảnh". `sceneId = null` → về mặc định (cảnh 1). Trả chi tiết truyện (như `GET /stories/{id}`) với …
- **Quyền / Authorize:** Parent (`auth` + `authorize(parent)`) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `sceneId` | Có | string |  | ID cảnh làm bìa; null = cảnh 1 |
- **Status dự kiến (theo Swagger):** `200` Đã đổi ảnh bìa · `400` `sceneId` thiếu hoặc không phải uuid · `401` Chưa đăng nhập · `403` Không phải phụ huynh / không phải chủ truyện · `404` Không tìm thấy truyện · `422` Cảnh này chưa có ảnh (chưa vẽ xong, hoặc không thuộc truyện)
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [52] POST `/stories/:id/generate` — Nhờ AI viết chữ cho truyện

- **Làm gì:** Giữ credit theo độ dài (`ai_cost.story_text.<length>`), đặt truyện `generating`, đẩy job vào queue và trả ngay `202`. Frontend gọi `GET /stories/{id}/generation` mỗi 2–3 giây tới khi `succeeded` / `failed` / `blocked`. Thành công: credit được tính, truyện `rea…
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 💳 GỌI AI / TỐN CREDIT – cần Redis + service AI; không chạy thử khi chưa chuẩn bị
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`; Truyện cần có nhân vật; AI + Redis phải chạy; đủ credit
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
- **Request body:** Swagger không khai báo (có thể không cần body).
- **Status dự kiến (theo Swagger):** `202` AI đang viết truyện · `401` Chưa đăng nhập · `402` Không đủ credit · `403` Không phải chủ truyện · `404` Không tìm thấy truyện · `409` Truyện đang được AI viết, hoặc đã được bé đọc nên không thể viết lại · `422` Truyện tự viết (`custom`) không dùng được AI viết chữ · `503` Hệ thống AI tạm gián đoạn (không đẩy được job vào queue trong 5 giây); credit đã được hoàn lại
- **FE Mobile:** INTEGRATED & USED · `storyService.startGeneration` — services/storyService.ts:95 · Tạo truyện (tiến độ) — `components/parent/GenerationRunner.tsx:88`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [53] GET `/stories/:id/generation` — Trạng thái lần sinh chữ mới nhất

- **Làm gì:** Trả `{ generation }`: yêu cầu AI sinh chữ mới nhất của truyện, hoặc `null` nếu chưa sinh lần nào. `errorCode` và `errorMessage` được tách từ chuỗi lưu dạng `<CODE>: <message>` (`null` khi không lỗi). Job `queued`/`processing` quá 10 phút được coi là kẹt và đượ…
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
- **Status dự kiến (theo Swagger):** `200` Trạng thái sinh chữ · `401` Chưa đăng nhập · `403` Không phải chủ truyện · `404` Không tìm thấy truyện
- **FE Mobile:** INTEGRATED & USED · `storyService.getGeneration` — services/storyService.ts:102 · Tạo truyện (tiến độ) — `components/parent/GenerationRunner.tsx:48`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [54] POST `/stories/:id/images` — Bật tranh AI và vẽ mọi cảnh còn thiếu

- **Làm gì:** Đặt `useAiImage = true`, vẽ chân dung cho nhân vật chưa có (`ai_cost.character_portrait`), rồi mỗi cảnh có mô tả một job `scene_image` (`ai_cost.scene_image`). Cảnh có nhân vật đang vẽ chân dung thì chờ (`imageStatus = queued`) và tự chạy khi chân dung xong. T…
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 💳 GỌI AI / TỐN CREDIT – cần Redis + service AI; không chạy thử khi chưa chuẩn bị
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`; Truyện cần có nhân vật; AI + Redis phải chạy; đủ credit
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
- **Request body:** Swagger không khai báo (có thể không cần body).
- **Status dự kiến (theo Swagger):** `202` Đã xếp hàng · `402` Không đủ credit · `404` Không tìm thấy truyện · `409` AI đang viết truyện
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [55] POST `/stories/:id/narration/retry` — (Swagger thiếu – NOT VERIFIED)

- **Làm gì:** (Swagger thiếu – NOT VERIFIED)
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403)
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 💳 GỌI AI / TỐN CREDIT – cần Redis + service AI; không chạy thử khi chưa chuẩn bị
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`
- **Tham số path:** `id` (Swagger không liệt kê chi tiết – NOT VERIFIED; xem “Phụ thuộc” để biết lấy ở đâu)
- **Request body / response:** NOT VERIFIED (Swagger thiếu mô tả API này). Xem validation trong `BE/api/src/modules/stories/stories.validation.js`.
- **Status dự kiến:** NOT VERIFIED
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [56] POST `/stories/:id/pages` — Thêm trang (chỉ truyện custom)

- **Làm gì:** Chỉ truyện `length = custom`; truyện khác trả `422`. Luật `custom` (`custom_limits.*`): 4–20 trang. Truyện đang `generating` trả `409` (mọi thao tác sửa đều bị khoá).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `contentText` | Không | string |  |  |
- **Status dự kiến (theo Swagger):** `201` Đã thêm trang; trả chi tiết truyện với trang đã đánh số lại · `401` Chưa đăng nhập · `403` Không phải chủ truyện · `404` Không tìm thấy truyện / trang / điểm dừng · `409` Truyện đang được AI viết (`generating`) · `422` Không phải truyện `custom`, hoặc vượt số trang tối đa
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [57] DELETE `/stories/:id/pages/:pageId` — Xoá trang (chỉ truyện custom)

- **Làm gì:** Chỉ truyện `length = custom`; truyện khác trả `422`. Không xoá được trang đang có điểm dừng đặt sau nó (`409`); tối thiểu 4 trang. Truyện đang `generating` trả `409` (mọi thao tác sửa đều bị khoá).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 🗑️ PHÁ HỦY (xóa/ẩn dữ liệu) – chỉ chạy trên dữ liệu thử do bạn tạo
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`; `pageId` lấy từ `GET /stories/:id`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
  - `pageId` (path, bắt buộc, string)  · ID trang
- **Status dự kiến (theo Swagger):** `200` Đã xoá trang · `401` Chưa đăng nhập · `403` Không phải chủ truyện · `404` Không tìm thấy truyện / trang / điểm dừng · `409` Truyện đang được AI viết (`generating`) · `422` Không phải truyện `custom`, hoặc dưới số trang tối thiểu
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [58] PUT `/stories/:id/pages/:pageId` — Sửa chữ của trang

- **Làm gì:** Chữ đi qua `tokenizeNames` (tên thật thành token) trước khi lưu. `origin = ai` chuyển thành `ai_edited`; xoá `audioKey`. `contentText` rỗng hoặc `null` là xoá chữ trang. Sau khi sửa: mọi trang có chữ thì truyện thành `ready`, còn trang trống thì `draft`; **khô…
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`; `pageId` lấy từ `GET /stories/:id`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
  - `pageId` (path, bắt buộc, string)  · ID trang
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `contentText` | Có | string | Bo đưa xe cứu hỏa cho bạn chơi cùng. |  |
- **Status dự kiến (theo Swagger):** `200` Đã lưu trang · `401` Chưa đăng nhập · `403` Không phải chủ truyện · `404` Không tìm thấy truyện / trang / điểm dừng · `409` Truyện đang được AI viết (`generating`) · `422` Chữ chứa tên bé chưa có trong truyện
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [59] POST `/stories/:id/publish-version` — Đăng bán (chưa hỗ trợ)

- **Làm gì:** Luôn trả `501` cho tới khi có spec chợ truyện.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · ℹ️ Swagger ghi “chưa hỗ trợ” (trả 501)
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
- **Request body:** Swagger không khai báo (có thể không cần body).
- **Status dự kiến (theo Swagger):** `501` Chức năng đăng bán sẽ có ở bản sau
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [60] POST `/stories/:id/review` — Đánh dấu đã xem xong

- **Làm gì:** Đặt `reviewedAt`. Chỉ nhận khi mọi trang có chữ và mọi điểm dừng đủ trường theo kiểu. Truyện đang `generating` trả `409` (mọi thao tác sửa đều bị khoá).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
- **Request body:** Swagger không khai báo (có thể không cần body).
- **Status dự kiến (theo Swagger):** `200` Đã đánh dấu truyện là đã xem xong · `401` Chưa đăng nhập · `403` Không phải chủ truyện · `404` Không tìm thấy truyện / trang / điểm dừng · `409` Truyện đang được AI viết (`generating`) · `422` Truyện còn chỗ chưa viết xong
- **FE Mobile:** INTEGRATED & USED · `storyService.reviewStory` — services/storyService.ts:109 · Chi tiết truyện — `screens/parent/StoryDetailScreen.tsx:94`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [61] POST `/stories/:id/scenes/:sceneId/image` — Vẽ lại tranh một cảnh

- **Làm gì:** Giữ `ai_cost.scene_image` credit và vẽ lại cảnh (kể cả đã có tranh). 409 đang vẽ; 422 cảnh chưa có mô tả (truyện tự viết).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 💳 GỌI AI / TỐN CREDIT – cần Redis + service AI; không chạy thử khi chưa chuẩn bị
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` lấy từ `GET /stories` hoặc `POST /stories`; `sceneId` lấy từ `GET /stories/:id` (scenes); Truyện cần có nhân vật; AI + Redis phải chạy; đủ credit
- **Tham số:**
  - `id` (path, bắt buộc, string)  · ID truyện
  - `sceneId` (path, bắt buộc, string)  
- **Request body:** Swagger không khai báo (có thể không cần body).
- **Status dự kiến (theo Swagger):** `202` Đã xếp hàng · `402` Không đủ credit · `409` Cảnh đang được vẽ · `422` Cảnh chưa có mô tả
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [62] GET `/stories/ai-pricing` — Bảng giá AI viết truyện theo độ dài

- **Làm gì:** Mỗi độ dài truyện AI (`short` / `medium` / `long`): số trang, số điểm dừng (`story_layout.<length>`) và số credit bị trừ khi bắt đầu viết (`ai_cost.story_text.<length>`, Admin chỉnh ở Cấu hình AI). Trang tạo truyện dùng để báo giá trước cho ba mẹ.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Status dự kiến (theo Swagger):** `200` Bảng giá · `401` Chưa đăng nhập
- **FE Mobile:** INTEGRATED & USED · `storyService.getAiPricing` — services/storyService.ts:88 · Tạo truyện (Wizard) — `screens/parent/StoryWizard.tsx:99`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [63] POST `/stories/analyze` — Phân tích lời kể "Kể chuyện nhà mình"

- **Làm gì:** Phân tích lời kể "Kể chuyện nhà mình"
- **Quyền / Authorize:** Parent (`auth` + `authorize(parent)`) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 🤖 Gọi AI đồng bộ (BE ghi chú không trừ credit – NOT VERIFIED)
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `characters` lấy từ `GET /characters` (nhân vật chính đứng đầu)
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `situation` | Có | string | Bin đang xếp lego thì em Na làm đổ, Bin hét lên và đẩy em ngã. |  |
  | `characters` | Có | array |  | Đúng một `isMain = true`, không trùng `characterId`. **Thứ tự gửi lên  |
  | `length` | Có | string (short\|medium\|long) |  |  |
  | `subSkillIds` | Không | array |  | Kỹ năng phụ huynh chọn (đầu = kỹ năng chính) |
- **Status dự kiến (theo Swagger):** `200` Kết quả phân tích · `400` Dữ liệu không hợp lệ · `403` Không phải phụ huynh, hoặc quyền dùng AI đang tạm khoá · `422` Lời kể có từ khoá chặn / tên con chưa là nhân vật, hoặc kỹ năng đã chọn chưa dùng được · `429` Quá số lượt phân tích trong ngày · `502` AI lỗi: "Chưa phân tích được, thử lại"
- **FE Mobile:** INTEGRATED & USED · `storyService.analyze` — services/storyService.ts:73 · Tạo truyện (Wizard) — `screens/parent/StoryWizard.tsx:184`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [72] GET `/topics` — Danh sách bài học

- **Làm gì:** **Phụ huynh:** chỉ bài học đang dùng, không kèm `guidance`. **Specialist / Admin:** mọi bài học + `guidance`, `storiesCount`, `creator`; lọc `skillId`, `search`, `isActive`.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403)
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Tham số:**
  - `skillId` (query, tùy chọn, string)  
  - `search` (query, tùy chọn, string)  
  - `isActive` (query, tùy chọn, boolean)  
- **Status dự kiến (theo Swagger):** `200` Mảng bài học trong `data`. Phụ huynh: `subSkills: [{ id, nameVi }]`; Specialist / Admin: `subSkills: [{ id, nameVi, caselTextEn }]`
- **FE Mobile:** INTEGRATED & USED · `storyService.getTemplates` — services/storyService.ts:134 · Tải dữ liệu Parent (store) — `stores/useParentData.ts:49`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

### F6. Bookshelf

#### [64] GET `/bookshelf` — Lấy danh sách truyện trên kệ sách của bé

- **Làm gì:** Lấy toàn bộ truyện trên kệ sách của bé kèm tiến độ đọc mới nhất (phần trăm hoàn thành, trang đang đọc dở).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent | Kid Session]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Tham số:**
  - `childId` (query, bắt buộc, string)  · ID hồ sơ bé
  - `search` (query, tùy chọn, string)  · Tìm kiếm theo tên truyện
  - `page` (query, tùy chọn, integer)  
  - `limit` (query, tùy chọn, integer)  
- **Status dự kiến (theo Swagger):** `200` Lấy danh sách kệ sách thành công · `400` Dữ liệu không hợp lệ · `401` Chưa đăng nhập · `404` Không tìm thấy hồ sơ bé
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [65] POST `/bookshelf` — Thêm truyện vào kệ sách của bé

- **Làm gì:** Thêm một câu chuyện vào kệ sách cá nhân của bé.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `childId` từ `GET /children`; `storyId` của truyện đã sẵn sàng (xem `GET /stories`)
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `childId` | Có | string |  |  |
  | `storyId` | Có | string |  |  |
- **Status dự kiến (theo Swagger):** `201` Thêm truyện vào kệ sách thành công · `404` Không tìm thấy hồ sơ bé hoặc truyện
- **FE Mobile:** INTEGRATED & USED · `storyService.addToShelf` — services/storyService.ts:116 · Chi tiết truyện, ParentTabs — `navigation/ParentTabs.tsx:72, screens/parent/StoryDetailScreen.tsx:112`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [66] DELETE `/bookshelf/:storyId` — Xóa truyện khỏi kệ sách của bé

- **Làm gì:** Xóa một câu chuyện khỏi kệ sách của bé (không làm mất lịch sử đọc truyện đã ghi nhận).
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU · 🗑️ PHÁ HỦY (xóa/ẩn dữ liệu) – chỉ chạy trên dữ liệu thử do bạn tạo
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` đã có trên kệ sách
- **Tham số:**
  - `storyId` (path, bắt buộc, string)  · ID câu chuyện
  - `childId` (query, bắt buộc, string)  · ID hồ sơ bé
- **Status dự kiến (theo Swagger):** `200` Xóa truyện khỏi kệ sách thành công · `404` Truyện không có trên kệ sách
- **FE Mobile:** SERVICE ONLY · `storyService.removeFromShelf` — services/storyService.ts:125 · — (không có màn gọi)
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [67] GET `/bookshelf/check/:storyId` — Kiểm tra truyện đã có trên kệ sách của bé chưa

- **Làm gì:** Kiểm tra xem truyện đã được thêm vào kệ sách của bé hay chưa.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent | Kid Session]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; `storyId` đã có trên kệ sách
- **Tham số:**
  - `storyId` (path, bắt buộc, string)  · ID câu chuyện
  - `childId` (query, bắt buộc, string)  · ID hồ sơ bé
- **Status dự kiến (theo Swagger):** `200` Kiểm tra trạng thái kệ sách thành công
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

### F7. Kid Mode / Reading Sessions

#### [9] POST `/auth/kid-mode/enter` — Chuyển sang Chế độ Trẻ em (Kid Mode)

- **Làm gì:** Bắt buộc phụ huynh phải có mã PIN. Cấp token phiên `kid_session` có phạm vi đọc truyện của riêng bé.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `childId` | Có | string | 76693be8-831c-41a7-bdaa-6e07fc5c6457 |  |
- **Status dự kiến (theo Swagger):** `200` Vào Kid Mode thành công, trả về token phiên · `403` Chưa cài đặt mã PIN bảo vệ · `404` Không tìm thấy hồ sơ bé
- **FE Mobile:** INTEGRATED & USED · `authService.enterKidMode` — services/authService.ts:229 · Vào/thoát Kid Mode (store) — `stores/useKidSession.ts:31`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [10] POST `/auth/kid-mode/exit` — Thoát Chế độ Trẻ em về Chế độ Phụ huynh

- **Làm gì:** Nhập đúng mã PIN để đóng phiên đọc của bé và khôi phục quyền phụ huynh.
- **Quyền / Authorize:** Kid session token (header Bearer hoặc body `kidSessionToken`) + PIN của Parent; route không có middleware `auth` · Swagger ghi: `[Kid Session | Parent]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Cần kid token từ `POST /auth/kid-mode/enter` và PIN đã đặt (`POST /auth/kid-pin/set`)
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `pin` | Có | string | <tự nhập, không ghi vào tài liệu> | Mã PIN bảo vệ của phụ huynh |
  | `kidSessionToken` | Không | string | <tự nhập, không ghi vào tài liệu> | Token phiên của bé (nếu không truyền qua Header) |
- **Status dự kiến (theo Swagger):** `200` Thoát thành công, trả về bộ access token phụ huynh mới · `401` Sai mã PIN hoặc phiên của bé không hợp lệ
- **FE Mobile:** INTEGRATED & USED · `authService.exitKidMode` — services/authService.ts:263 · Vào/thoát Kid Mode (store) — `stores/useKidSession.ts:45`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [13] GET `/kid/bookshelf` — Giá sách của bé (chỉ truyện đã sẵn sàng: hoàn tất + đủ giọng đọc)

- **Làm gì:** Giá sách của bé (chỉ truyện đã sẵn sàng: hoàn tất + đủ giọng đọc)
- **Quyền / Authorize:** Kid (kid session token từ `/auth/kid-mode/enter`; middleware `kidAuth`) · Swagger ghi: `[Kid Session]`
- **Phụ thuộc (chạy trước):** Cần kid token: `POST /auth/kid-mode/enter` (cần đã đặt PIN, có `childId`) rồi Authorize bằng token đó
- **Status dự kiến (theo Swagger):** `200` { items: [{ storyId, title, cover: StoryCover, coverImageUrl (= cover.imageUrl), totalPages, readingProgress }] }
- **FE Mobile:** INTEGRATED & USED · `kidService.getShelf` — services/kidService.ts:14 · Kid Mode (tủ sách/đọc/điểm dừng) — `screens/kid/useKidReader.ts:46`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [14] GET `/kid/me` — Hồ sơ bé đang dùng máy

- **Làm gì:** Hồ sơ bé đang dùng máy
- **Quyền / Authorize:** Kid (kid session token từ `/auth/kid-mode/enter`; middleware `kidAuth`) · Swagger ghi: `[Kid Session]`
- **Phụ thuộc (chạy trước):** Cần kid token: `POST /auth/kid-mode/enter` (cần đã đặt PIN, có `childId`) rồi Authorize bằng token đó
- **Status dự kiến (theo Swagger):** `200` { child } · `403` Không phải token Kid Mode
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [15] POST `/kid/sessions` — Bắt đầu / tiếp tục lượt đọc

- **Làm gì:** Truyện phải nằm trên giá của bé và **sẵn sàng cho trẻ** (422 kèm tiến độ giọng đọc nếu chưa). Có lượt `in_progress` thì tiếp tục; không thì tạo lượt mới, `isFirstPlay` = bé chưa từng đọc truyện này (chỉ lượt đầu được chấm EQ). Nội dung trả về **không có đáp án…
- **Quyền / Authorize:** Kid (kid session token từ `/auth/kid-mode/enter`; middleware `kidAuth`) · Swagger ghi: `[Kid Session]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Cần kid token: `POST /auth/kid-mode/enter` (cần đã đặt PIN, có `childId`) rồi Authorize bằng token đó; `storyId` phải có trong `GET /kid/bookshelf`
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `storyId` | Có | string |  |  |
- **Status dự kiến (theo Swagger):** `201` { session, story: { pages[{ id, pageOrder, text, audioUrl, imageUrl }], checkpoints[{ id, afterPageId, type, question, questionAudioUrl, options[{ id, text, textAudioUrl }], result }] } } · `404` Truyện không có trên giá của bé · `422` Truyện chưa sẵn sàng
- **FE Mobile:** INTEGRATED & USED · `kidService.startReading` — services/kidService.ts:24 · Kid Mode (tủ sách/đọc/điểm dừng) — `screens/kid/useKidReader.ts:89`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [16] GET `/kid/sessions/:sessionId` — Nội dung + câu đã trả lời của lượt đọc

- **Làm gì:** Nội dung + câu đã trả lời của lượt đọc
- **Quyền / Authorize:** Kid (kid session token từ `/auth/kid-mode/enter`; middleware `kidAuth`) · Swagger ghi: `[Kid Session]`
- **Phụ thuộc (chạy trước):** Cần kid token: `POST /auth/kid-mode/enter` (cần đã đặt PIN, có `childId`) rồi Authorize bằng token đó; `sessionId` lấy từ `POST /kid/sessions`
- **Tham số:**
  - `sessionId` (path, bắt buộc, string)  
- **Status dự kiến (theo Swagger):** `200` { session, story }
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [17] POST `/kid/sessions/:sessionId/answers` — Bé trả lời điểm dừng — BE chấm

- **Làm gì:** Cảm xúc: `emotion`; vị trí người khác / giải quyết tình huống: `optionId`; liên hệ bản thân: chỉ `checkpointId`. Sai lần đầu (cảm xúc / vị trí) → `done: false` + `hint`; gửi lần nữa → `done: true`, sai thì kèm `answer`. Giải quyết tình huống trả `feedback`. Ch…
- **Quyền / Authorize:** Kid (kid session token từ `/auth/kid-mode/enter`; middleware `kidAuth`) · Swagger ghi: `[Kid Session]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Cần kid token: `POST /auth/kid-mode/enter` (cần đã đặt PIN, có `childId`) rồi Authorize bằng token đó; `sessionId` lấy từ `POST /kid/sessions`
- **Tham số:**
  - `sessionId` (path, bắt buộc, string)  
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `checkpointId` | Có | string |  |  |
  | `emotion` | Không | string (happy\|sad\|angry\|scared\|neutral) |  |  |
  | `optionId` | Không | string |  |  |
  | `skipped` | Không | boolean |  |  |
  | `timeToFirstMs` | Không | integer |  |  |
  | `questionReplays` | Không | integer |  |  |
- **Status dự kiến (theo Swagger):** `200` { result: { checkpointId, done, correct, attempts, hint?, hintAudioUrl?, answer?, feedback?, feedbackAudioUrl? } } · `400` Lựa chọn sai kiểu điểm dừng · `409` Lượt đọc đã kết thúc
- **FE Mobile:** INTEGRATED & USED · `kidService.answer` — services/kidService.ts:47 · Kid Mode (tủ sách/đọc/điểm dừng) — `screens/kid/useKidReader.ts:167`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [18] POST `/kid/sessions/:sessionId/complete` — Đọc xong (idempotent)

- **Làm gì:** Đọc xong (idempotent)
- **Quyền / Authorize:** Kid (kid session token từ `/auth/kid-mode/enter`; middleware `kidAuth`) · Swagger ghi: `[Kid Session]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Cần kid token: `POST /auth/kid-mode/enter` (cần đã đặt PIN, có `childId`) rồi Authorize bằng token đó; `sessionId` lấy từ `POST /kid/sessions`
- **Tham số:**
  - `sessionId` (path, bắt buộc, string)  
- **Request body:** Swagger không khai báo (có thể không cần body).
- **Status dự kiến (theo Swagger):** `200` { session }
- **FE Mobile:** INTEGRATED & USED · `kidService.complete` — services/kidService.ts:67 · Kid Mode (tủ sách/đọc/điểm dừng) — `screens/kid/useKidReader.ts:123`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [19] PUT `/kid/sessions/:sessionId/progress` — Lưu trang đang đọc

- **Làm gì:** Lưu trang đang đọc
- **Quyền / Authorize:** Kid (kid session token từ `/auth/kid-mode/enter`; middleware `kidAuth`) · Swagger ghi: `[Kid Session]`
- **Cảnh báo:** ⚠️ THAY ĐỔI DỮ LIỆU
- **Phụ thuộc (chạy trước):** Cần kid token: `POST /auth/kid-mode/enter` (cần đã đặt PIN, có `childId`) rồi Authorize bằng token đó; `sessionId` lấy từ `POST /kid/sessions`
- **Tham số:**
  - `sessionId` (path, bắt buộc, string)  
- **Request body (JSON):**
  | Field | Bắt buộc | Kiểu | Ví dụ (Swagger) | Ghi chú |
  |---|---|---|---|---|
  | `pageId` | Có | string |  |  |
- **Status dự kiến (theo Swagger):** `200` { session }
- **FE Mobile:** INTEGRATED & USED · `kidService.saveProgress` — services/kidService.ts:36 · Kid Mode (tủ sách/đọc/điểm dừng) — `screens/kid/useKidReader.ts:78`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [20] GET `/kid/ui-audio` — Câu đọc dùng chung (tên cảm xúc, câu nhắc)

- **Làm gì:** Câu đọc dùng chung (tên cảm xúc, câu nhắc)
- **Quyền / Authorize:** Kid (kid session token từ `/auth/kid-mode/enter`; middleware `kidAuth`) · Swagger ghi: `[Kid Session]`
- **Phụ thuộc (chạy trước):** Cần kid token: `POST /auth/kid-mode/enter` (cần đã đặt PIN, có `childId`) rồi Authorize bằng token đó
- **Status dự kiến (theo Swagger):** `200` { assets: { <key>: { text, audioUrl } } }
- **FE Mobile:** SERVICE ONLY · `kidService.getUiAudio` — services/kidService.ts:72 · — (không có màn gọi)
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

### F8. EQ

#### [40] GET `/eq-skills` — Lấy danh mục 5 nhóm năng lực trí tuệ cảm xúc chuẩn quốc tế CASEL

- **Làm gì:** Lấy danh mục 5 nhóm năng lực trí tuệ cảm xúc chuẩn quốc tế CASEL kèm số lượng kịch bản truyện mẫu liên quan.
- **Quyền / Authorize:** Public (không cần Authorize) · Swagger ghi: `[Public]`
- **Phụ thuộc (chạy trước):** Không
- **Tham số:**
  - `search` (query, tùy chọn, string)  · Tìm kiếm theo tên hoặc mô tả kỹ năng
- **Status dự kiến (theo Swagger):** `200` Danh sách kỹ năng EQ thành công
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [41] GET `/eq-skills/:id` — Xem chi tiết một kỹ năng EQ

- **Làm gì:** Xem chi tiết một nhóm kỹ năng EQ chuẩn CASEL (chấp nhận UUID hoặc mã CASEL như self_awareness, social_awareness...).
- **Quyền / Authorize:** Public (không cần Authorize) · Swagger ghi: `[Public]`
- **Phụ thuộc (chạy trước):** Không
- **Tham số:**
  - `id` (path, bắt buộc, string) · ví dụ Swagger: `relationship_skills` · UUID hoặc caselCode của kỹ năng
- **Status dự kiến (theo Swagger):** `200` Lấy chi tiết kỹ năng EQ thành công · `404` Không tìm thấy kỹ năng EQ
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

### F9. Plans / Subscriptions / Credit

#### [68] GET `/subscriptions/me` — Xem thông tin gói đăng ký và định mức sử dụng hiện tại

- **Làm gì:** Xem chi tiết gói thành viên đang sử dụng, thời gian hết hạn, số lượng hồ sơ bé/nhân vật đã tạo và số lượt AI story / AI image còn lại trong chu kỳ.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Parent]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; Tài khoản đã có gói (đăng ký mới được cấp gói Miễn phí)
- **Status dự kiến (theo Swagger):** `200` Lấy thông tin gói thành viên hiện tại thành công
- **FE Mobile:** INTEGRATED & USED · `billingService.getSubscription` — services/billingService.ts:15 · Credit (Wallet) — `screens/parent/WalletScreen.tsx:64`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [69] GET `/plans` — Gói đang bán (công khai)

- **Làm gì:** Gói đang bán (công khai)
- **Quyền / Authorize:** Public (không cần Authorize)
- **Phụ thuộc (chạy trước):** Không
- **Status dự kiến (theo Swagger):** `200` mảng gói
- **FE Mobile:** INTEGRATED & USED · `billingService.getPlans` — services/billingService.ts:8 · Credit (Wallet) — `screens/parent/WalletScreen.tsx:65`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [70] GET `/plans/:id` — Chi tiết gói

- **Làm gì:** Chi tiết gói
- **Quyền / Authorize:** Public (không cần Authorize)
- **Phụ thuộc (chạy trước):** Không
- **Tham số:**
  - `id` (path, bắt buộc, string)  
- **Status dự kiến (theo Swagger):** `200` gói · `404` Không có
- **FE Mobile:** NOT INTEGRATED · — · —
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

#### [71] GET `/subscriptions/me/credit-history` — Lịch sử credit cộng / trừ (sổ cái)

- **Làm gì:** Mới nhất trước. Bỏ dòng credit_consume (0 credit). context: { kind: ai, requestType, storyTitle, characterName } | { kind: plan, planName }.
- **Quyền / Authorize:** Đã đăng nhập – access token thường (middleware `auth`; token Kid bị chặn 403) · Swagger ghi: `[Auth]`
- **Phụ thuộc (chạy trước):** Authorize bằng `accessToken` từ `POST /auth/login`; Tài khoản đã có gói (đăng ký mới được cấp gói Miễn phí)
- **Tham số:**
  - `page` (query, tùy chọn, integer)  
  - `limit` (query, tùy chọn, integer)  
- **Status dự kiến (theo Swagger):** `200` { entries, pagination }
- **FE Mobile:** INTEGRATED & USED · `billingService.getCreditHistory` — services/billingService.ts:22 · Credit (Wallet) — `screens/parent/WalletScreen.tsx:87`
- **Swagger Test:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **FE Mobile Runtime:** ☐ PASS  ☐ FAIL  ☐ BLOCKED  (mặc định NOT TESTED)
- **Ghi chú / lỗi:** `_______________________________________________`

## G. Tổng kết

- **Tổng API Backend:** 169 (route). Swagger: 170 thao tác.
- **Thuộc Mobile:** 72 · **Đã nối & dùng:** 38 · **SERVICE ONLY:** 2 · **Chưa nối:** 32 · **Tỷ lệ code:** 55.6% · **Tỷ lệ UI dùng:** 52.8%
- **Chưa có API nào được kiểm thử** (Swagger PASS = 0, FE runtime PASS = 0).

**Nên test đầu tiên (theo thứ tự):**

1. `POST /auth/login` — Nền tảng cho mọi API cần đăng nhập
2. `GET /auth/me` — Xác nhận token + ví
3. `GET /children → POST /children` — Có `childId` cho các bước sau
4. `GET /characters → POST /characters` — Có `characterId` để tạo truyện
5. `GET /topics, GET /stories/ai-pricing` — Dữ liệu cho màn tạo truyện (không đổi dữ liệu)
6. `GET /stories, GET /stories/:id` — Danh sách/chi tiết truyện (cần truyện có sẵn từ seed)
7. `POST /auth/kid-pin/set → POST /auth/kid-mode/enter → GET /kid/bookshelf` — Luồng Kid cốt lõi
8. `POST /kid/sessions → PUT …/progress → POST …/answers → POST …/complete` — Luồng đọc + điểm dừng EQ (kiểm tra cả 409)
9. `GET /children/:id/overview, /eq-report` — EQ Parent
10. `GET /plans, GET /subscriptions/me, /credit-history` — Credit (chỉ đọc)

**Tính năng FE Mobile còn thiếu (so với API BE trong phạm vi):**

- Quên/đặt lại mật khẩu, xác minh email (4 API `/auth/*`).
- Quản lý truyện: sửa/xóa truyện, soạn trang và điểm dừng, chọn bìa, đổi nhân vật → **chưa có trình soạn truyện / Tự viết**.
- Ảnh và giọng đọc AI: vẽ ảnh, vẽ lại cảnh, sinh lại giọng đọc, chân dung nhân vật; **không phát audio từ BE** (chỉ dùng TTS thiết bị).
- Tủ sách phía Parent: xem kệ sách, kiểm tra truyện đã trên kệ, gỡ truyện (có service nhưng chưa có nút).
- EQ nâng cao: hành trình EQ (`eq-journey`), danh mục kỹ năng từ BE (đang dùng hằng số cục bộ).
- Hồ sơ bé: avatar, thời lượng sử dụng; Kid: khôi phục lượt đọc (`GET /kid/sessions/:id`), `GET /kid/me`, `GET /kid/ui-audio`.
- Chưa có lời gọi thanh toán/mua gói (Payment = SCOPE PENDING).

## H. Giới hạn của tài liệu

- Quyền truy cập cột “Quyền” lấy từ middleware trong `*.routes.js` (cho nhóm Mobile) và bracket `[Role]` của Swagger; kiểm tra quyền sở hữu (ví dụ truyện của người khác) nằm trong service và **chưa được kiểm toán**.
- Mã trạng thái “dự kiến”, tham số, body lấy từ Swagger — chưa đối chiếu từng validation (`*.validation.js`) và chưa kiểm chứng bằng cách gọi thật.
- Danh sách route lấy bằng phân tích tự động routes; Swagger có 2 mục thừa và 1 mục thiếu (xem A).
- Trạng thái FE là kết quả phân tích tĩnh (grep + chuỗi import). Lời gọi gián tiếp ngoài mẫu `.fn(` có thể bị bỏ sót.