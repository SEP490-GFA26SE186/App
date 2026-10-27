# API INTEGRATION AUDIT – Backend ⇄ FE Mobile

Ngày: 2026-10-26 · Chỉ kiểm tra và báo cáo (không sửa BE/FE, không thêm dependency, không commit) · Nhánh App: `refactor/mobile-web-integration`

> **Kết luận ngắn:** trong phạm vi Mobile (Parent + Kid) có **72** endpoint của BE; **40 (55.6%)** đã có code tích hợp, trong đó **38 (52.8%)** được màn hình thực sự gọi. **Không endpoint nào đạt API RUNTIME TESTED** (BE chưa chạy khi kiểm toán; chưa có bằng chứng gọi thật).

## 1. Tổng hợp số liệu

| Chỉ số | Số lượng |
|---|---|
| Tổng endpoint BE (đọc từ routes v1, gồm cả `/health`) | **169** |
| Thuộc phạm vi Mobile (Parent + Kid) | **72** |
| OUT OF SCOPE (Seller/Market/Payment SCOPE PENDING, Staff/Admin/Specialist/Moderator, hạ tầng, nội dung) | 97 |
| INTEGRATED & USED | **38** |
| SERVICE ONLY | **2** |
| NOT INTEGRATED (trong phạm vi) | **32** |
| NOT VERIFIED | 0 trong bảng chính (xem giới hạn ở §8) |
| **Tỷ lệ code tích hợp trong phạm vi Mobile** (USED + SERVICE ONLY)/72 | **55.6%** |
| **Tỷ lệ được màn hình sử dụng** USED/72 | **52.8%** |
| Tỷ lệ so với toàn bộ BE (169) | 23.7% (code) · 22.5% (đang dùng) |
| **API RUNTIME TESTED** | **0 / 72** |

Theo nhóm (trong phạm vi Mobile):

| Nhóm | Tổng | USED | SERVICE ONLY | NOT INTEGRATED |
|---|---|---|---|---|
| Auth/Phiên/Kid PIN | 14 | 10 | 0 | 4 |
| Bé (Child) | 11 | 6 | 0 | 5 |
| Nhân vật | 6 | 4 | 0 | 2 |
| EQ (danh mục) | 2 | 0 | 0 | 2 |
| Truyện / Sinh truyện | 22 | 8 | 0 | 14 |
| Truyện mẫu (topic) | 1 | 1 | 0 | 0 |
| Tủ sách | 4 | 1 | 1 | 2 |
| Kid Mode | 8 | 5 | 1 | 2 |
| Credit/Gói | 4 | 3 | 0 | 1 |

## 2. Phân biệt CODE INTEGRATED và API RUNTIME TESTED

- **CODE INTEGRATED** = có hàm trong `apps/mobile/src/services/*` gọi đúng method/đường dẫn, và (nếu USED) có màn hình/store gọi hàm đó. Bằng chứng: đường dẫn file + tên hàm ở §3.
- **API RUNTIME TESTED** = đã chạy app với BE thật và quan sát request/response. **Hiện = 0.** Các kiểm thử runtime đã làm (Phase E, emulator SW_Test) chỉ gồm trạng thái lỗi mạng khi BE tắt và Kid UI Preview (dữ liệu mẫu, không gọi API). Test đơn vị `apps/mobile/tests/authRace.test.ts` dùng fetch giả để kiểm tra hủy request đăng nhập/đăng ký — không chứng minh BE trả đúng contract.
- Đối chiếu contract được thực hiện bằng **đọc source BE** (routes/validation/controller) ở các phase trước, không phải gọi thật. Cần chạy BE rồi thử tay để nâng lên RUNTIME TESTED.

## 3. Bảng chính – API trong phạm vi Mobile (Parent + Kid)

Quy ước: “BE có?” = route tồn tại trong `BE/api/src/routes/v1/index.js` + file `*.routes.js` (kèm `file:dòng`); 117 handler có tên rõ trong controller đã được đối chiếu là có định nghĩa. “FE nối?” = có hàm service gọi endpoint. Số dòng lấy từ source tại thời điểm kiểm toán.

| STT | Nhóm | Method | Endpoint | Chức năng | BE có? | FE nối? | File FE gọi API (hàm) | Màn hình / nơi sử dụng | Phân loại | Runtime |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Auth/Phiên/Kid PIN | PUT | `/auth/change-password` | Đổi mật khẩu | Có (`auth/auth.routes.js:18`) | Có | `authService.changePassword` — services/authService.ts:192 | Settings (screens/parent/SettingsScreen.tsx:75) | **INTEGRATED & USED** | NOT TESTED |
| 2 | Auth/Phiên/Kid PIN | POST | `/auth/forgot-password` | Quên mật khẩu (gửi email) | Có (`auth/auth.routes.js:16`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 3 | Auth/Phiên/Kid PIN | POST | `/auth/kid-mode/enter` | Vào Kid Mode (cấp kid token) | Có (`auth/auth.routes.js:23`) | Có | `authService.enterKidMode` — services/authService.ts:229 | Vào/thoát Kid Mode (store) (stores/useKidSession.ts:31) | **INTEGRATED & USED** | NOT TESTED |
| 4 | Auth/Phiên/Kid PIN | POST | `/auth/kid-mode/exit` | Thoát Kid Mode bằng PIN | Có (`auth/auth.routes.js:24`) | Có | `authService.exitKidMode` — services/authService.ts:263 | Vào/thoát Kid Mode (store) (stores/useKidSession.ts:45) | **INTEGRATED & USED** | NOT TESTED |
| 5 | Auth/Phiên/Kid PIN | PUT | `/auth/kid-pin/change` | Đổi PIN Kid Mode | Có (`auth/auth.routes.js:22`) | Có | `authService.changeKidPin` — services/authService.ts:218 | Settings (screens/parent/SettingsScreen.tsx:108) | **INTEGRATED & USED** | NOT TESTED |
| 6 | Auth/Phiên/Kid PIN | POST | `/auth/kid-pin/set` | Đặt PIN Kid Mode | Có (`auth/auth.routes.js:21`) | Có | `authService.setKidPin` — services/authService.ts:206 | Settings (screens/parent/SettingsScreen.tsx:109) | **INTEGRATED & USED** | NOT TESTED |
| 7 | Auth/Phiên/Kid PIN | POST | `/auth/login` | Đăng nhập | Có (`auth/auth.routes.js:10`) | Có | `authService.login` — services/authService.ts:53 | Login (screens/auth/LoginScreen.tsx:74) | **INTEGRATED & USED** | NOT TESTED với BE thật (chỉ trạng thái lỗi mạng offline = PASS) |
| 8 | Auth/Phiên/Kid PIN | POST | `/auth/logout` | Đăng xuất (thu hồi refresh token) | Có (`auth/auth.routes.js:12`) | Có | `authService.logout` — services/authService.ts:159 | Bootstrap/Logout (store) (stores/useAuthSession.ts:94) | **INTEGRATED & USED** | NOT TESTED |
| 9 | Auth/Phiên/Kid PIN | GET | `/auth/me` | Thông tin tài khoản + ví | Có (`auth/auth.routes.js:13`) | Có | `authService.getMe` — services/authService.ts:127 | Bootstrap/Logout (store), ParentTabs, Tải dữ liệu Parent (store) (navigation/ParentTabs.tsx:56, stores/useAuthSession.ts:70, stores/useParentData.ts:45) | **INTEGRATED & USED** | NOT TESTED |
| 10 | Auth/Phiên/Kid PIN | POST | `/auth/refresh-tokens` | Làm mới access token | Có (`auth/auth.routes.js:11`) | Có | `refreshAccessToken (nội bộ apiClient)` — services/apiClient.ts:74 | Tự động khi 401 (apiClient.apiFetch) (services/apiClient.ts (apiFetch → refreshAccessToken)) | **INTEGRATED & USED** | NOT TESTED |
| 11 | Auth/Phiên/Kid PIN | POST | `/auth/register` | Đăng ký phụ huynh | Có (`auth/auth.routes.js:9`) | Có | `authService.register` — services/authService.ts:93 | Register (screens/auth/RegisterScreen.tsx:76) | **INTEGRATED & USED** | NOT TESTED với BE thật (chỉ trạng thái lỗi mạng offline = PASS) |
| 12 | Auth/Phiên/Kid PIN | POST | `/auth/reset-password` | Đặt lại mật khẩu bằng token | Có (`auth/auth.routes.js:17`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 13 | Auth/Phiên/Kid PIN | POST | `/auth/send-verification-email` | Gửi email xác minh | Có (`auth/auth.routes.js:28`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 14 | Auth/Phiên/Kid PIN | POST | `/auth/verify-email` | Xác minh email | Có (`auth/auth.routes.js:30`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 15 | Bé (Child) | GET | `/children` | Danh sách / tạo hồ sơ bé | Có (`children/children.routes.js:11`) | Có | `childService.getChildren` — services/childService.ts:20 | Tải dữ liệu Parent (store) (stores/useParentData.ts:46) | **INTEGRATED & USED** | NOT TESTED |
| 16 | Bé (Child) | POST | `/children` | Danh sách / tạo hồ sơ bé | Có (`children/children.routes.js:11`) | Có | `childService.createChild` — services/childService.ts:30 | Bé (form) (components/parent/ChildFormSheet.tsx:59) | **INTEGRATED & USED** | NOT TESTED |
| 17 | Bé (Child) | DELETE | `/children/:id` | Chi tiết / sửa / xóa bé | Có (`children/children.routes.js:16`) | Có | `childService.deleteChild` — services/childService.ts:54 | Bé nhà mình (screens/parent/ChildrenScreen.tsx:62) | **INTEGRATED & USED** | NOT TESTED |
| 18 | Bé (Child) | GET | `/children/:id` | Chi tiết / sửa / xóa bé | Có (`children/children.routes.js:16`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 19 | Bé (Child) | PUT | `/children/:id` | Chi tiết / sửa / xóa bé | Có (`children/children.routes.js:16`) | Có | `childService.updateChild` — services/childService.ts:42 | Bé (form) (components/parent/ChildFormSheet.tsx:59) | **INTEGRATED & USED** | NOT TESTED |
| 20 | Bé (Child) | PUT | `/children/:id/avatar` | Đổi avatar bé | Có (`children/children.routes.js:26`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 21 | Bé (Child) | GET | `/children/:id/bookshelf` | Tủ sách của bé (phía Parent) | Có (`children/children.routes.js:38`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 22 | Bé (Child) | GET | `/children/:id/eq-journey` | Hành trình EQ theo thời gian | Có (`children/children.routes.js:34`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 23 | Bé (Child) | GET | `/children/:id/eq-report` | Báo cáo EQ | Có (`children/children.routes.js:30`) | Có | `childService.getChildEqReport` — services/childService.ts:73 | Hành trình EQ (screens/parent/EqReportScreen.tsx:43) | **INTEGRATED & USED** | NOT TESTED |
| 24 | Bé (Child) | GET | `/children/:id/overview` | Tổng quan bé (trang chủ) | Có (`children/children.routes.js:22`) | Có | `childService.getChildOverview` — services/childService.ts:64 | Trang chủ Parent (screens/parent/ParentHomeScreen.tsx:68) | **INTEGRATED & USED** | NOT TESTED |
| 25 | Bé (Child) | GET | `/children/:id/usage` | Thời lượng sử dụng của bé | Có (`children/children.routes.js:42`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 26 | Nhân vật | GET | `/characters` | Danh sách / tạo nhân vật | Có (`characters/characters.routes.js:11`) | Có | `characterService.getCharacters` — services/characterService.ts:13 | Tải dữ liệu Parent (store) (stores/useParentData.ts:47) | **INTEGRATED & USED** | NOT TESTED |
| 27 | Nhân vật | POST | `/characters` | Danh sách / tạo nhân vật | Có (`characters/characters.routes.js:11`) | Có | `characterService.createCharacter` — services/characterService.ts:20 | Nhân vật (form) (components/parent/CharacterFormSheet.tsx:65) | **INTEGRATED & USED** | NOT TESTED |
| 28 | Nhân vật | DELETE | `/characters/:id` | Chi tiết / sửa / xóa nhân vật | Có (`characters/characters.routes.js:16`) | Có | `characterService.deleteCharacter` — services/characterService.ts:38 | Nhân vật (screens/parent/CharactersScreen.tsx:57) | **INTEGRATED & USED** | NOT TESTED |
| 29 | Nhân vật | GET | `/characters/:id` | Chi tiết / sửa / xóa nhân vật | Có (`characters/characters.routes.js:16`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 30 | Nhân vật | PUT | `/characters/:id` | Chi tiết / sửa / xóa nhân vật | Có (`characters/characters.routes.js:16`) | Có | `characterService.updateCharacter` — services/characterService.ts:29 | Nhân vật (form) (components/parent/CharacterFormSheet.tsx:60) | **INTEGRATED & USED** | NOT TESTED |
| 31 | Nhân vật | POST | `/characters/:id/portrait` | Sinh chân dung AI | Có (`characters/characters.routes.js:22`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 32 | EQ (danh mục) | GET | `/eq-skills` | Danh mục kỹ năng CASEL | Có (`eq-skills/eq-skills.routes.js:7`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 33 | EQ (danh mục) | GET | `/eq-skills/:id` | Chi tiết kỹ năng | Có (`eq-skills/eq-skills.routes.js:8`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 34 | Truyện / Sinh truyện | GET | `/stories` | Danh sách / tạo truyện | Có (`stories/stories.routes.js:18`) | Có | `storyService.getStories` — services/storyService.ts:41 | Tải dữ liệu Parent (store) (stores/useParentData.ts:48) | **INTEGRATED & USED** | NOT TESTED |
| 35 | Truyện / Sinh truyện | POST | `/stories` | Danh sách / tạo truyện | Có (`stories/stories.routes.js:18`) | Có | `storyService.createStory` — services/storyService.ts:63 | Tạo truyện (Wizard) (screens/parent/StoryWizard.tsx:162) | **INTEGRATED & USED** | NOT TESTED |
| 36 | Truyện / Sinh truyện | DELETE | `/stories/:id` | Chi tiết / sửa / xóa truyện | Có (`stories/stories.routes.js:23`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 37 | Truyện / Sinh truyện | GET | `/stories/:id` | Chi tiết / sửa / xóa truyện | Có (`stories/stories.routes.js:23`) | Có | `storyService.getStory` — services/storyService.ts:56 | Chi tiết truyện (screens/parent/StoryDetailScreen.tsx:58) | **INTEGRATED & USED** | NOT TESTED |
| 38 | Truyện / Sinh truyện | PUT | `/stories/:id` | Chi tiết / sửa / xóa truyện | Có (`stories/stories.routes.js:23`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 39 | Truyện / Sinh truyện | PUT | `/stories/:id/characters` | Cập nhật nhân vật của truyện | Có (`stories/stories.routes.js:31`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 40 | Truyện / Sinh truyện | POST | `/stories/:id/checkpoints` | Thêm điểm dừng | Có (`stories/stories.routes.js:40`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 41 | Truyện / Sinh truyện | DELETE | `/stories/:id/checkpoints/:cpId` | Sửa/xóa điểm dừng | Có (`stories/stories.routes.js:41`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 42 | Truyện / Sinh truyện | PUT | `/stories/:id/checkpoints/:cpId` | Sửa/xóa điểm dừng | Có (`stories/stories.routes.js:41`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 43 | Truyện / Sinh truyện | PUT | `/stories/:id/cover` | Đặt ảnh bìa | Có (`stories/stories.routes.js:30`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 44 | Truyện / Sinh truyện | POST | `/stories/:id/generate` | Bắt đầu sinh nội dung | Có (`stories/stories.routes.js:51`) | Có | `storyService.startGeneration` — services/storyService.ts:95 | Tạo truyện (tiến độ) (components/parent/GenerationRunner.tsx:88) | **INTEGRATED & USED** | NOT TESTED |
| 45 | Truyện / Sinh truyện | GET | `/stories/:id/generation` | Tiến độ sinh nội dung | Có (`stories/stories.routes.js:55`) | Có | `storyService.getGeneration` — services/storyService.ts:102 | Tạo truyện (tiến độ) (components/parent/GenerationRunner.tsx:48) | **INTEGRATED & USED** | NOT TESTED |
| 46 | Truyện / Sinh truyện | POST | `/stories/:id/images` | Sinh ảnh minh họa | Có (`stories/stories.routes.js:53`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 47 | Truyện / Sinh truyện | POST | `/stories/:id/narration/retry` | Sinh lại giọng đọc | Có (`stories/stories.routes.js:47`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 48 | Truyện / Sinh truyện | POST | `/stories/:id/pages` | Thêm trang | Có (`stories/stories.routes.js:34`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 49 | Truyện / Sinh truyện | DELETE | `/stories/:id/pages/:pageId` | Sửa/xóa trang | Có (`stories/stories.routes.js:35`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 50 | Truyện / Sinh truyện | PUT | `/stories/:id/pages/:pageId` | Sửa/xóa trang | Có (`stories/stories.routes.js:35`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 51 | Truyện / Sinh truyện | POST | `/stories/:id/publish-version` | Xuất bản phiên bản | Có (`stories/stories.routes.js:48`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 52 | Truyện / Sinh truyện | POST | `/stories/:id/review` | Đánh dấu đã xem lại truyện | Có (`stories/stories.routes.js:46`) | Có | `storyService.reviewStory` — services/storyService.ts:109 | Chi tiết truyện (screens/parent/StoryDetailScreen.tsx:94) | **INTEGRATED & USED** | NOT TESTED |
| 53 | Truyện / Sinh truyện | POST | `/stories/:id/scenes/:sceneId/image` | Sinh lại ảnh một cảnh | Có (`stories/stories.routes.js:54`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 54 | Truyện / Sinh truyện | GET | `/stories/ai-pricing` | Bảng giá credit AI | Có (`stories/stories.routes.js:13`) | Có | `storyService.getAiPricing` — services/storyService.ts:88 | Tạo truyện (Wizard) (screens/parent/StoryWizard.tsx:99) | **INTEGRATED & USED** | NOT TESTED |
| 55 | Truyện / Sinh truyện | POST | `/stories/analyze` | Phân tích lời kể (AI) trước khi tạo | Có (`stories/stories.routes.js:15`) | Có | `storyService.analyze` — services/storyService.ts:73 | Tạo truyện (Wizard) (screens/parent/StoryWizard.tsx:184) | **INTEGRATED & USED** | NOT TESTED |
| 56 | Truyện mẫu (topic) | GET | `/topics` | Danh sách truyện mẫu/chủ đề | Có (`topics/topics.routes.js:10`) | Có | `storyService.getTemplates` — services/storyService.ts:134 | Tải dữ liệu Parent (store) (stores/useParentData.ts:49) | **INTEGRATED & USED** | NOT TESTED |
| 57 | Tủ sách | GET | `/bookshelf` | Danh sách / thêm truyện vào tủ sách | Có (`bookshelf/bookshelf.routes.js:11`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 58 | Tủ sách | POST | `/bookshelf` | Danh sách / thêm truyện vào tủ sách | Có (`bookshelf/bookshelf.routes.js:12`) | Có | `storyService.addToShelf` — services/storyService.ts:116 | Chi tiết truyện, ParentTabs (navigation/ParentTabs.tsx:72, screens/parent/StoryDetailScreen.tsx:112) | **INTEGRATED & USED** | NOT TESTED |
| 59 | Tủ sách | DELETE | `/bookshelf/:storyId` | Gỡ truyện khỏi tủ sách | Có (`bookshelf/bookshelf.routes.js:14`) | Có | `storyService.removeFromShelf` — services/storyService.ts:125 | — (không có màn gọi) | **SERVICE ONLY** | NOT TESTED |
| 60 | Tủ sách | GET | `/bookshelf/check/:storyId` | Kiểm tra truyện đã ở tủ sách | Có (`bookshelf/bookshelf.routes.js:13`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 61 | Kid Mode | GET | `/kid/bookshelf` | Tủ sách Kid | Có (`kid/kid.routes.js:11`) | Có | `kidService.getShelf` — services/kidService.ts:14 | Kid Mode (tủ sách/đọc/điểm dừng) (screens/kid/useKidReader.ts:46) | **INTEGRATED & USED** | NOT TESTED |
| 62 | Kid Mode | GET | `/kid/me` | Hồ sơ bé đang ở Kid Mode | Có (`kid/kid.routes.js:10`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 63 | Kid Mode | POST | `/kid/sessions` | Bắt đầu/tiếp tục lượt đọc | Có (`kid/kid.routes.js:13`) | Có | `kidService.startReading` — services/kidService.ts:24 | Kid Mode (tủ sách/đọc/điểm dừng) (screens/kid/useKidReader.ts:89) | **INTEGRATED & USED** | NOT TESTED |
| 64 | Kid Mode | GET | `/kid/sessions/:sessionId` | Chi tiết lượt đọc | Có (`kid/kid.routes.js:14`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 65 | Kid Mode | POST | `/kid/sessions/:sessionId/answers` | Trả lời điểm dừng EQ | Có (`kid/kid.routes.js:16`) | Có | `kidService.answer` — services/kidService.ts:47 | Kid Mode (tủ sách/đọc/điểm dừng) (screens/kid/useKidReader.ts:167) | **INTEGRATED & USED** | NOT TESTED |
| 66 | Kid Mode | POST | `/kid/sessions/:sessionId/complete` | Hoàn tất lượt đọc | Có (`kid/kid.routes.js:17`) | Có | `kidService.complete` — services/kidService.ts:67 | Kid Mode (tủ sách/đọc/điểm dừng) (screens/kid/useKidReader.ts:123) | **INTEGRATED & USED** | NOT TESTED |
| 67 | Kid Mode | PUT | `/kid/sessions/:sessionId/progress` | Lưu trang đang đọc | Có (`kid/kid.routes.js:15`) | Có | `kidService.saveProgress` — services/kidService.ts:36 | Kid Mode (tủ sách/đọc/điểm dừng) (screens/kid/useKidReader.ts:78) | **INTEGRATED & USED** | NOT TESTED |
| 68 | Kid Mode | GET | `/kid/ui-audio` | Âm thanh UI cho Kid | Có (`kid/kid.routes.js:12`) | Có | `kidService.getUiAudio` — services/kidService.ts:72 | — (không có màn gọi) | **SERVICE ONLY** | NOT TESTED |
| 69 | Credit/Gói | GET | `/plans` | Danh sách gói | Có (`plans/plans.routes.js:13`) | Có | `billingService.getPlans` — services/billingService.ts:8 | Credit (Wallet) (screens/parent/WalletScreen.tsx:65) | **INTEGRATED & USED** | NOT TESTED |
| 70 | Credit/Gói | GET | `/plans/:id` | Chi tiết gói | Có (`plans/plans.routes.js:14`) | Chưa | — | — | **NOT INTEGRATED** | — |
| 71 | Credit/Gói | GET | `/subscriptions/me` | Gói/credit hiện tại | Có (`plans/plans.routes.js:20`) | Có | `billingService.getSubscription` — services/billingService.ts:15 | Credit (Wallet) (screens/parent/WalletScreen.tsx:64) | **INTEGRATED & USED** | NOT TESTED |
| 72 | Credit/Gói | GET | `/subscriptions/me/credit-history` | Lịch sử credit | Có (`plans/plans.routes.js:21`) | Có | `billingService.getCreditHistory` — services/billingService.ts:22 | Credit (Wallet) (screens/parent/WalletScreen.tsx:87) | **INTEGRATED & USED** | NOT TESTED |

## 4. Kiểm tra theo chức năng đặc biệt

### 4.1 Parent (Auth, Bé, Nhân vật)

- **Đã nối & dùng:** đăng ký/đăng nhập/đăng xuất/`me`/đổi mật khẩu/đặt-đổi PIN (`authService`, dùng ở `LoginScreen.tsx:74`, `RegisterScreen.tsx:76`, `useAuthSession.ts:70,94`, `SettingsScreen.tsx:75,108-109`); refresh token tự động trong `apiClient.apiFetch` → `refreshAccessToken`; Bé: list/tạo/sửa/xóa/overview/eq-report (`childService`, `useParentData.ts:46`, `ChildFormSheet.tsx:59`, `ChildrenScreen.tsx:62`, `ParentHomeScreen.tsx:68`, `EqReportScreen.tsx:43`); Nhân vật: list/tạo/sửa/xóa (`characterService`, `CharacterFormSheet.tsx:60,65`, `CharactersScreen.tsx:57`).
- **Chưa nối:** quên/đặt lại mật khẩu, gửi/xác minh email (4 route `/auth/*`); `GET /children/:id`, `PUT /children/:id/avatar`, `GET /children/:id/eq-journey|bookshelf|usage`; `GET /characters/:id`, `POST /characters/:id/portrait` (sinh chân dung AI).
- **Ghi chú:** BE không có API cập nhật hồ sơ phụ huynh (đã ghi UNKNOWN/BLOCKED từ Phase C); `AuthModal.tsx` còn gọi login/register/kid-pin nhưng component này **không được import ở đâu** (mã chết) nên không tính.

### 4.2 Kid

- **Đã nối & dùng:** `POST /auth/kid-mode/enter|exit` (`useKidSession.ts:31,45`); `GET /kid/bookshelf`, `POST /kid/sessions`, `PUT …/progress`, `POST …/answers`, `POST …/complete` qua `kidService` được `useKidReader.ts:46,89,78,167,123` gọi (nguồn dữ liệu `source={kidService}` ở `AppNavigator.tsx`). Lỗi 409 của `answers` hiện lỗi thật (không coi là xong).
- **Chưa nối:** `GET /kid/me`, `GET /kid/sessions/:sessionId`. **SERVICE ONLY:** `GET /kid/ui-audio` (`kidService.getUiAudio`, `kidService.ts:72`, không màn nào gọi).
- **Runtime:** chưa kiểm thử với BE (PIN sai/khóa tạm, 401, 409 đều NOT TESTED). Kid UI Preview (`src/dev`, `__DEV__`) chỉ dùng dữ liệu mẫu, không gọi API.

### 4.3 Story Generation (tạo truyện + sinh nội dung)

- **Đã nối & dùng:** `POST /stories/analyze` (`StoryWizard.tsx:184`), `GET /stories/ai-pricing` (`StoryWizard.tsx:99`), `POST /stories` (`StoryWizard.tsx:160`), `POST /stories/:id/generate` + `GET /stories/:id/generation` (poll, `GenerationRunner.tsx:88,48`), `POST /stories/:id/review` (`StoryDetailScreen.tsx:94`), `GET /stories` (đọc hết trang, `useParentData.ts:48`), `GET /stories/:id` (`StoryDetailScreen.tsx:58`), `GET /topics` làm danh sách truyện mẫu (`useParentData.ts:49`).
- **Chưa nối (14 route):** sửa/xóa truyện (`PUT|DELETE /stories/:id`), bìa, gán nhân vật, CRUD trang và điểm dừng, sinh ảnh/ảnh cảnh, thử lại giọng đọc, `publish-version`. Vì vậy **trình soạn truyện tự viết chưa có**: `StoryWizard.tsx:281,375` hiển thị “chưa hỗ trợ”.
- **Runtime:** sinh truyện cần BE + Redis + service AI; chưa chạy → NOT TESTED.

### 4.4 Bookshelf

- **Đã nối & dùng:** `POST /bookshelf` thêm truyện vào tủ sách bé (`storyService.addToShelf`; `StoryDetailScreen.tsx:112`, `ParentTabs.tsx:72`). **SERVICE ONLY:** `DELETE /bookshelf/:storyId` (`storyService.removeFromShelf`, `storyService.ts:125`, chưa có nút gọi).
- **Chưa nối:** `GET /bookshelf`, `GET /bookshelf/check/:storyId`, `GET /children/:id/bookshelf`. Tủ sách phía Kid đọc qua `GET /kid/bookshelf` (đã nối).

### 4.5 EQ

- **Đã nối & dùng:** `GET /children/:id/overview` (`ParentHomeScreen.tsx:68`) và `GET /children/:id/eq-report` (`EqReportScreen.tsx:43`); điểm dừng EQ ở Kid qua `answers`.
- **Chưa nối:** `GET /children/:id/eq-journey`, `GET /eq-skills`, `GET /eq-skills/:id`. Danh mục CASEL và nhãn mức trong app là hằng số cục bộ `src/constants/eq.ts` (không lấy từ BE).

### 4.6 Credit

- **Đã nối & dùng:** `GET /plans` (`WalletScreen.tsx:65`), `GET /subscriptions/me` (`:64`), `GET /subscriptions/me/credit-history` (`:87`, phân trang); số dư hiển thị lấy từ `GET /auth/me` (wallet). `GET /stories/ai-pricing` cho bảng giá credit khi tạo truyện.
- **Chưa nối:** `GET /plans/:id`. **OUT OF SCOPE (Payment = SCOPE PENDING):** `POST /payments/plans/checkout`, `GET /payments/orders[/:id]`, hoàn tiền, webhook payOS. Mobile chỉ **xem** gói/credit, không mua.

### 4.7 Audio

- **Không có phát audio từ BE ở Mobile.** `GET /kid/ui-audio` chỉ có hàm service (SERVICE ONLY). Trường `audioUrl` của trang truyện được ánh xạ sang `audioNarrationUrl` (`storyService.ts:173`) nhưng **không có chỗ nào đọc/phát nó** (grep `audioNarrationUrl` chỉ thấy khai báo và ánh xạ).
- Trình đọc phía Parent dùng TTS của thiết bị (`expo-speech` qua `speechTTS`, `StoryReaderModal.tsx:49`). Phát audio URL của BE (C11) **chưa làm** vì cần được duyệt thư viện phát audio; `POST /stories/:id/narration/retry` chưa nối. Nhóm `ui-audio-assets` (CRUD quản trị) OUT OF SCOPE.

## 5. Danh sách API trong phạm vi nhưng chưa nối (ưu tiên đề xuất)

| Ưu tiên | Nhóm API | Route | Lý do |
|---|---|---|---|
| Cao | Quên/đặt lại mật khẩu, xác minh email | `POST /auth/forgot-password`, `/reset-password`, `/send-verification-email`, `/verify-email` | Luồng tài khoản cơ bản của Parent; cần BE gửi email (Brevo) để thử |
| Cao | Sửa/xóa truyện, trang, điểm dừng | `PUT|DELETE /stories/:id`, `/pages`, `/checkpoints`, `/cover`, `/characters` | Cần cho trình soạn truyện (B6) và tự viết |
| Trung bình | Gỡ truyện khỏi tủ sách, xem tủ sách | `DELETE /bookshelf/:storyId` (đã có service), `GET /bookshelf`, `/bookshelf/check/:storyId`, `GET /children/:id/bookshelf` | Quản lý tủ sách Parent |
| Trung bình | EQ nâng cao | `GET /children/:id/eq-journey`, `/eq-skills` | Hành trình EQ, bỏ hằng số cục bộ |
| Trung bình | Ảnh/giọng đọc AI | `POST /stories/:id/images`, `/scenes/:sceneId/image`, `/narration/retry`, `POST /characters/:id/portrait` | Cần BE + AI; liên quan C11 |
| Thấp | Khác | `GET /children/:id`, `/children/:id/avatar|usage`, `GET /characters/:id`, `GET /plans/:id`, `GET /kid/me`, `GET /kid/sessions/:id`, `GET /kid/ui-audio` (service có sẵn), `POST /stories/:id/publish-version` | Bổ trợ/hiển thị |

## 6. Việc cần để nâng lên API RUNTIME TESTED

1. Chạy BE local (Postgres + `JWT_SECRET`; thêm Redis và service AI nếu thử sinh truyện), nạp dữ liệu mẫu (`npm run db:setup`).
2. Chạy app trên emulator `SW_Test` với `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`.
3. Với từng dòng USED: thử ca thành công + ca lỗi (400/401/403/409/422/429/mạng) rồi ghi kết quả vào bảng này (cột Runtime). Không đánh PASS khi chưa có bằng chứng.

## 7. Phụ lục A – API OUT OF SCOPE (97 route)

Không thuộc nhiệm vụ FE Mobile hiện tại (SCOPE PENDING: Seller/Specialist/Admin/Marketplace/Payment; chức năng nhân viên Moderator/Admin; hạ tầng). Không có lời gọi nào trong `apps/mobile/src` (đã grep).

| STT | Nhóm | Method | Endpoint | Chức năng |
|---|---|---|---|---|
| 1 | Admin (Staff) | GET | `/admin/accounts` |  |
| 2 | Admin (Staff) | PATCH | `/admin/accounts/:userId` |  |
| 3 | Admin (Staff) | POST | `/admin/accounts/moderators` |  |
| 4 | Admin (Staff) | GET | `/admin/appeals` |  |
| 5 | Admin (Staff) | POST | `/admin/appeals/:appealId/decision` |  |
| 6 | Admin (Staff) | GET | `/admin/audit-logs` |  |
| 7 | Admin (Staff) | GET | `/admin/finance/reconciliation` |  |
| 8 | Admin (Staff) | POST | `/admin/finance/reconciliation/fix-counters` |  |
| 9 | Admin (Staff) | GET | `/admin/finance/summary` |  |
| 10 | Admin (Staff) | GET | `/admin/overview` |  |
| 11 | Admin (Staff) | GET | `/admin/plans` |  |
| 12 | Admin (Staff) | POST | `/admin/plans` |  |
| 13 | Admin (Staff) | PUT | `/admin/plans/:planId` |  |
| 14 | Admin (Staff) | GET | `/admin/refunds` |  |
| 15 | Admin (Staff) | POST | `/admin/refunds/:refundId/decision` |  |
| 16 | Admin (Staff) | GET | `/admin/settings` |  |
| 17 | Admin (Staff) | PUT | `/admin/settings/:key` |  |
| 18 | Admin (Staff) | GET | `/admin/withdrawals` |  |
| 19 | Admin (Staff) | POST | `/admin/withdrawals/:id/mark-paid` |  |
| 20 | Admin (Staff) | POST | `/admin/withdrawals/:id/reject` |  |
| 21 | Admin (Staff) | GET | `/content-library/stats` |  |
| 22 | Audio UI (Admin/Content) | GET | `/ui-audio-assets` |  |
| 23 | Audio UI (Admin/Content) | POST | `/ui-audio-assets` |  |
| 24 | Audio UI (Admin/Content) | DELETE | `/ui-audio-assets/:id` |  |
| 25 | Audio UI (Admin/Content) | GET | `/ui-audio-assets/:id` |  |
| 26 | Audio UI (Admin/Content) | PUT | `/ui-audio-assets/:id` |  |
| 27 | Audio UI (Admin/Content) | GET | `/ui-audio-assets/by-key/:key` |  |
| 28 | Chợ (SCOPE PENDING) | POST | `/market/checkout` |  |
| 29 | Chợ (SCOPE PENDING) | GET | `/market/listings` |  |
| 30 | Chợ (SCOPE PENDING) | GET | `/market/listings/:listingId` |  |
| 31 | Chợ (SCOPE PENDING) | POST | `/market/listings/:listingId/reports` |  |
| 32 | Chợ (SCOPE PENDING) | PUT | `/market/listings/:listingId/review` |  |
| 33 | Chợ (SCOPE PENDING) | GET | `/market/listings/:listingId/reviews` |  |
| 34 | Chợ (SCOPE PENDING) | GET | `/market/owned` |  |
| 35 | Chợ (SCOPE PENDING) | GET | `/market/report-categories` |  |
| 36 | Chợ (SCOPE PENDING) | POST | `/market/reviews/:reviewId/reply` |  |
| 37 | Chợ (SCOPE PENDING) | POST | `/market/reviews/:reviewId/reports` |  |
| 38 | Chợ (SCOPE PENDING) | GET | `/market/sellers/:sellerId` |  |
| 39 | Hạ tầng | GET | `/health` | Health check |
| 40 | Kiểm duyệt (Staff) | GET | `/moderation/ai-flags` |  |
| 41 | Kiểm duyệt (Staff) | POST | `/moderation/ai-flags/:userId/block` |  |
| 42 | Kiểm duyệt (Staff) | GET | `/moderation/audits` |  |
| 43 | Kiểm duyệt (Staff) | POST | `/moderation/audits/run` |  |
| 44 | Kiểm duyệt (Staff) | GET | `/moderation/keywords` |  |
| 45 | Kiểm duyệt (Staff) | POST | `/moderation/keywords` |  |
| 46 | Kiểm duyệt (Staff) | DELETE | `/moderation/keywords/:id` |  |
| 47 | Kiểm duyệt (Staff) | PUT | `/moderation/keywords/:id` |  |
| 48 | Kiểm duyệt (Staff) | GET | `/moderation/listings` |  |
| 49 | Kiểm duyệt (Staff) | POST | `/moderation/listings/:listingId/suspend` |  |
| 50 | Kiểm duyệt (Staff) | POST | `/moderation/product-reviews/:reviewId/hide` |  |
| 51 | Kiểm duyệt (Staff) | GET | `/moderation/reports` |  |
| 52 | Kiểm duyệt (Staff) | POST | `/moderation/reports/:reportId/dismiss` |  |
| 53 | Kiểm duyệt (Staff) | GET | `/moderation/sellers` |  |
| 54 | Kiểm duyệt (Staff) | POST | `/moderation/sellers/:userId/decision` |  |
| 55 | Kiểm duyệt (Staff) | GET | `/moderation/strikes` |  |
| 56 | Kiểm duyệt (Staff) | POST | `/moderation/strikes` |  |
| 57 | Kiểm duyệt (Staff) | GET | `/moderation/submissions` |  |
| 58 | Kiểm duyệt (Staff) | GET | `/moderation/submissions/:reviewId` |  |
| 59 | Kiểm duyệt (Staff) | POST | `/moderation/submissions/:reviewId/claim` |  |
| 60 | Kiểm duyệt (Staff) | POST | `/moderation/submissions/:reviewId/decision` |  |
| 61 | Kiểm duyệt (Staff) | POST | `/moderation/submissions/:reviewId/pages/:pageId/view` |  |
| 62 | Seller (SCOPE PENDING) | POST | `/listings` |  |
| 63 | Seller (SCOPE PENDING) | POST | `/listings/:listingId/versions` |  |
| 64 | Seller (SCOPE PENDING) | GET | `/listings/mine` |  |
| 65 | Seller (SCOPE PENDING) | POST | `/sellers/apply` |  |
| 66 | Seller (SCOPE PENDING) | GET | `/sellers/me` |  |
| 67 | Seller (SCOPE PENDING) | PUT | `/sellers/me` |  |
| 68 | Seller (SCOPE PENDING) | PUT | `/sellers/me/bank` |  |
| 69 | Seller (SCOPE PENDING) | GET | `/sellers/me/earnings` |  |
| 70 | Seller (SCOPE PENDING) | GET | `/sellers/me/strikes` |  |
| 71 | Seller (SCOPE PENDING) | POST | `/sellers/me/strikes/:strikeId/appeal` |  |
| 72 | Seller (SCOPE PENDING) | POST | `/sellers/me/withdrawals` |  |
| 73 | Seller (SCOPE PENDING) | DELETE | `/sellers/me/withdrawals/:id` |  |
| 74 | Specialist (Staff) | GET | `/checkpoint-review` |  |
| 75 | Specialist (Staff) | DELETE | `/checkpoint-review/:checkpointId/flag` |  |
| 76 | Specialist (Staff) | POST | `/checkpoint-review/:checkpointId/flag` |  |
| 77 | Specialist (Staff) | POST | `/checkpoint-review/:checkpointId/ok` |  |
| 78 | Specialist (Staff) | GET | `/checkpoint-review/stats` |  |
| 79 | Specialist (Staff) | GET | `/question-templates` |  |
| 80 | Specialist (Staff) | POST | `/question-templates` |  |
| 81 | Specialist (Staff) | DELETE | `/question-templates/:id` |  |
| 82 | Specialist (Staff) | PUT | `/question-templates/:id` |  |
| 83 | Specialist (Staff) | PUT | `/question-templates/:id/draft` |  |
| 84 | Specialist (Staff) | POST | `/question-templates/:id/duplicate` |  |
| 85 | Specialist (Staff) | POST | `/question-templates/:id/publish` |  |
| 86 | Specialist/Admin (Staff) | GET | `/pedagogy/report-settings` |  |
| 87 | Specialist/Admin (Staff) | PUT | `/pedagogy/report-settings` |  |
| 88 | Specialist/Admin (Staff) | GET | `/sub-skills` |  |
| 89 | Specialist/Admin (Staff) | PUT | `/sub-skills/:id` |  |
| 90 | Thanh toán (SCOPE PENDING) | POST | `/payments/order-items/:itemId/refund` |  |
| 91 | Thanh toán (SCOPE PENDING) | GET | `/payments/orders` |  |
| 92 | Thanh toán (SCOPE PENDING) | GET | `/payments/orders/:orderId` |  |
| 93 | Thanh toán (SCOPE PENDING) | POST | `/payments/payos/webhook` |  |
| 94 | Thanh toán (SCOPE PENDING) | POST | `/payments/plans/checkout` |  |
| 95 | Truyện mẫu (topic) | POST | `/topics` | Danh sách truyện mẫu/chủ đề |
| 96 | Truyện mẫu (topic) | DELETE | `/topics/:id` |  |
| 97 | Truyện mẫu (topic) | PUT | `/topics/:id` |  |

## 8. Phương pháp và giới hạn

- **Liệt kê BE:** phân tích tự động `routes/v1/index.js` + từng `*.routes.js` (cả dạng `router.get(...)` và `router.route(...).get(...)`), kết quả 169 (method, path) không trùng. Chưa đọc từng controller/service để kiểm tra nghiệp vụ; chỉ kiểm tra handler được tham chiếu có định nghĩa (117 tên). Cột “Chức năng” của route staff/market lấy từ tên route (một số mô tả để trống).
- **Swagger:** `BE/api/src/docs` (swagger.js + paths/*.js) mô tả khoảng 135 thao tác theo đếm gần đúng, ít hơn 169 route thực → Swagger chưa đầy đủ; nguồn chuẩn cho báo cáo này là routes.
- **Auth/quyền** của từng route chưa được kiểm toán (không có cột auth) — cần đọc middleware để khẳng định.
- **FE:** liệt kê bằng grep mọi chuỗi đường dẫn API trong `apps/mobile/src` + đối chiếu hàm service với nơi gọi (loại trừ `dev/` và `components/auth/AuthModal.tsx` là mã chết). Lời gọi động/gián tiếp ngoài mẫu `.fn(` hoặc `source.fn(` có thể bị bỏ sót.
- **NOT VERIFIED:** không dòng nào trong phạm vi bị gắn nhãn này vì mọi dòng đã có bằng chứng file/hàm; tuy nhiên đúng/sai contract (body, mã lỗi) chỉ được đối chiếu ở mức đọc source trong Phase C, chưa kiểm chứng lại toàn bộ trong báo cáo này.