# Ma trận API Mobile & Kiểm thử thủ công — StoryWeaver AI

Báo cáo tổng hợp (bản chốt Phase 3) sau Phase 1, Phase 2, việc gỡ khu "Máy chủ" khỏi Cài đặt, **nối Kid UI Audio** và **xóa `AuthModal` cũ** (§7).
Ngày: 2026-10-29 · Nhánh Mobile: `refactor/mobile-frontend-cleanup` (chưa commit) · BE: `b08a9f3` (không đổi so với lần audit) · Expo SDK 52.0.49.

Cách đếm:
- **Endpoint** = một cặp (method, đường dẫn) duy nhất dưới `/api/v1`, theo `BE/api/src/routes/v1/index.js` + các `*.routes.js` (giống audit `API_INTEGRATION_STATUS_REPORT.md` §1.1).
- **Đã nối (active)** = lần ngược được chuỗi *màn hình/luồng đang hoạt động → service/hook → `apiFetch`/`kidFetch` → endpoint BE*. Hàm service không ai gọi **không** được tính. Endpoint có ở BE nhưng Mobile không gọi cũng **không** được tính.
- Số liệu cũ (63 / +7 / +11) chỉ là mốc lịch sử. Toàn bộ danh sách dưới đây được đếm lại từ mã nguồn hiện tại bằng cách quét mọi hàm trong `services/*.ts` và tìm nơi gọi ngoài `services/`, `dev/`, `tests/`.

Đường dẫn Mobile tương đối với `App/apps/mobile/src/`; đường dẫn BE tương đối với `BE/api/src/modules/`.

---

## 1. Tổng quan

| Hạng mục | Số endpoint |
|---|---:|
| Tổng endpoint BE | **170** |
| Mobile đang nối (active) | **82** |
| — Nối đầy đủ | 81 |
| — Nối một phần | 1 (`GET /kid/sessions/:sessionId`) |
| — trong đó thuộc luồng OWNER-RESERVED (đã nối từ trước, chỉ chủ dự án được kiểm thử) | 5 (ST-1, ST-2, ST-3, ST-19, ST-22) |
| BE có, Mobile **không** nối (trong phạm vi Parent/Kid/Auth) | **16** |
| — Hoãn (DEFERRED) | 1 (CH-7 avatar bé) |
| — Đã cố ý gỡ khỏi UI | 1 (SYS-1 `GET /health`) |
| — OWNER-RESERVED, không được phép làm mới | 14 (CR-6, ST-6…15, ST-17, ST-20, ST-21) |
| OUT OF MOBILE SCOPE (Marketplace/Seller/Payment, Admin & Specialist chỉ dùng Web) | **71** |
| BE STUB (501) | 1 (ST-18 `POST /stories/:id/publish-version`, cũng thuộc luồng truyện của chủ dự án) |
| Kiểm tra cộng: 82 + 16 + 71 + 1 | = 170 ✔ |

Đối chiếu với mốc lịch sử: 63 (audit) + 7 (Phase 1) + 12 (Phase 2: 11 đầy đủ + 1 một phần) − 1 (`/health` đã gỡ) + 1 (KD-3 `GET /kid/ui-audio`, nối sau khi chủ dự án duyệt `expo-audio`) = **82**. Khớp với số đếm lại.

Bằng chứng E2E thật:
- **Không có** bằng chứng E2E ở mức request: không log, không ảnh chụp, không bản ghi network được nộp. Claude không gọi BE thật ở bất kỳ phase nào.
- Phase 2: chủ dự án báo các chức năng truy cập được đều chạy đúng (**OWNER-REPORTED MANUAL PASS**, không có kết quả từng test).
- Phase 1: chủ dự án báo đã kiểm thử nhưng **không cung cấp kết quả chi tiết**, nên vẫn ghi MANUAL TEST PENDING.
- 63 endpoint cũ: chỉ có ghi nhận PASS lịch sử trong `MOBILE_STATUS.md` (một số luồng đọc) và FIXTURE PASS (Admin/Specialist với BE giả). Không cái nào là REAL E2E VERIFIED.

Ghi chú truy vết:
- `components/auth/AuthModal.tsx` (không được render ở đâu) **đã xóa** (§7.2). Các endpoint nó từng gọi (login, register, POST /children, kid-pin) vẫn được màn khác gọi, nên số đếm không đổi.
- `kidService.getUiAudio` **nay có nơi gọi**: `screens/kid/useKidUiAudio.ts` (gọi từ `KidModeScreen`) → kết quả dùng để phát âm thanh ở `KidCheckpointCard`.
- `authService.getSavedUser` không có nơi gọi và không gọi HTTP.
- `POST /auth/refresh-tokens` được gọi tự động bởi interceptor 401 trong `services/apiClient.ts` (không có nút bấm riêng).

---

## 2. Danh mục endpoint đang nối (82)

Cột "Test" là trạng thái kiểm thử thủ công (§3). Tất cả đều **chưa REAL E2E VERIFIED**.

### 2.1 Auth (14)

| ID | Role | Chức năng | Method | Endpoint | Màn hình / điều hướng | Service Mobile | Nguồn BE | Tích hợp | Test |
|---|---|---|---|---|---|---|---|---|---|
| AU-1 | Parent | Đăng ký | POST | /api/v1/auth/register | Đăng nhập → Đăng ký ngay → Đăng ký | `authService.register` | auth/auth.routes.js:9 | Đầy đủ | MANUAL TEST PENDING |
| AU-2 | Mọi role | Đăng nhập | POST | /api/v1/auth/login | Màn Đăng nhập | `authService.login` | auth/auth.routes.js:10 | Đầy đủ | MANUAL TEST PENDING (PASS lịch sử) |
| AU-3 | Mọi role | Tự làm mới token khi 401 | POST | /api/v1/auth/refresh-tokens | Tự động (interceptor) | `refreshAccessToken` (services/apiClient.ts) | auth/auth.routes.js:11 | Đầy đủ | MANUAL TEST PENDING |
| AU-4 | Mọi role | Đăng xuất | POST | /api/v1/auth/logout | Hồ sơ/Thêm → Đăng xuất; Cài đặt → Đăng xuất | `authService.logout` (stores/useAuthSession.ts) | auth/auth.routes.js:12 | Đầy đủ | MANUAL TEST PENDING |
| AU-5 | Mọi role | Tải hồ sơ + số dư | GET | /api/v1/auth/me | Khởi động app; làm mới credit | `authService.getMe` (stores/useAuthSession.ts, useParentData.ts) | auth/auth.routes.js:13 | Đầy đủ | MANUAL TEST PENDING (PASS lịch sử) |
| AU-6 | Khách | Quên mật khẩu (gửi mã) | POST | /api/v1/auth/forgot-password | Đăng nhập → Quên mật khẩu? | `authService.forgotPassword` (components/auth/ForgotPasswordSheet.tsx) | auth/auth.routes.js:16 | Đầy đủ | OWNER-REPORTED MANUAL PASS |
| AU-7 | Khách | Đặt lại mật khẩu bằng mã | POST | /api/v1/auth/reset-password | Cùng sheet, bước 2 | `authService.resetPassword` | auth/auth.routes.js:17 | Đầy đủ | OWNER-REPORTED MANUAL PASS |
| AU-8 | Parent | Đổi mật khẩu | PUT | /api/v1/auth/change-password | Hồ sơ → Cài đặt → Đổi mật khẩu | `authService.changePassword` | auth/auth.routes.js:18 | Đầy đủ | MANUAL TEST PENDING |
| AU-9 | Parent | Đặt PIN Kid Mode | POST | /api/v1/auth/kid-pin/set | Cài đặt → Mã PIN (chưa có PIN) | `authService.setKidPin` | auth/auth.routes.js:21 | Đầy đủ | MANUAL TEST PENDING (PASS lịch sử) |
| AU-10 | Parent | Đổi PIN | PUT | /api/v1/auth/kid-pin/change | Cài đặt → Mã PIN (đã có PIN) | `authService.changeKidPin` | auth/auth.routes.js:22 | Đầy đủ | MANUAL TEST PENDING |
| AU-11 | Parent | Vào Chế độ Bé | POST | /api/v1/auth/kid-mode/enter | Bé nhà mình → Vào Chế độ Bé; Hồ sơ → Chế độ Bé | `authService.enterKidMode` (stores/useKidSession.ts) | auth/auth.routes.js:23 | Đầy đủ | MANUAL TEST PENDING (PASS lịch sử) |
| AU-12 | Kid→Parent | Thoát bằng PIN | POST | /api/v1/auth/kid-mode/exit | Chế độ Bé → Thoát → nhập PIN | `authService.exitKidMode` (stores/useKidSession.ts) | auth/auth.routes.js:24 | Đầy đủ | MANUAL TEST PENDING (PASS lịch sử) |
| AU-13 | Parent | Gửi mã xác thực email | POST | /api/v1/auth/send-verification-email | Cài đặt → Xác thực email → Gửi mã | `authService.sendVerificationEmail` | auth/auth.routes.js:28 | Đầy đủ | OWNER-REPORTED MANUAL PASS |
| AU-14 | Parent | Xác thực email bằng mã | POST | /api/v1/auth/verify-email | Cùng thẻ → Xác thực | `authService.verifyEmail` | auth/auth.routes.js:30 | Đầy đủ | OWNER-REPORTED MANUAL PASS |

### 2.2 Parent — hồ sơ bé, nhân vật (10)

| ID | Role | Chức năng | Method | Endpoint | Màn hình / điều hướng | Service Mobile | Nguồn BE | Tích hợp | Test |
|---|---|---|---|---|---|---|---|---|---|
| CH-1 | Parent | Thêm bé | POST | /api/v1/children | Hồ sơ → Bé nhà mình → Thêm hồ sơ bé mới | `childService.createChild` (components/parent/ChildFormSheet.tsx) | children/children.routes.js:12 | Đầy đủ | MANUAL TEST PENDING |
| CH-2 | Parent | Danh sách bé | GET | /api/v1/children | Tự tải khi vào Parent | `childService.getChildren` (stores/useParentData.ts) | children/children.routes.js:12 | Đầy đủ | MANUAL TEST PENDING |
| CH-4 | Parent | Sửa bé | PUT | /api/v1/children/:id | Bé nhà mình → Sửa | `childService.updateChild` | children/children.routes.js:17 | Đầy đủ | MANUAL TEST PENDING |
| CH-5 | Parent | Xóa bé | DELETE | /api/v1/children/:id | Bé nhà mình → Xóa (xác nhận) | `childService.deleteChild` | children/children.routes.js:17 | Đầy đủ | MANUAL TEST PENDING |
| CH-6 | Parent | Số liệu Trang chủ | GET | /api/v1/children/:id/overview | Tab Trang chủ | `childService.getChildOverview` (screens/parent/ParentHomeScreen.tsx) | children/children.routes.js:23 | Đầy đủ | MANUAL TEST PENDING (PASS lịch sử) |
| CR-1 | Parent | Thêm nhân vật | POST | /api/v1/characters | Hồ sơ → Nhân vật gia đình → Thêm nhân vật | `characterService.createCharacter` | characters/characters.routes.js:12 | Đầy đủ | MANUAL TEST PENDING |
| CR-2 | Parent | Danh sách nhân vật | GET | /api/v1/characters | Tự tải khi vào Parent | `characterService.getCharacters` (stores/useParentData.ts) | characters/characters.routes.js:12 | Đầy đủ | MANUAL TEST PENDING |
| CR-3 | Parent | Chi tiết nhân vật | GET | /api/v1/characters/:id | Nhân vật gia đình → Chi tiết | `characterService.getCharacter` (screens/parent/CharactersScreen.tsx) | characters/characters.routes.js:17 | Đầy đủ | OWNER-REPORTED MANUAL PASS |
| CR-4 | Parent | Sửa nhân vật | PUT | /api/v1/characters/:id | Nhân vật gia đình → Sửa | `characterService.updateCharacter` | characters/characters.routes.js:17 | Đầy đủ | MANUAL TEST PENDING |
| CR-5 | Parent | Xóa nhân vật | DELETE | /api/v1/characters/:id | Nhân vật gia đình → Xóa (xác nhận) | `characterService.deleteCharacter` | characters/characters.routes.js:17 | Đầy đủ | MANUAL TEST PENDING |

### 2.3 Child / Bookshelf (7)

| ID | Role | Chức năng | Method | Endpoint | Màn hình / điều hướng | Service Mobile | Nguồn BE | Tích hợp | Test |
|---|---|---|---|---|---|---|---|---|---|
| CH-3 | Parent | Hồ sơ chi tiết bé | GET | /api/v1/children/:id | Bé nhà mình → Chi tiết | `childService.getChild` (screens/parent/ChildDetailScreen.tsx) | children/children.routes.js:17 | Đầy đủ | MANUAL TEST PENDING (Phase 1) |
| CH-10 | Parent | Tóm tắt tủ sách bé | GET | /api/v1/children/:id/bookshelf | Chi tiết bé → "Tủ sách của bé" | `childService.getChildBookshelf` | children/children.routes.js:39 | Đầy đủ | MANUAL TEST PENDING (Phase 1) |
| CH-11 | Parent | Thời gian đọc theo ngày | GET | /api/v1/children/:id/usage?date= | Chi tiết bé → "Thời gian đọc" (chip 7 ngày) | `childService.getChildUsage` | children/children.routes.js:43 | Đầy đủ | MANUAL TEST PENDING (Phase 1) |
| BS-1 | Parent | Danh sách tủ sách (phân trang, lọc) | GET | /api/v1/bookshelf?childId&status&page&limit | Tủ truyện → "Tủ sách của {bé}"; Chi tiết bé → Quản lý tủ sách | `storyService.getBookshelf` (components/parent/ChildShelfPanel.tsx) | bookshelf/bookshelf.routes.js:11 | Đầy đủ | MANUAL TEST PENDING (Phase 1) |
| BS-2 | Parent | Thêm truyện lên tủ bé | POST | /api/v1/bookshelf | Tủ truyện → "⋯" → Thêm vào tủ sách; Chi tiết truyện → Thêm (theo bé) | `storyService.addToShelf` (navigation/ParentTabs.tsx, StoryDetailScreen.tsx) | bookshelf/bookshelf.routes.js:12 | Đầy đủ | MANUAL TEST PENDING |
| BS-3 | Parent | Truyện đang ở tủ bé nào | GET | /api/v1/bookshelf/check/:storyId | Chi tiết truyện → khối "Tủ sách của các bé" | `storyService.checkShelf` | bookshelf/bookshelf.routes.js:13 | Đầy đủ | MANUAL TEST PENDING (Phase 1) |
| BS-4 | Parent | Gỡ truyện khỏi tủ bé | DELETE | /api/v1/bookshelf/:storyId?childId= | Tủ sách của bé → Gỡ; Chi tiết truyện → Gỡ (có xác nhận) | `storyService.removeFromShelf` | bookshelf/bookshelf.routes.js:14 | Đầy đủ | MANUAL TEST PENDING (Phase 1) |

### 2.4 Story / Library (9)

| ID | Role | Chức năng | Method | Endpoint | Màn hình / điều hướng | Service Mobile | Nguồn BE | Tích hợp | Test |
|---|---|---|---|---|---|---|---|---|---|
| ST-4 | Parent | Danh sách truyện | GET | /api/v1/stories?page&limit=100 | Tự tải; Tab Tủ truyện | `storyService.getStories` (stores/useParentData.ts) | stories/stories.routes.js:19 | Đầy đủ (giới hạn 10 trang × 100) | MANUAL TEST PENDING |
| ST-5 | Parent | Chi tiết truyện | GET | /api/v1/stories/:id | Tủ truyện → chạm truyện | `storyService.getStory` (screens/parent/StoryDetailScreen.tsx) | stories/stories.routes.js:24 | Đầy đủ | MANUAL TEST PENDING |
| ST-16 | Parent | Hoàn tất xem lại | POST | /api/v1/stories/:id/review | Chi tiết truyện → Hoàn tất xem lại | `storyService.reviewStory` | stories/stories.routes.js:46 | Đầy đủ | MANUAL TEST PENDING |
| TP-1 | Parent | Danh sách chủ đề (chuyện mẫu) | GET | /api/v1/topics | Tự tải; dùng ở Wizard | `storyService.getTemplates` (stores/useParentData.ts) | topics/topics.routes.js:10 | Đầy đủ | MANUAL TEST PENDING |
| ST-1 | Parent | Bảng giá credit AI | GET | /api/v1/stories/ai-pricing | Tab Sáng tác (Wizard) | `storyService.getAiPricing` (screens/parent/StoryWizard.tsx) | stories/stories.routes.js:13 | Đầy đủ | OWNER-RESERVED |
| ST-2 | Parent | Phân tích "chuyện nhà mình" (AI) | POST | /api/v1/stories/analyze | Sáng tác → Kể chuyện nhà mình | `storyService.analyze` | stories/stories.routes.js:15 | Đầy đủ | OWNER-RESERVED |
| ST-3 | Parent | Tạo truyện | POST | /api/v1/stories | Sáng tác → hoàn tất Wizard | `storyService.createStory` | stories/stories.routes.js:19 | Đầy đủ (không gửi `useAiImage`) | OWNER-RESERVED |
| ST-19 | Parent | Cho AI viết (giữ credit) | POST | /api/v1/stories/:id/generate | Wizard / Chi tiết truyện → Cho AI viết | `storyService.startGeneration` (components/parent/GenerationRunner.tsx) | stories/stories.routes.js:51 | Đầy đủ | OWNER-RESERVED |
| ST-22 | Parent | Theo dõi tiến độ AI | GET | /api/v1/stories/:id/generation | GenerationRunner (poll 3 giây) | `storyService.getGeneration` | stories/stories.routes.js:55 | Đầy đủ | OWNER-RESERVED |

### 2.5 Kid (8)

Tất cả đi qua `kidFetch` (chỉ token `kid_session`). Màn: `screens/kid/KidModeScreen.tsx` + `useKidReader.ts`.

| ID | Role | Chức năng | Method | Endpoint | Màn hình / điều hướng | Service Mobile | Nguồn BE | Tích hợp | Test |
|---|---|---|---|---|---|---|---|---|---|
| KD-1 | Kid | Xác nhận phiên đúng bé + tên | GET | /api/v1/kid/me | Tự gọi khi vào Chế độ Bé | `kidService.getMe` | kid/kid.routes.js:10 | Đầy đủ | OWNER-REPORTED MANUAL PASS |
| KD-3 | Kid | Câu đọc dùng chung (âm thanh BE tạo sẵn) | GET | /api/v1/kid/ui-audio | Tự gọi 1 lần khi vào Chế độ Bé; phát khi bé bấm **Nghe** ở điểm dừng | `kidService.getUiAudio` → `useKidUiAudio` (screens/kid/useKidUiAudio.ts) | kid/kid.routes.js:12 | Đầy đủ (dùng 5/12 khóa, xem §7.1) | IMPLEMENTED — MANUAL TEST PENDING |
| KD-2 | Kid | Tủ sách của bé | GET | /api/v1/kid/bookshelf | Chế độ Bé (màn chính) | `kidService.getShelf` | kid/kid.routes.js:11 | Đầy đủ | MANUAL TEST PENDING (PASS lịch sử) |
| KD-4 | Kid | Mở / đọc tiếp truyện | POST | /api/v1/kid/sessions | Chạm truyện trên tủ | `kidService.startReading` | kid/kid.routes.js:13 | Đầy đủ | MANUAL TEST PENDING |
| KD-5 | Kid | Đồng bộ lại lượt đọc | GET | /api/v1/kid/sessions/:sessionId | Đang đọc, gặp lỗi → Tải lại lượt đọc | `kidService.getSession` | kid/kid.routes.js:14 | **Một phần** (không khôi phục sau khi khởi động lại app) | PARTIAL |
| KD-6 | Kid | Lưu trang đang đọc | PUT | /api/v1/kid/sessions/:sessionId/progress | Bấm Trang sau | `kidService.saveProgress` | kid/kid.routes.js:15 | Đầy đủ | MANUAL TEST PENDING |
| KD-7 | Kid | Trả lời điểm dừng EQ | POST | /api/v1/kid/sessions/:sessionId/answers | Điểm dừng → chọn cảm xúc/đáp án/bỏ qua | `kidService.answer` | kid/kid.routes.js:16 | Đầy đủ | MANUAL TEST PENDING |
| KD-8 | Kid | Hoàn thành lượt đọc | POST | /api/v1/kid/sessions/:sessionId/complete | Trang cuối → Đọc xong | `kidService.complete` | kid/kid.routes.js:17 | Đầy đủ | MANUAL TEST PENDING |

### 2.6 EQ (5)

| ID | Role | Chức năng | Method | Endpoint | Màn hình / điều hướng | Service Mobile | Nguồn BE | Tích hợp | Test |
|---|---|---|---|---|---|---|---|---|---|
| CH-8 | Parent | Báo cáo EQ 5 năng lực | GET | /api/v1/children/:id/eq-report | Tab Tiến độ | `childService.getChildEqReport` (screens/parent/EqReportScreen.tsx) | children/children.routes.js:31 | Đầy đủ | MANUAL TEST PENDING |
| CH-9 | Parent | Xu hướng 8 tuần | GET | /api/v1/children/:id/eq-journey?weeks=8 | Tab Tiến độ → thẻ "Xu hướng 8 tuần gần đây" | `childService.getChildEqJourney` | children/children.routes.js:35 | Đầy đủ | MANUAL TEST PENDING (Phase 1) |
| EQ-1 | Parent | Danh sách 5 năng lực CASEL | GET | /api/v1/eq-skills | Tiến độ → Tìm hiểu 5 năng lực CASEL | `eqSkillService.getSkills` (screens/parent/EqSkillsScreen.tsx) | eq-skills/eq-skills.routes.js:7 | Đầy đủ | OWNER-REPORTED MANUAL PASS |
| EQ-2 | Parent | Chi tiết năng lực + chủ đề | GET | /api/v1/eq-skills/:idOrCode | Chạm một năng lực → sheet | `eqSkillService.getSkill` | eq-skills/eq-skills.routes.js:8 | Đầy đủ | OWNER-REPORTED MANUAL PASS |
| EQ-3 | Parent | Kỹ năng con đang dùng | GET | /api/v1/sub-skills?skillId= | Cùng sheet → "Kỹ năng con" | `eqSkillService.getSubSkills` | sub-skills/sub-skills.routes.js:10 | Đầy đủ | OWNER-REPORTED MANUAL PASS |

### 2.7 Wallet (4) — chỉ xem

| ID | Role | Chức năng | Method | Endpoint | Màn hình / điều hướng | Service Mobile | Nguồn BE | Tích hợp | Test |
|---|---|---|---|---|---|---|---|---|---|
| PL-1 | Parent | Danh sách gói | GET | /api/v1/plans | Pill credit (header) hoặc Hồ sơ → Ví & Credit | `billingService.getPlans` (screens/parent/WalletScreen.tsx) | plans/plans.routes.js:13 | Đầy đủ | MANUAL TEST PENDING |
| PL-2 | Parent | Chi tiết gói | GET | /api/v1/plans/:id | Ví → thẻ gói → Xem chi tiết | `billingService.getPlan` | plans/plans.routes.js:14 | Đầy đủ | OWNER-REPORTED MANUAL PASS |
| PL-3 | Parent | Gói hiện tại + mức dùng | GET | /api/v1/subscriptions/me | Ví & Credit | `billingService.getSubscription` | plans/plans.routes.js:20 | Đầy đủ | MANUAL TEST PENDING |
| PL-4 | Parent | Lịch sử credit | GET | /api/v1/subscriptions/me/credit-history | Ví & Credit → Xem thêm | `billingService.getCreditHistory` | plans/plans.routes.js:21 | Đầy đủ | MANUAL TEST PENDING |

### 2.8 Admin (13) — `navigation/AdminNavigator.tsx` (tab: Tổng quan · Việc chờ · Tài khoản · Thêm)

| ID | Role | Chức năng | Method | Endpoint | Màn hình / điều hướng | Service Mobile | Nguồn BE | Tích hợp | Test |
|---|---|---|---|---|---|---|---|---|---|
| AD-1 | Admin | Số việc chờ (badge) | GET | /api/v1/admin/overview | Tab Việc chờ / badge | `adminService.getOverview` | admin/admin.routes.js:18 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| AD-12 | Admin | Dashboard tài chính | GET | /api/v1/admin/finance/summary?range | Tab Tổng quan | `adminService.getFinanceSummary` | admin/admin.routes.js:107 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| AD-2 | Admin | Danh sách tài khoản | GET | /api/v1/admin/accounts | Tab Tài khoản | `adminService.getAccounts` | admin/admin.routes.js:21 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| AD-3 | Admin | Khóa/mở tài khoản | PATCH | /api/v1/admin/accounts/:userId | Tài khoản → Khóa/Mở | `adminService.setAccountActive` | admin/admin.routes.js:27 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| AD-4 | Admin | Tạo tài khoản Chuyên gia | POST | /api/v1/admin/accounts/moderators | Tài khoản → Tạo Chuyên gia | `adminService.createSpecialist` | admin/admin.routes.js:33 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| AD-16 | Admin | Yêu cầu rút tiền | GET | /api/v1/admin/withdrawals?status | Việc chờ → Rút tiền | `adminService.getWithdrawals` | market/withdrawals.routes.js:39 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| AD-17 | Admin | Đánh dấu đã chuyển tiền | POST | /api/v1/admin/withdrawals/:id/mark-paid | Rút tiền → Đã chuyển | `adminService.markWithdrawalPaid` | market/withdrawals.routes.js:45 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| AD-18 | Admin | Từ chối rút tiền | POST | /api/v1/admin/withdrawals/:id/reject | Rút tiền → Từ chối | `adminService.rejectWithdrawal` | market/withdrawals.routes.js:51 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| AD-10 | Admin | Yêu cầu hoàn tiền | GET | /api/v1/admin/refunds?status | Việc chờ → Hoàn tiền | `adminService.getRefunds` | admin/admin.routes.js:93 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| AD-11 | Admin | Quyết định hoàn tiền | POST | /api/v1/admin/refunds/:refundId/decision | Hoàn tiền → Duyệt/Từ chối | `adminService.decideRefund` | admin/admin.routes.js:99 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| AD-19 | Admin | Kháng nghị cảnh cáo | GET | /api/v1/admin/appeals?status | Việc chờ / Thêm → Kháng nghị cảnh cáo | `adminService.getAppeals` | monitoring/monitoring.routes.js:131 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| AD-20 | Admin | Quyết định kháng nghị | POST | /api/v1/admin/appeals/:appealId/decision | Kháng nghị → Chấp nhận/Bác | `adminService.decideAppeal` | monitoring/monitoring.routes.js:138 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| AD-15 | Admin | Nhật ký kiểm toán | GET | /api/v1/admin/audit-logs?action&page | Thêm → Nhật ký kiểm toán | `adminService.getAuditLogs` | admin/admin.routes.js:117 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |

### 2.9 Specialist (12) — `navigation/SpecialistNavigator.tsx` (tab: Hàng chờ · Người bán · Báo cáo · Thêm)

| ID | Role | Chức năng | Method | Endpoint | Màn hình / điều hướng | Service Mobile | Nguồn BE | Tích hợp | Test |
|---|---|---|---|---|---|---|---|---|---|
| MD-3 | Specialist | Hàng chờ duyệt | GET | /api/v1/moderation/submissions | Tab Hàng chờ | `moderationService.getQueue` | publishing/publishing.routes.js:22 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| MD-5 | Specialist | Xem bài duyệt | GET | /api/v1/moderation/submissions/:reviewId | Hàng chờ → mở bài | `moderationService.getReview` | publishing/publishing.routes.js:24 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| MD-4 | Specialist | Nhận bài | POST | /api/v1/moderation/submissions/:reviewId/claim | Bài duyệt → Nhận bài | `moderationService.claimReview` | publishing/publishing.routes.js:23 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| MD-6 | Specialist | Đánh dấu đã xem trang | POST | /api/v1/moderation/submissions/:reviewId/pages/:pageId/view | Bài duyệt → từng trang | `moderationService.viewPage` | publishing/publishing.routes.js:25 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| MD-7 | Specialist | Quyết định duyệt | POST | /api/v1/moderation/submissions/:reviewId/decision | Bài duyệt → Duyệt/Yêu cầu sửa/Từ chối | `moderationService.decide` | publishing/publishing.routes.js:26 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| MD-1 | Specialist | Hồ sơ người bán | GET | /api/v1/moderation/sellers?status | Tab Người bán | `moderationService.getSellerApplications` | publishing/publishing.routes.js:20 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| MD-2 | Specialist | Duyệt/từ chối người bán | POST | /api/v1/moderation/sellers/:userId/decision | Người bán → Duyệt/Từ chối | `moderationService.decideSeller` | publishing/publishing.routes.js:21 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| MD-13 | Specialist | Báo cáo vi phạm | GET | /api/v1/moderation/reports?status | Tab Báo cáo | `moderationService.getReportGroups` | monitoring/monitoring.routes.js:22 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| MD-14 | Specialist | Bỏ qua báo cáo | POST | /api/v1/moderation/reports/:reportId/dismiss | Báo cáo → Bỏ qua | `moderationService.dismissReport` | monitoring/monitoring.routes.js:28 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| MD-16 | Specialist | Tạm gỡ truyện đang bán | POST | /api/v1/moderation/listings/:listingId/suspend | Báo cáo → Tạm gỡ | `moderationService.suspendListing` | monitoring/monitoring.routes.js:41 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| MD-18 | Specialist | Cảnh cáo tác giả | POST | /api/v1/moderation/strikes | Báo cáo → Cảnh cáo | `moderationService.issueStrike` | monitoring/monitoring.routes.js:54 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |
| MD-23 | Specialist | Ẩn đánh giá vi phạm | POST | /api/v1/moderation/product-reviews/:reviewId/hide | Báo cáo → Ẩn đánh giá | `moderationService.hideProductReview` | reviews/reviews.routes.js:57 | Đầy đủ | MANUAL TEST PENDING (FIXTURE PASS) |

Tổng: 14 + 10 + 7 + 9 + 8 + 5 + 4 + 13 + 12 = **82**.

---

## 3. Kết quả kiểm thử thủ công của chủ dự án

| Nhóm | Endpoint | Nhãn | Bằng chứng |
|---|---|---|---|
| Phase 2 (truy cập được) | AU-6, AU-7, AU-13, AU-14, CR-3, EQ-1, EQ-2, EQ-3, KD-1, PL-2 (10) | **OWNER-REPORTED MANUAL PASS** | Chủ dự án xác nhận "chức năng đã test chạy đúng". Không có log request, ảnh chụp hay kết quả từng test ID |
| Phase 2 một phần | KD-5 | **PARTIAL** | Chỉ phần đồng bộ lại trong phiên. Khôi phục sau khi khởi động lại app chưa làm, nên không tính PASS |
| Phase 2 đã gỡ | SYS-1 `GET /health` | Không còn UI | Nút đã gỡ khỏi Cài đặt sau Phase 2; không tính là đã nối |
| Sau Phase 2 (đã duyệt `expo-audio`) | KD-3 `GET /kid/ui-audio` | **IMPLEMENTED — MANUAL TEST PENDING** | Mới nối; chưa kiểm thử |
| Phase 1 | CH-3, CH-9, CH-10, CH-11, BS-1, BS-3, BS-4 (7) | **MANUAL TEST PENDING** (ghi chú: chủ dự án báo đã kiểm thử Phase 1, chưa cung cấp kết quả chi tiết) | Chủ dự án có thể nâng lên OWNER-REPORTED MANUAL PASS sau khi ghi kết quả vào §4 |
| Phase 1 bị hoãn | CH-7 avatar | **DEFERRED** | Không có UI |
| 63 endpoint cũ (trừ 5 OWNER-RESERVED) | 58 | **MANUAL TEST PENDING** | Một số có "PASS lịch sử" (MOBILE_STATUS.md); Admin/Specialist chỉ FIXTURE PASS. Không phải bằng chứng hiện tại |
| Luồng AI/truyện đã nối | ST-1, ST-2, ST-3, ST-19, ST-22 | **OWNER-RESERVED** | Chỉ chủ dự án quyết định có kiểm thử hay không |

Không endpoint nào được ghi **REAL E2E VERIFIED**.

**Ghi nhận 2026-10-29 (trước khi đẩy lên `main`):**
- Chủ dự án báo đã hoàn tất kiểm thử thủ công các chức năng Mobile và duyệt đẩy code Phase 1–3 lên `main`.
- Xác nhận này là **chung**, không kèm danh sách test ID, kết quả từng bước hay bằng chứng (log/ảnh). Vì vậy nhãn từng endpoint ở trên **giữ nguyên**: chỉ 10 endpoint Phase 2 đã được xác nhận riêng là OWNER-REPORTED MANUAL PASS.
- Để nâng nhãn các endpoint còn lại (Phase 1, KD-3 âm thanh, hồi quy §4.10, 58 endpoint cũ), chủ dự án điền cột Kết quả ở §4 hoặc nêu rõ danh sách đã kiểm.

---

## 4. Checklist kiểm thử thủ công

Quy ước chung:
- **Môi trường:** BE + PostgreSQL chạy; `EXPO_PUBLIC_API_URL` trỏ BE dev (Cài đặt không còn khu đổi máy chủ).
- **Tài khoản QA:** Parent QA có 2 bé A, B và ≥1 nhân vật; Admin QA; Specialist QA.
- **Theo dõi request:** log BE hoặc network inspector.
- **Chi phí:** "Không" = không tiêu credit, không gọi dịch vụ ngoài. "Email" = BE gửi email thật qua nhà cung cấp. "AI/credit" = tiêu credit + gọi AI provider.
- **Cột Kết quả / Ghi chú / Bằng chứng:** để trống cho chủ dự án ghi (PASS/FAIL, ghi chú, đường dẫn ảnh/log).

### 4.1 Auth

| Test ID | Role | Điều kiện & dữ liệu | Các bước | Request mong đợi | Kết quả hiển thị mong đợi | Thay đổi BE | Chi phí | Kết quả | Ghi chú | Bằng chứng |
|---|---|---|---|---|---|---|---|---|---|---|
| T-AU-01 | Khách | Email mới | Đăng nhập → Đăng ký ngay → điền → Đăng ký | POST /auth/register → 201 | Vào Parent | Tạo user | Không | | | |
| T-AU-02 | Parent | Parent QA | Nhập email/username + mật khẩu → Đăng nhập; thử mật khẩu sai | POST /auth/login → 200 / 401 | Vào Trang chủ / thông báo lỗi | Không | Không | | | |
| T-AU-03 | Parent | Đã đăng nhập | Mở lại app | GET /auth/me → 200 | Giữ phiên, hiện số dư credit | Không | Không | | | |
| T-AU-04 | Parent | Access token hết hạn (đợi hết hạn hoặc chỉnh TTL dev) | Thao tác bất kỳ | 401 → POST /auth/refresh-tokens → lặp lại request | Không bị đăng xuất | Token mới | Không | | | |
| T-AU-05 | Parent | — | Hồ sơ → Đăng xuất | POST /auth/logout → 200 | Về màn Đăng nhập | Thu hồi refresh token | Không | | | |
| T-AU-06 | Khách | Email QA đã đăng ký + email lạ | Quên mật khẩu? → nhập email → Gửi mã | POST /auth/forgot-password (không Authorization) | Cùng một câu cho mọi email, sang bước nhập mã | Tạo token reset | **Email** | | | |
| T-AU-07 | Khách | Mã trong email | Bước 2: mã + mật khẩu mới ×2 → Đặt lại | POST /auth/reset-password → 200 / 400 | "Đã đặt lại mật khẩu…" | **Đổi mật khẩu, thu hồi mọi phiên** | Không | | | |
| T-AU-08 | Parent | — | Cài đặt → Đổi mật khẩu | PUT /auth/change-password → 200 / 400 | "Đã đổi mật khẩu." / lỗi | Đổi mật khẩu | Không | | | |
| T-AU-09 | Parent | Tài khoản chưa có PIN, rồi đã có PIN | Cài đặt → Mã PIN → Đặt/Đổi | POST /auth/kid-pin/set · PUT /auth/kid-pin/change | Nhãn "Đã đặt" | Lưu hash PIN | Không | | | |
| T-AU-10 | Parent | Có PIN, có bé | Vào Chế độ Bé → Thoát → PIN sai rồi đúng | POST /auth/kid-mode/enter · POST /auth/kid-mode/exit (401 "còn N lần" / 200) | Vào Kid; thoát về Parent | Token kid_session tạo/tiêu thụ | Không | | | |
| T-AU-11 | Parent | Email chưa xác thực | Cài đặt → Xác thực email → Gửi mã; bấm lại ngay | POST /auth/send-verification-email → 200 `{retryAfterSeconds:60}` | Nút khóa 60 giây | Tạo token | **Email** | | | |
| T-AU-12 | Parent | Mã trong email | Nhập mã → Xác thực | POST /auth/verify-email → 200 / 400 | Nhãn "Đã xác thực" | `email_verified_at` | Không | | | |

### 4.2 Parent

| Test ID | Role | Điều kiện & dữ liệu | Các bước | Request mong đợi | Kết quả hiển thị mong đợi | Thay đổi BE | Chi phí | Kết quả | Ghi chú | Bằng chứng |
|---|---|---|---|---|---|---|---|---|---|---|
| T-PA-01 | Parent | Parent QA | Đăng nhập | GET /children, /characters, /stories?page=1&limit=100, /topics | Không có dải lỗi; dữ liệu khớp DB | Không | Không | | | |
| T-PA-02 | Parent | Bé A | Tab Trang chủ, đổi bé | GET /children/{id}/overview | Số liệu hero đúng bé đang chọn | Không | Không | | | |
| T-PA-03 | Parent | — | Bé nhà mình → Thêm / Sửa / Xóa (xác nhận) | POST /children · PUT /children/{id} · DELETE /children/{id} | Danh sách cập nhật; vượt hạn mức gói → lỗi BE | Tạo/sửa/xóa mềm bé | Không | | | |
| T-PA-04 | Parent | — | Nhân vật gia đình → Thêm / Sửa / Xóa | POST/PUT/DELETE /characters[/{id}] | Lưới cập nhật; nhân vật đại diện của bé không có nút Xóa | Tạo/sửa/xóa | Không | | | |
| T-PA-05 | Parent | ≥1 nhân vật | Nhân vật gia đình → Chi tiết | GET /characters/{id} | Sheet chỉ đọc, không có nút vẽ | Không | Không | | | |

### 4.3 Child / Bookshelf

| Test ID | Role | Điều kiện & dữ liệu | Các bước | Request mong đợi | Kết quả hiển thị mong đợi | Thay đổi BE | Chi phí | Kết quả | Ghi chú | Bằng chứng |
|---|---|---|---|---|---|---|---|---|---|---|
| T-CB-01 | Parent | Bé A | Bé nhà mình → Chi tiết | GET /children/{A}; GET /children/{A}/usage?date=…; GET /children/{A}/bookshelf?page=1&limit=3&status=all | Hồ sơ, thời gian đọc, đếm tủ sách đúng bé A | Không | Không | | | |
| T-CB-02 | Parent | Bé A | Chi tiết bé → chip Hôm qua / ngày khác | GET /children/{A}/usage?date=YYYY-MM-DD | Đúng ngày; ngày không đọc → trạng thái trống | Không | Không | | | |
| T-CB-03 | Parent | Bé A có >20 truyện (tùy) | Tủ truyện → Tủ sách của A → lọc → Tải thêm → đổi bé | GET /bookshelf?childId={A}&page=…&limit=20&status=… | Đúng bé, đúng trạng thái, không lẫn bé | Không | Không | | | |
| T-CB-04 | Parent | Truyện S đã hoàn tất + đủ giọng đọc; A chưa có S, B đã có | Tủ truyện → mở S → khối "Tủ sách của các bé" → Thêm (bé A) | GET /bookshelf/check/{S}; POST /bookshelf {childId:A, storyId:S} → 201; check lại | A chuyển "Đã có trên tủ"; truyện chưa sẵn sàng → Dialog lý do 422 | Thêm `bookshelf_items` | Không | | | |
| T-CB-05 | Parent | Như trên | Tủ truyện → "⋯" → Thêm vào tủ sách (bé đang chọn) | POST /bookshelf | Toast thành công / Dialog 422 | Thêm (idempotent) | Không | | | |
| T-CB-06 | Parent | A có S | Chi tiết truyện S → Gỡ (bé A) → Hủy, rồi Gỡ khỏi tủ | Hủy: không request; đồng ý: DELETE /bookshelf/{S}?childId={A} → 200 | A "Chưa có trên tủ"; B không đổi | Xóa đúng 1 dòng; truyện + lịch sử đọc giữ nguyên | Không | | | |
| T-CB-07 | Parent | A có ≥1 truyện | Tủ sách của A → Gỡ một truyện; bấm liên tục | Một DELETE duy nhất | Truyện biến mất; nút khác bị khóa khi đang gửi | Như trên | Không | | | |

### 4.4 Story / Library

| Test ID | Role | Điều kiện & dữ liệu | Các bước | Request mong đợi | Kết quả hiển thị mong đợi | Thay đổi BE | Chi phí | Kết quả | Ghi chú | Bằng chứng |
|---|---|---|---|---|---|---|---|---|---|---|
| T-ST-01 | Parent | Có truyện ở nhiều trạng thái | Tab Tủ truyện → lọc + tìm | (dữ liệu từ GET /stories) | Lọc/tìm đúng | Không | Không | | | |
| T-ST-02 | Parent | Truyện đã viết xong | Chạm truyện | GET /stories/{id} | Trang, điểm dừng, trạng thái | Không | Không | | | |
| T-ST-03 | Parent | Truyện có trang, chưa xem lại | Chi tiết → Hoàn tất xem lại | POST /stories/{id}/review → 200 / 422 kèm errors[] | Nhãn "Đã xem lại" / danh sách lý do | `reviewed_at` | Không | | | |
| T-ST-04 | Parent | Truyện có trang | Chi tiết → Đọc thử | (không request; TTS thiết bị) | Trình đọc mở toàn màn | Không | Không (TTS máy) | | | |
| T-ST-OR | Parent | **OWNER-RESERVED** | Sáng tác (giá credit, phân tích, tạo, cho AI viết, theo dõi) | GET /stories/ai-pricing; POST /stories/analyze; POST /stories; POST /stories/{id}/generate; GET /stories/{id}/generation | — | Tạo truyện, giữ/trừ credit | **AI/credit** | | Chỉ chủ dự án | |

### 4.5 Kid

| Test ID | Role | Điều kiện & dữ liệu | Các bước | Request mong đợi | Kết quả hiển thị mong đợi | Thay đổi BE | Chi phí | Kết quả | Ghi chú | Bằng chứng |
|---|---|---|---|---|---|---|---|---|---|---|
| T-KD-01 | Kid | Bé có truyện sẵn sàng trên giá | Vào Chế độ Bé | GET /kid/me; GET /kid/bookshelf (Bearer kid_session) | "Chào {tên}!"; tủ sách đúng bé | Không | Không | | | |
| T-KD-02 | Kid | Như trên | Chạm truyện | POST /kid/sessions {storyId} → 201 | Mở đúng trang đang đọc dở | Tạo/tiếp tục `play_sessions` | Không | | | |
| T-KD-03 | Kid | Truyện có điểm dừng | Trang sau…; trả lời cảm xúc sai rồi đúng; bỏ qua một câu | PUT …/progress; POST …/answers | Gợi ý BE trả; kết quả "Giỏi quá" / đáp án | Lưu tiến độ + câu trả lời (điểm EQ) | Không | | | |
| T-KD-04 | Kid | Trang cuối | Đọc xong | POST …/complete | "Bé đọc xong rồi!" | Đóng lượt đọc | Không | | | |
| T-KD-05 | Kid | Đang đọc | Tắt BE → thao tác lỗi → bật BE → Tải lại lượt đọc | GET /kid/sessions/{id} → 200 | Lỗi biến mất, đúng trang/câu đã trả lời | Không | Không | | PARTIAL | |
| T-KD-06 | Kid | Phiên kid bị thu hồi/hết hạn | Vào/ở Chế độ Bé | GET /kid/me → 401 | Thanh "Phiên Chế độ Bé không còn hợp lệ" + Đăng nhập lại; ẩn nội dung | Không | Không | | | |
| T-KD-07 | Kid | BE đã seed `ui_audio_assets` (có `audioUrl`) | Vào Chế độ Bé → mở truyện có điểm dừng cảm xúc → tới điểm dừng → **Nghe** | GET /kid/ui-audio (Bearer kid_session) một lần khi vào; bấm Nghe **không** tạo request API (chỉ tải file từ Cloudinary) | Phát "Con chọn một khuôn mặt nhé."; nhãn nút "Đang đọc…" rồi về "Nghe"; chữ câu hỏi vẫn hiện | Không | Không (file có sẵn) | | NOT TESTED — OWNER MANUAL QA | |
| T-KD-08 | Kid | Như trên | Chọn sai lần đầu → **Nghe** trong hộp gợi ý; trả lời xong → **Nghe** lời khen / đáp án; bấm Nghe liên tục; bấm hai nút khác nhau liền nhau | Không có POST /answers nào do bấm Nghe | Mỗi lúc chỉ một tiếng (câu mới cắt câu cũ); không chọn đáp án thay bé; tiến độ trang không đổi | Không | Không | | NOT TESTED — OWNER MANUAL QA | |
| T-KD-09 | Kid | (a) BE chưa seed / `audioUrl` null; (b) tắt mạng khi bấm Nghe | Tới điểm dừng | (a) GET /kid/ui-audio → assets rỗng/không có URL | (a) Không có nút Nghe, Kid Mode dùng bình thường; (b) im lặng hoặc chữ "Chưa phát được âm thanh, bé đọc chữ nhé.", vẫn trả lời/đọc tiếp được | Không | Không | | NOT TESTED — OWNER MANUAL QA | |
| T-KD-10 | Kid | Đang phát | Bấm Thoát (mở khóa PIN) / Tiếp tục / Trang trước / Về tủ sách; rồi thoát bằng PIN đúng | POST /auth/kid-mode/exit khi nhập PIN | Âm thanh dừng ngay khi mở khóa PIN hoặc rời điểm dừng; thoát PIN như cũ; không còn tiếng sau khi về Parent | Không | Không | | NOT TESTED — OWNER MANUAL QA | |

### 4.6 EQ

| Test ID | Role | Điều kiện & dữ liệu | Các bước | Request mong đợi | Kết quả hiển thị mong đợi | Thay đổi BE | Chi phí | Kết quả | Ghi chú | Bằng chứng |
|---|---|---|---|---|---|---|---|---|---|---|
| T-EQ-01 | Parent | Bé có/không có câu trả lời | Tab Tiến độ, đổi bé | GET /children/{id}/eq-report; GET /children/{id}/eq-journey?weeks=8 | Mức 5 năng lực; xu hướng 8 tuần hoặc "Chưa có câu trả lời nào…"; không có % | Không | Không | | | |
| T-EQ-02 | Parent | Seed 5 năng lực + kỹ năng con | Tiến độ → Tìm hiểu 5 năng lực CASEL → chạm một năng lực | GET /eq-skills; GET /eq-skills/{code}; GET /sub-skills?skillId={uuid} | Danh sách, kỹ năng con, chủ đề | Không | Không | | | |

### 4.7 Wallet (chỉ xem)

| Test ID | Role | Điều kiện & dữ liệu | Các bước | Request mong đợi | Kết quả hiển thị mong đợi | Thay đổi BE | Chi phí | Kết quả | Ghi chú | Bằng chứng |
|---|---|---|---|---|---|---|---|---|---|---|
| T-WL-01 | Parent | Có lịch sử credit | Pill credit → Ví & Credit → Xem thêm | GET /subscriptions/me; GET /plans; GET /subscriptions/me/credit-history?page&limit | Gói hiện tại, mức dùng, danh sách gói, lịch sử theo ngày | Không | Không | | | |
| T-WL-02 | Parent | ≥1 gói | Thẻ gói → Xem chi tiết | GET /plans/{id} | Sheet chỉ đọc, không có nút mua | Không | Không | | | |

### 4.8 Admin (chỉ dùng tài khoản/dữ liệu QA)

| Test ID | Role | Điều kiện & dữ liệu | Các bước | Request mong đợi | Kết quả hiển thị mong đợi | Thay đổi BE | Chi phí | Kết quả | Ghi chú | Bằng chứng |
|---|---|---|---|---|---|---|---|---|---|---|
| T-AD-01 | Admin | Admin QA | Đăng nhập → Tổng quan, đổi kỳ | GET /admin/finance/summary?range | Số liệu tài chính | Không | Không | | | |
| T-AD-02 | Admin | — | Việc chờ | GET /admin/overview | Badge rút tiền/hoàn tiền/kháng nghị | Không | Không | | | |
| T-AD-03 | Admin | — | Tài khoản → lọc/tìm | GET /admin/accounts?… | Danh sách đúng bộ lọc | Không | Không | | | |
| T-AD-04 | Admin | Tài khoản QA phụ | Khóa rồi mở; Tạo Chuyên gia | PATCH /admin/accounts/{id}; POST /admin/accounts/moderators | Trạng thái đổi; tài khoản mới | **Khóa → thu hồi phiên; tạo user** | Không | | | |
| T-AD-05 | Admin | — | Việc chờ → Rút tiền / Hoàn tiền / Kháng nghị (chỉ xem) | GET /admin/withdrawals · /admin/refunds · /admin/appeals | Danh sách theo trạng thái | Không | Không | | | |
| T-AD-06 | Admin | **Bản ghi QA giả lập** | Rút tiền → Đã chuyển/Từ chối; Hoàn tiền → quyết định; Kháng nghị → quyết định | POST …/mark-paid · …/reject · /refunds/{id}/decision · /appeals/{id}/decision | Trạng thái cập nhật | **Đổi trạng thái tiền/người bán** (không chuyển tiền thật, nhưng ghi sổ) | Tác động tài chính trên dữ liệu | | | |
| T-AD-07 | Admin | — | Thêm → Nhật ký kiểm toán | GET /admin/audit-logs?action&page | Nhật ký | Không | Không | | | |

### 4.9 Specialist (chỉ dùng dữ liệu QA)

| Test ID | Role | Điều kiện & dữ liệu | Các bước | Request mong đợi | Kết quả hiển thị mong đợi | Thay đổi BE | Chi phí | Kết quả | Ghi chú | Bằng chứng |
|---|---|---|---|---|---|---|---|---|---|---|
| T-SP-01 | Specialist | Specialist QA | Hàng chờ → mở bài | GET /moderation/submissions; GET …/{reviewId} | Danh sách + chi tiết | Không | Không | | | |
| T-SP-02 | Specialist | Bài QA | Nhận bài → xem từng trang → quyết định | POST …/claim · …/pages/{pageId}/view · …/decision | Tiến độ xem 100% rồi mới duyệt được | **Giữ bài; quyết định đổi trạng thái bản bán** | Không | | | |
| T-SP-03 | Specialist | — | Tab Người bán (xem) | GET /moderation/sellers?status | Danh sách | Không | Không | | | |
| T-SP-04 | Specialist | Hồ sơ QA | Duyệt/Từ chối người bán | POST /moderation/sellers/{userId}/decision | Trạng thái đổi | **Cấp/thu quyền bán** | Không | | | |
| T-SP-05 | Specialist | — | Tab Báo cáo (xem) | GET /moderation/reports?status | Nhóm báo cáo | Không | Không | | | |
| T-SP-06 | Specialist | Báo cáo/listing/review QA | Bỏ qua / Tạm gỡ / Cảnh cáo / Ẩn đánh giá | POST …/dismiss · /listings/{id}/suspend · /strikes · /product-reviews/{id}/hide | Trạng thái đổi | **Gỡ listing, cảnh cáo người bán, ẩn review** | Không | | | |

### 4.10 Hồi quy sau khi xóa `AuthModal` (không đổi API, chỉ xác nhận luồng auth còn nguyên)

| Test ID | Role | Các bước | Request mong đợi | Kết quả mong đợi | Kết quả | Ghi chú | Bằng chứng |
|---|---|---|---|---|---|---|---|
| T-RG-01 | Parent | Đăng nhập | POST /auth/login | Vào Trang chủ Parent | | NOT TESTED — OWNER MANUAL QA | |
| T-RG-02 | Parent | Hồ sơ → Đăng xuất | POST /auth/logout | Về màn Đăng nhập | | NOT TESTED — OWNER MANUAL QA | |
| T-RG-03 | Khách | Đăng ký tài khoản mới | POST /auth/register | Vào Parent | | NOT TESTED — OWNER MANUAL QA | |
| T-RG-04 | Khách | Quên mật khẩu? → gửi mã → đặt lại (email QA) | POST /auth/forgot-password, /auth/reset-password | Như T-AU-06/07 | | NOT TESTED — OWNER MANUAL QA | |
| T-RG-05 | Parent | Cài đặt → Đặt/Đổi mã PIN | POST /auth/kid-pin/set · PUT /auth/kid-pin/change | "Đã đặt/đổi mã PIN." | | NOT TESTED — OWNER MANUAL QA | |
| T-RG-06 | Parent→Kid | Vào Chế độ Bé → Thoát bằng PIN (sai rồi đúng) | POST /auth/kid-mode/enter · /exit | Vào/thoát như cũ | | NOT TESTED — OWNER MANUAL QA | |
| T-RG-07 | Admin / Specialist | Đăng nhập bằng tài khoản Admin QA, rồi Specialist QA | POST /auth/login | Admin → khung Admin (Tổng quan…); Specialist → khung Hàng chờ | | NOT TESTED — OWNER MANUAL QA | |

---

## 5. Việc còn lại

| Hạng mục | Endpoint | Trạng thái | Cần gì |
|---|---|---|---|
| Ảnh đại diện bé | CH-7 `PUT /children/:id/avatar` | **DEFERRED** | BE chỉ nhận `portraitImageKey` (khóa file đã lưu) + `appearance`; BE không có API upload; Mobile không có `expo-image-picker`. Gửi chuỗi rỗng có thể gỡ nhân vật/chân dung đã trả phí. Chủ dự án chọn: (a) thêm upload ở BE + picker, (b) chỉ sửa `appearance` (trùng PUT /children/:id), hoặc (c) để chân dung đi luồng AI do chủ dự án giữ |
| Âm thanh giao diện Kid | KD-3 `GET /kid/ui-audio` | **IMPLEMENTED — MANUAL TEST PENDING** | Giới hạn: chỉ dùng 5 khóa ở điểm dừng; chưa dùng `emotion.*`, `prompt.next_page`, `prompt.story_end`; không tự phát (§7.1) |
| Khôi phục lượt đọc sau khi khởi động lại app | KD-5 | **PARTIAL** | Native `safeStorage` chỉ lưu trong bộ nhớ, và app không khôi phục Kid Mode lúc boot. Cần storage bền (dependency mới) + sửa `useKidSession`/`SessionProvider` (vùng auth dùng chung) |
| Kiểm tra máy chủ | SYS-1 `GET /health` | **Đã gỡ UI theo yêu cầu** | Endpoint BE giữ nguyên; `systemService` đã xóa; không còn nơi gọi trên Mobile |
| Chân dung nhân vật AI | CR-6 `POST /characters/:id/portrait` | **OWNER-RESERVED** | — |
| Sửa / xóa truyện, trang, điểm dừng, bìa, nhân vật trong truyện | ST-6 … ST-15 | **OWNER-RESERVED** | Nút "Chỉnh sửa (chưa hỗ trợ)" giữ nguyên |
| Thử lại giọng đọc server | ST-17 `POST /stories/:id/narration/retry` | **OWNER-RESERVED** | — |
| Tranh AI | ST-20 `POST /stories/:id/images`, ST-21 `POST /stories/:id/scenes/:sceneId/image` | **OWNER-RESERVED** | Wizard không gửi `useAiImage` (BE mặc định `false`), nên truyện tạo từ Mobile không có tranh |
| Đăng bán phiên bản | ST-18 `POST /stories/:id/publish-version` | BE STUB (501) | — |
| Trả bài đang giữ (Specialist) | — | BE **không có** API | Bài chỉ tự hết hạn giữ |

Rủi ro và giới hạn hiện có:
- **`useAiImage` không được gửi** (C1 audit): truyện tạo từ Mobile không có tranh. Thuộc luồng owner-reserved.
- **Giọng đọc:** Mobile bỏ qua `audioUrl` của server và dùng TTS thiết bị (C2).
- **Danh sách truyện** bị cắt im lặng ở 10 trang × 100 truyện (C4).
- **Kiểu dữ liệu Admin:**
  - Kiểu trạng thái rút tiền thiếu `processing`/`cancelled` (C5).
  - `toQuery` bỏ giá trị `'all'`, sẽ thành lỗi nếu sau này thêm tab "Tất cả" cho Hoàn tiền/Kháng nghị (C6).
- **`kidFetch`** không coi 403 là mất phiên Kid (C8). Riêng `GET /kid/me` vẫn chặn đúng khi 401 hoặc khác bé.
- **`GET /plans/:id`:** BE không validate id (id lạ → 500). Mobile chỉ dùng id lấy từ `/plans`.
- **Email:** AU-6 và AU-13 gửi email thật. AU-7 thu hồi mọi phiên của tài khoản.
- **EQ:** màn Tiến độ gọi cả `eq-report` và `eq-journey`, nên BE tính báo cáo hai lần.
- **Hai endpoint tủ sách cùng dữ liệu:** `GET /children/:id/bookshelf` (Chi tiết bé) và `GET /bookshelf` (Tủ truyện) trả cùng dữ liệu, khác envelope.
- **Truyện đã mua** trên tủ sách không mở được Chi tiết truyện (chỉ gỡ được).
- **`AuthModal.tsx`** đã xóa (§7.2). Cần chạy checklist hồi quy §4.10.
- **`expo-audio` 0.3.5** (SDK 52): Kid UI Audio cần build/Expo Go có module native này. Expo Go SDK 52 có sẵn. Bản build native (dev client/EAS) phải build lại sau khi thêm package.

---

## 6. Thứ tự kiểm thử thủ công đề xuất

Claude không thực hiện bước nào dưới đây; chủ dự án tự chạy.

1. **Parent/Auth chỉ đọc**:
   - T-AU-02, T-AU-03, T-AU-04, T-PA-01, T-PA-02, T-PA-05.
   - T-ST-01, T-ST-02, T-EQ-01, T-EQ-02, T-WL-01, T-WL-02.
2. **Child/Bookshelf**:
   - Chỉ đọc: T-CB-01, T-CB-02, T-CB-03.
   - Ghi trên dữ liệu QA: T-CB-04, T-CB-05, T-CB-06, T-CB-07.
3. **Kid Reader**: T-AU-09 (PIN) → T-AU-10 (vào/thoát) → T-KD-01 → T-KD-02 → T-KD-03 → T-KD-04 → T-KD-05 → T-KD-06 → **T-KD-07 … T-KD-10 (âm thanh)**.
   Ngay sau bước 3: **hồi quy §4.10** (sau khi xóa AuthModal).
4. **Admin chỉ đọc**: T-AD-01, T-AD-02, T-AD-03, T-AD-05, T-AD-07.
5. **Specialist chỉ đọc**: T-SP-01 (không bấm Nhận bài), T-SP-03, T-SP-05.
6. **Thao tác ghi đã được phép trên dữ liệu QA**:
   - Parent: T-PA-03, T-PA-04, T-ST-03, T-AU-08.
   - Auth: T-AU-01, T-AU-05; T-AU-06, T-AU-07 (email); T-AU-11, T-AU-12 (email).
   - Admin: T-AD-04, T-AD-06.
   - Specialist: T-SP-02, T-SP-04, T-SP-06.
7. **Luồng AI và trả phí (chỉ khi chủ dự án quyết định)**: T-ST-OR. Cần Redis + worker + AI service + provider, và sẽ tiêu credit.

---

## 7. Thay đổi chốt Phase 3

### 7.1 Kid UI Audio — `GET /api/v1/kid/ui-audio` (IMPLEMENTED — MANUAL TEST PENDING)

Contract BE (đã đọc source, chỉ đọc):
- `kid/kid.routes.js:8,12`: `router.use(kidAuth)`, nên chỉ nhận token `kid_session`.
- `kid.controller.getUiAudio` → `kid.service.getUiAudio`: đọc bảng `ui_audio_assets` (`lang='vi'`) và trả `data { assets: { [key]: { text, audioUrl } } }`.
- `audioUrl = assetUrl(audioKey)` (`clients/assetUrl.js`) là link Cloudinary "authenticated" có chữ ký, **không hết hạn**. Không có `audioKey` → `null`.
- File được tạo **sẵn** bằng `BE/api/scripts/seed-ui-audio.js` (12 khóa `emotion.*`, `prompt.*`). Endpoint chỉ đọc, không tạo âm thanh.
- Bảng rỗng → `assets = {}`.

Mobile:
- **Dependency:** `expo-audio ~0.3.5`, đúng phiên bản Expo SDK 52 ghim trong `expo/bundledNativeModules.json` (module có sẵn trong Expo Go SDK 52). Cài bằng `npx expo install expo-audio`, không nâng Expo/React/RN. `npx expo install --check`: "Dependencies are up to date".
- **Cấu hình:** `app.json` thêm plugin `["expo-audio", { "microphonePermission": false }]` để **không** xin quyền micro/ghi âm (app chỉ phát).
- **Luồng:** `KidModeScreen` → `useKidUiAudio(source, !preview)` → `kidService.getUiAudio` (`kidFetch`, chỉ token kid_session) → `KidReader` → `KidCheckpointCard` nút **Nghe**.
- **Khi nào nút hiện:** chỉ khi khóa đó có `audioUrl` http(s).

| Vị trí | Khóa BE | Khi nào hiện nút "Nghe" |
|---|---|---|
| Dưới câu hỏi điểm dừng cảm xúc | `prompt.choose_emotion` | Điểm dừng `emotion_self` / `emotion_other` chưa xong |
| Dưới câu hỏi suy ngẫm | `prompt.reflection` | Điểm dừng `reflection` chưa xong |
| Sau hộp gợi ý | `prompt.try_again` | Chọn sai lần đầu (BE trả `hint`) |
| Kết quả | `prompt.correct` / `prompt.answer_is` | `correct === true` / `false` |

Hành vi:
- **Nạp:** gọi API **một lần** khi vào Kid Mode (không gọi lại khi đổi trang).
- **Phát:** không tự phát; chỉ phát khi bé bấm. **Một** player dùng chung: bấm câu mới thì `pause` + `replace`, không chồng tiếng; bấm nhanh liên tục an toàn.
- **Dừng:** khi đổi/đóng điểm dừng, đổi lượt đọc, mở khóa PIN. Rời Kid Mode thì `player.remove()` giải phóng tài nguyên.
- **Lỗi:**
  - Không có file / API lỗi / rỗng → không có nút, chữ vẫn hiện, Kid Mode dùng bình thường.
  - Phát lỗi ngay khi tạo player → chữ "Chưa phát được âm thanh, bé đọc chữ nhé."
- **Không đổi:** nút Nghe không gọi `onChoose/onSkip/onContinue`. Luồng PIN, phiên Kid, đổi trang, trả lời, hoàn thành, ghi EQ giữ nguyên (`useKidReader.ts`, `KidPinOverlay.tsx` không sửa trong việc này). UI Preview (dev) không gọi API này.

Giới hạn:
- Chưa dùng `emotion.*` (tên 5 cảm xúc), vì nút cảm xúc là nút trả lời; thêm nút nghe vào đó dễ bấm nhầm. Chưa dùng `prompt.next_page`, `prompt.story_end`.
- Lỗi tải file **sau** khi bắt đầu phát (URL hỏng, mất mạng giữa chừng) không được phát hiện riêng: chỉ im lặng, chữ vẫn hiện.
- iOS: đặt `playsInSilentMode: true` (best-effort).
- Chưa thử trên thiết bị thật.

### 7.2 Xóa `AuthModal.tsx` (legacy)

Bằng chứng trước khi xóa:
- `grep -rn AuthModal` trong `apps/mobile` (trừ `node_modules`): chỉ có chính file và test `r9a.test.ts` (J1). Không có import, barrel export, `import()` động, route hay render nào.
- File tự ghi "DEPRECATED (Phase B): không còn được mount".

Đã làm:
- Xóa `src/components/auth/AuthModal.tsx`.
- Test J1 trong `tests/r9a.test.ts` đổi thành: file không còn tồn tại và không file nào trong `src/` nhắc tới `AuthModal`.
- `tests/README.md` sửa một cụm mô tả J1.

Không đụng: LoginScreen, RegisterScreen, ForgotPasswordSheet, Cài đặt (mật khẩu/PIN), `authService`, `SessionProvider`, `useAuthSession`, `useKidSession`. Không endpoint nào mất nơi gọi. Tài liệu lịch sử nhắc AuthModal (`MOBILE_STATUS.md`, `ARCHITECTURE_DECISIONS.md`, `ENVIRONMENT.md`…) giữ nguyên.

### 7.3 Kiểm tra tĩnh (2026-10-29)

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | Không lỗi |
| 13 bộ test offline (`kidUiAudio` bỏ qua phần so khóa BE nếu clone riêng repo App) | Tất cả PASS: authRace 5/5, homeAuth 6/6, kidUi 5/5, **kidUiAudio 5/5**, library 7/7, manage 7/7, management 19/19, navigation 11/11, phase1 4/4, phase2 5/5, r9a 7/7, uiStates 2/2, wizard 6/6 |
| `npx expo install --check` | Dependencies are up to date |
| `npx expo export --platform android` | Bundle thành công (3,03 MB) |

`kidUiAudio.test.ts` dùng fetch giả `http://test.invalid` và kiểm tra:
- Chỉ gửi token kid_session.
- Ánh xạ `assets` đúng.
- Response thiếu `assets` thì báo lỗi (hook bỏ qua).
- `playableUrl` chặn null, rỗng, sai dạng.
- Khóa UI khớp khóa BE seed.
- Nối đúng luồng.
- Nút Nghe không gửi câu trả lời và không có TTS/AI.

Không chạy E2E, không gọi BE thật, không phát âm thanh thật.
